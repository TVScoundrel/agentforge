/** Compile against the built package, so generated declarations are the contract under test. */
import {
  createHtmlParserTool,
  createExtractLinksTool,
  createExtractImagesTool,
  createWebScraperTool,
  htmlParser,
  extractLinks,
  extractImages,
  webScraper,
  createHtmlParserTools,
  createScraperTools,
  htmlParserTools,
  scraperTools,
  htmlParserSchema,
  extractLinksSchema,
  extractImagesSchema,
  webScraperSchema,
  type HtmlParserToolsConfig,
  type ScraperToolsConfig,
  type ScraperResult,
} from '../../dist/index.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Result<T extends { invoke: (...args: never[]) => unknown }> = Awaited<ReturnType<T['invoke']>>;
type ParserResult = Result<ReturnType<typeof createHtmlParserTool>>;
type LinkResult = { count: number; links: { text: string; href: string; title?: string }[] };
type ImageResult = {
  count: number;
  images: { src: string; alt?: string; title?: string; width?: string; height?: string }[];
};

// A structurally assignable narrower type would still be a breaking change here.
export type PublishedResultChecks = [
  Assert<IsAny<ParserResult['results'][number]>>,
  Assert<Equal<ParserResult['count'], number>>,
  Assert<Equal<keyof ParserResult, 'count' | 'results'>>,
  Assert<Equal<Result<ReturnType<typeof createExtractLinksTool>>, LinkResult>>,
  Assert<Equal<Result<ReturnType<typeof createExtractImagesTool>>, ImageResult>>,
  Assert<Equal<Result<ReturnType<typeof createWebScraperTool>>, ScraperResult>>,
  Assert<IsAny<ScraperResult['selected']>>,
  Assert<
    Equal<
      ScraperResult,
      {
        url: string;
        title?: string;
        text?: string;
        html?: string;
        links?: string[];
        images?: string[];
        metadata?: Record<string, string>;
        selected?: ScraperResult['selected'];
      }
    >
  >,
  Assert<Equal<typeof htmlParser, ReturnType<typeof createHtmlParserTool>>>,
  Assert<Equal<typeof extractLinks, ReturnType<typeof createExtractLinksTool>>>,
  Assert<Equal<typeof extractImages, ReturnType<typeof createExtractImagesTool>>>,
  Assert<Equal<typeof webScraper, ReturnType<typeof createWebScraperTool>>>,
  Assert<Equal<typeof htmlParserTools, ReturnType<typeof createHtmlParserTools>>>,
  Assert<Equal<typeof scraperTools, ReturnType<typeof createScraperTools>>>,
];

// Optional inputs remain optional in the published factories, even where schemas declare defaults.
void createHtmlParserTool().invoke({ html: '', selector: 'p' });
void createExtractLinksTool().invoke({ html: '' });
void createExtractImagesTool().invoke({ html: '' });
void createWebScraperTool().invoke({ url: 'https://example.test' });
const parserConfig: HtmlParserToolsConfig = {};
const scraperConfig: ScraperToolsConfig = {
  defaultTimeout: 1234,
  userAgent: 'CompatibilityBot',
  destinationPolicy: { allowPrivateNetwork: true },
};
void createHtmlParserTools(parserConfig);
void createScraperTools(scraperConfig);
void htmlParserSchema.parse({ html: '', selector: 'p' });
void extractLinksSchema.parse({ html: '' });
void extractImagesSchema.parse({ html: '' });
void webScraperSchema.parse({ url: 'https://example.test' });
