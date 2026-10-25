/** Private, value-only extraction over one parsed HTML document. */
import * as cheerio from 'cheerio';

interface ElementFields {
  extractText?: boolean;
  extractHtml?: boolean;
  extractAttributes?: string[];
}

interface ExtractedElement {
  text?: string;
  html?: string | null;
  attributes?: Record<string, string>;
}

interface ExtractedLink {
  text: string;
  href: string;
  title?: string;
}

interface ExtractedImage {
  src: string;
  alt?: string;
  title?: string;
  width?: string;
  height?: string;
}

function resolveUrl(value: string, baseUrl?: string): string {
  if (baseUrl && value) {
    try {
      return new URL(value, baseUrl).href;
    } catch {
      // Preserve the original value when the supplied base cannot resolve it.
    }
  }
  return value;
}

export function createHtmlDocument(html: string) {
  const $ = cheerio.load(html);

  return {
    select(selector: string) {
      const selected = $(selector);
      return {
        text: () => selected.text().trim(),
        html: () => selected.html(),
        elements(fields: ElementFields): ExtractedElement[] {
          return selected.map((_, el) => {
            const element = $(el);
            const item: ExtractedElement = {};
            if (fields.extractText) item.text = element.text().trim();
            if (fields.extractHtml) item.html = element.html();
            if (fields.extractAttributes && fields.extractAttributes.length > 0) {
              item.attributes = {};
              for (const attribute of fields.extractAttributes) {
                const value = element.attr(attribute);
                if (value !== undefined) item.attributes[attribute] = value;
              }
            }
            return item;
          }).get();
        },
      };
    },

    links(baseUrl?: string): ExtractedLink[] {
      return $('a[href]').map((_, el) => {
        const element = $(el);
        return {
          text: element.text().trim(),
          href: resolveUrl(element.attr('href') || '', baseUrl),
          title: element.attr('title'),
        };
      }).get();
    },

    images(baseUrl?: string): ExtractedImage[] {
      return $('img[src]').map((_, el) => {
        const element = $(el);
        return {
          src: resolveUrl(element.attr('src') || '', baseUrl),
          alt: element.attr('alt'),
          title: element.attr('title'),
          width: element.attr('width'),
          height: element.attr('height'),
        };
      }).get();
    },

    metadata(): Record<string, string> {
      const metadata: Record<string, string> = {};
      const title = $('title').text() || $('meta[property="og:title"]').attr('content');
      if (title) metadata.title = title;
      const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content');
      if (description) metadata.description = description;

      // Document order and later overwrites are part of the scraper contract.
      $('meta[name], meta[property]').each((_, el) => {
        const element = $(el);
        const name = element.attr('name') || element.attr('property');
        const content = element.attr('content');
        if (name && content) metadata[name] = content;
      });
      return metadata;
    },
  };
}
