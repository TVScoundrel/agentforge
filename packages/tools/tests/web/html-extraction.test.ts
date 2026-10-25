import { describe, expect, it } from 'vitest';
import {
  createExtractImagesTool,
  createExtractLinksTool,
  createHtmlParserTool,
} from '../../src/web/html-parser/index.js';
import { elementHtml, resourceHtml } from './fixtures/extraction.js';

describe('public HTML extraction compatibility', () => {
  it('retains empty hrefs, optional title keys, order, duplicates, and trimmed link text', async () => {
    expect(await createExtractLinksTool().invoke({ html: resourceHtml })).toStrictEqual({
      count: 5,
      links: [
        { text: 'empty', href: '', title: undefined },
        { text: 'First link', href: '../page', title: 'First' },
        { text: 'Absolute', href: 'https://other.test/path', title: '' },
        { text: 'Invalid', href: 'http://[invalid', title: undefined },
        { text: 'Duplicate', href: '../page', title: undefined },
      ],
    });
  });

  it('retains empty srcs and every optional image key, order, duplicates, and counts', async () => {
    expect(await createExtractImagesTool().invoke({ html: resourceHtml })).toStrictEqual({
      count: 5,
      images: [
        { src: '', alt: '', title: '', width: '', height: '' },
        { src: '../photo.png', alt: 'Photo', title: 'Portrait', width: '20', height: '30' },
        {
          src: 'https://other.test/photo.png',
          alt: undefined,
          title: undefined,
          width: undefined,
          height: undefined,
        },
        {
          src: 'http://[invalid',
          alt: undefined,
          title: undefined,
          width: undefined,
          height: undefined,
        },
        {
          src: '../photo.png',
          alt: undefined,
          title: undefined,
          width: undefined,
          height: undefined,
        },
      ],
    });
  });

  it('resolves nonempty resource URLs against the supplied base, ignoring HTML base elements', async () => {
    const input = { html: resourceHtml, baseUrl: 'https://requested.test/dir/start' };
    const links = await createExtractLinksTool().invoke(input);
    const images = await createExtractImagesTool().invoke(input);
    expect(links.count).toBe(5);
    expect(links.links.map(({ href }) => href)).toStrictEqual([
      '',
      'https://requested.test/page',
      'https://other.test/path',
      'http://[invalid',
      'https://requested.test/page',
    ]);
    expect(images.count).toBe(5);
    expect(images.images.map(({ src }) => src)).toStrictEqual([
      '',
      'https://requested.test/photo.png',
      'https://other.test/photo.png',
      'http://[invalid',
      'https://requested.test/photo.png',
    ]);
  });

  it('returns one result per selected element with trimmed text and parser-normalized HTML', async () => {
    expect(
      await createHtmlParserTool().invoke({
        html: elementHtml,
        selector: '.item',
        extractText: true,
        extractHtml: true,
        extractAttributes: ['class', 'data-value', 'data-empty', 'missing'],
      })
    ).toStrictEqual({
      count: 2,
      results: [
        {
          text: 'First bold',
          html: '  First <b>bold</b> ',
          attributes: { class: 'item', 'data-value': 'yes', 'data-empty': '' },
        },
        { text: 'Second & last', html: ' Second &amp; last ', attributes: { class: 'item' } },
      ],
    });
    expect(
      await createHtmlParserTool().invoke({
        html: '<DIV DATA-X=one><BR/><p>one<p>two</DIV>',
        selector: 'div',
        extractText: true,
        extractHtml: true,
      })
    ).toStrictEqual({ count: 1, results: [{ text: 'onetwo', html: '<br><p>one</p><p>two</p>' }] });
  });

  it('distinguishes empty inner HTML from no matches and honors disabled fields', async () => {
    const parser = createHtmlParserTool();
    expect(
      await parser.invoke({
        html: elementHtml,
        selector: '.empty, .void',
        extractText: true,
        extractHtml: true,
      })
    ).toStrictEqual({
      count: 2,
      results: [
        { text: '', html: '' },
        { text: '', html: '' },
      ],
    });
    expect(
      await parser.invoke({ html: elementHtml, selector: '.absent', extractHtml: true })
    ).toStrictEqual({ count: 0, results: [] });
    expect(
      await parser.invoke({ html: '', selector: 'body', extractText: true, extractHtml: true })
    ).toStrictEqual({ count: 1, results: [{ text: '', html: '' }] });
    expect(
      await parser.invoke({
        html: elementHtml,
        selector: '.item',
        extractText: false,
        extractAttributes: [],
      })
    ).toStrictEqual({ count: 2, results: [{}, {}] });
    expect(
      await parser.invoke({
        html: elementHtml,
        selector: '.empty',
        extractText: false,
        extractAttributes: ['missing'],
      })
    ).toStrictEqual({ count: 1, results: [{ attributes: {} }] });
  });

  it('leaves extraction flags absent when invoke receives no flags', async () => {
    expect(
      await createHtmlParserTool().invoke({ html: elementHtml, selector: '.item' })
    ).toStrictEqual({ count: 2, results: [{}, {}] });
  });

  it('retains null inner HTML for an HTML-string selector creating a comment', async () => {
    expect(
      await createHtmlParserTool().invoke({
        html: elementHtml,
        selector: '<!--comment-->',
        extractText: true,
        extractHtml: true,
      })
    ).toStrictEqual({ count: 1, results: [{ text: '', html: null }] });
  });

  it('retains relative values when a valid but non-hierarchical base cannot resolve them', async () => {
    expect(
      await createExtractLinksTool().invoke({
        html: '<a href="relative">Link</a>',
        baseUrl: 'mailto:user@example.test',
      })
    ).toStrictEqual({ count: 1, links: [{ text: 'Link', href: 'relative', title: undefined }] });
    expect(
      await createExtractImagesTool().invoke({
        html: '<img src="relative">',
        baseUrl: 'mailto:user@example.test',
      })
    ).toStrictEqual({
      count: 1,
      images: [
        { src: 'relative', alt: undefined, title: undefined, width: undefined, height: undefined },
      ],
    });
  });

  it('returns empty records for empty documents', async () => {
    expect(await createExtractLinksTool().invoke({ html: '' })).toStrictEqual({
      count: 0,
      links: [],
    });
    expect(await createExtractImagesTool().invoke({ html: '' })).toStrictEqual({
      count: 0,
      images: [],
    });
    expect(await createHtmlParserTool().invoke({ html: '', selector: 'p' })).toStrictEqual({
      count: 0,
      results: [],
    });
  });

  it('propagates invalid selector errors through invocation', async () => {
    await expect(
      createHtmlParserTool().invoke({ html: elementHtml, selector: '[' })
    ).rejects.toThrow('Expected name, found');
  });
});
