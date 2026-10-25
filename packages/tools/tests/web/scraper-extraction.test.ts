import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestWithDestinationPolicy } from '../../src/web/egress-policy.js';
import { createScraperTools, createWebScraperTool } from '../../src/web/scraper/index.js';
import { elementHtml, resourceHtml } from './fixtures/extraction.js';

vi.mock('../../src/web/egress-policy.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/web/egress-policy.js')>()),
  requestWithDestinationPolicy: vi.fn(),
}));

const request = vi.mocked(requestWithDestinationPolicy);
const url = 'https://requested.test/dir/start';

function respond(
  data: unknown,
  responseUrl: string | undefined = 'https://response.test/elsewhere'
) {
  request.mockResolvedValue({
    data,
    config: { url: responseUrl },
    status: 200,
    statusText: 'OK',
    headers: {},
  });
}

beforeEach(() => {
  request.mockReset();
  respond(elementHtml);
});

describe('public Web Scraper extraction compatibility', () => {
  it('filters empty resources and projects document-wide URL strings using the request URL', async () => {
    respond(resourceHtml);
    expect(
      await createWebScraperTool().invoke({
        url,
        selector: 'b',
        extractLinks: true,
        extractImages: true,
      })
    ).toStrictEqual({
      url: 'https://response.test/elsewhere',
      links: [
        'https://requested.test/page',
        'https://other.test/path',
        'http://[invalid',
        'https://requested.test/page',
      ],
      images: [
        'https://requested.test/photo.png',
        'https://other.test/photo.png',
        'http://[invalid',
        'https://requested.test/photo.png',
      ],
      selected: [{ text: 'link', html: 'link' }],
    });
  });

  it('combines selected text but returns only first-match HTML and per-element selected records', async () => {
    expect(
      await createWebScraperTool().invoke({
        url,
        selector: '.item',
        extractText: true,
        extractHtml: true,
      })
    ).toStrictEqual({
      url: 'https://response.test/elsewhere',
      text: 'First bold  Second & last',
      html: '  First <b>bold</b> ',
      selected: [
        { text: 'First bold', html: '  First <b>bold</b> ' },
        { text: 'Second & last', html: ' Second &amp; last ' },
      ],
    });
  });

  it('falls back to body for omitted or empty selectors and normalizes HTML', async () => {
    respond('<title>Head</title><DIV>Hello<BR/> world</DIV>');
    for (const selector of [undefined, '']) {
      expect(
        await createWebScraperTool().invoke({ url, selector, extractText: true, extractHtml: true })
      ).toStrictEqual({
        url: 'https://response.test/elsewhere',
        text: 'Hello world',
        html: '<div>Hello<br> world</div>',
      });
    }
  });

  it('keeps selected records despite disabled flags and omits unrequested fields', async () => {
    const scraper = createWebScraperTool();
    expect(await scraper.invoke({ url })).toStrictEqual({ url: 'https://response.test/elsewhere' });
    expect(
      await scraper.invoke({
        url,
        selector: '.empty',
        extractText: false,
        extractHtml: false,
        extractLinks: false,
        extractImages: false,
        extractMetadata: false,
      })
    ).toStrictEqual({ url: 'https://response.test/elsewhere', selected: [{ text: '', html: '' }] });
  });

  it('preserves null selected HTML while applying the aggregate empty-string fallback', async () => {
    expect(
      await createWebScraperTool().invoke({
        url,
        selector: '<!--comment-->',
        extractText: true,
        extractHtml: true,
      })
    ).toStrictEqual({
      url: 'https://response.test/elsewhere',
      text: '',
      html: '',
      selected: [{ text: '', html: null }],
    });
  });

  it('uses empty-string HTML fallback for no matches and empty inner HTML', async () => {
    const scraper = createWebScraperTool();
    expect(
      await scraper.invoke({ url, selector: '.absent', extractHtml: true, extractText: true })
    ).toStrictEqual({ url: 'https://response.test/elsewhere', html: '', text: '', selected: [] });
    expect(
      await scraper.invoke({ url, selector: '.empty, .void', extractHtml: true })
    ).toStrictEqual({
      url: 'https://response.test/elsewhere',
      html: '',
      selected: [
        { text: '', html: '' },
        { text: '', html: '' },
      ],
    });
    respond('');
    expect(
      await scraper.invoke({
        url,
        extractHtml: true,
        extractText: true,
        extractLinks: true,
        extractImages: true,
        extractMetadata: true,
      })
    ).toStrictEqual({
      url: 'https://response.test/elsewhere',
      html: '',
      text: '',
      links: [],
      images: [],
      metadata: {},
    });
  });

  it.each([
    [
      '<title>  Page  </title><meta property="og:title" content="OG"><meta name="description" content="Named"><meta property="og:description" content="Social">',
      { title: '  Page  ', description: 'Named', 'og:title': 'OG', 'og:description': 'Social' },
    ],
    [
      '<title></title><meta property="og:title" content="OG"><meta name="description" content=""><meta property="og:description" content="Social">',
      { title: 'OG', description: 'Social', 'og:title': 'OG', 'og:description': 'Social' },
    ],
    [
      '<title> </title><meta property="og:title" content="OG"><meta name="description" content="">',
      { title: ' ', 'og:title': 'OG' },
    ],
    [
      '<title></title><meta property="og:title" content=""><meta name="description" content=""><meta property="og:description" content=""><meta name="missing">',
      {},
    ],
  ])(
    'preserves title/description fallback and metadata placement for %s',
    async (html, metadata) => {
      respond(html);
      expect(
        await createWebScraperTool().invoke({ url, selector: 'body', extractMetadata: true })
      ).toStrictEqual({
        url: 'https://response.test/elsewhere',
        selected: [{ text: '', html: '' }],
        metadata,
      });
    }
  );

  it('preserves duplicate traversal, name-before-property preference, and overwrites after fallback', async () => {
    respond(`<title>Initial</title><meta name="title" content="Overwritten">
      <meta name="description" content="First"><meta property="description" content="Property later"><meta name="description" content="Last">
      <meta name="chosen" property="ignored" content="Named"><meta name="" property="fallback" content="Property">
      <meta name="repeat" content="One"><meta property="repeat" content="Two"><meta name="repeat" content="">
      <meta name="" content="ignored"><meta property="og:title" content="First OG"><meta property="og:title" content="Last OG">`);
    expect(await createWebScraperTool().invoke({ url, extractMetadata: true })).toStrictEqual({
      url: 'https://response.test/elsewhere',
      metadata: {
        title: 'Overwritten',
        description: 'Last',
        chosen: 'Named',
        fallback: 'Property',
        repeat: 'Two',
        'og:title': 'Last OG',
      },
    });
  });

  it('uses the first OG title for fallback even though traversal later overwrites the OG key', async () => {
    respond('<meta property="og:title" content="First"><meta property="og:title" content="Last">');
    expect(await createWebScraperTool().invoke({ url, extractMetadata: true })).toStrictEqual({
      url: 'https://response.test/elsewhere',
      metadata: { title: 'First', 'og:title': 'Last' },
    });
  });

  it('forwards GET, headers, timeout and destination policy through the existing request seam', async () => {
    const policy = { allowPrivateNetwork: true };
    const [scraper] = createScraperTools({
      defaultTimeout: 1234,
      userAgent: 'FixtureBot',
      destinationPolicy: policy,
    });
    for (const [timeout, forwarded] of [
      [undefined, 1234],
      [9876, 9876],
      [0, 1234],
    ] as const) {
      await scraper.invoke({ url, timeout });
      expect(request).toHaveBeenLastCalledWith(
        { method: 'GET', url, timeout: forwarded, headers: { 'User-Agent': 'FixtureBot' } },
        policy
      );
    }
    await createWebScraperTool().invoke({ url });
    expect(request).toHaveBeenLastCalledWith(
      {
        method: 'GET',
        url,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgentForge/1.0; +https://agentforge.dev)',
        },
      },
      {}
    );
  });

  it.each([undefined, ''])(
    'reports response.config.url with nullish-only fallback (%s)',
    async (responseUrl) => {
      respond('', responseUrl);
      // Explicit undefined must not use the fixture helper's default URL.
      if (responseUrl === undefined)
        request.mockResolvedValue({
          data: '',
          config: {},
          status: 200,
          statusText: 'OK',
          headers: {},
        });
      expect(await createWebScraperTool().invoke({ url })).toStrictEqual({
        url: responseUrl ?? url,
      });
    }
  );

  it('propagates request, invalid-selector, and null-body parser failures', async () => {
    const scraper = createWebScraperTool();
    const failure = new Error('request failed');
    request.mockRejectedValueOnce(failure);
    await expect(scraper.invoke({ url })).rejects.toBe(failure);
    await expect(scraper.invoke({ url, selector: '[' })).rejects.toThrow('Expected name, found');
    respond(null);
    await expect(scraper.invoke({ url, extractHtml: true })).rejects.toThrow(
      'cheerio.load() expects a string'
    );
  });
});
