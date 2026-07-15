export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();

const attributeValue = (html: string, property: string) => {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  return patterns.map((pattern) => pattern.exec(html)?.[1]).find(Boolean);
};

export const getLinkPreview = async (content?: string): Promise<LinkPreview | null> => {
  const url = content?.match(URL_PATTERN)?.[0];
  if (!url) return null;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'HuduChat-LinkPreview/1.0' },
    });
    if (!response.ok) return null;

    const html = await response.text();
    const title = attributeValue(html, 'og:title') || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
    const description = attributeValue(html, 'og:description');
    const image = attributeValue(html, 'og:image');

    return {
      url,
      ...(title ? { title: decodeHtml(title.replace(/<[^>]*>/g, ' ')) } : {}),
      ...(description ? { description: decodeHtml(description) } : {}),
      ...(image ? { image: new URL(decodeHtml(image), url).toString() } : {}),
    };
  } catch {
    return null;
  }
};
