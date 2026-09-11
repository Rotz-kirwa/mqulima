/**
 * HTML Sanitization Module for Mkulima
 * Protects against XSS attacks in rich text/HTML rendering.
 */

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "b", "i", "strong", "em", "u", "s", "strike",
  "ul", "ol", "li", "blockquote", "code", "pre", "hr", "br",
  "table", "thead", "tbody", "tr", "th", "td",
  "a", "img", "span", "div", "figure", "figcaption"
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel", "class"]),
  img: new Set(["src", "alt", "title", "width", "height", "class", "loading"]),
  "*": new Set(["class", "id", "title"])
};

const DISALLOWED_TAGS = new Set([
  "script", "style", "iframe", "object", "embed", "applet", "base",
  "form", "input", "button", "textarea", "select", "svg", "math",
  "link", "meta"
]);

/**
 * Sanitizes an HTML string by enforcing a strict element and attribute allowlist,
 * removing event handlers, javascript: links, and dangerous embedded content.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  // 1. Remove comments
  let clean = html.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Strip disallowed tag blocks completely (e.g. <script>...</script>, <style>...</style>)
  for (const tag of DISALLOWED_TAGS) {
    const blockRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    clean = clean.replace(blockRegex, "");
    // Also strip self-closing or lone tags
    const loneRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    clean = clean.replace(loneRegex, "");
  }

  // 3. Remove inline event handlers (onload, onclick, onerror, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 4. Remove javascript:, vbscript:, and unsafe data: URIs from attributes
  clean = clean.replace(/(href|src)\s*=\s*['"]\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpeg|webp|gif))):[^'"]*['"]/gi, '$1="#"');

  // 5. Filter HTML tags against the allowlist
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(lowerTag)) {
      return "";
    }

    if (isClosing) {
      return `</${lowerTag}>`;
    }

    const allowedForTag = ALLOWED_ATTRS[lowerTag] || new Set();
    const globalAllowed = ALLOWED_ATTRS["*"];

    let sanitizedAttrs = "";
    const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+))/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      if (allowedForTag.has(attrName) || globalAllowed.has(attrName)) {
        if ((attrName === "href" || attrName === "src") && /^\s*(javascript|vbscript|data:(?!image\/)):/i.test(attrValue)) {
          continue;
        }

        if (lowerTag === "a" && attrName === "target" && attrValue === "_blank") {
          sanitizedAttrs += ` target="_blank" rel="noopener noreferrer"`;
          continue;
        }

        sanitizedAttrs += ` ${attrName}="${attrValue.replace(/"/g, "&quot;")}"`;
      }
    }

    return `<${lowerTag}${sanitizedAttrs}>`;
  });

  return clean;
}

export const sanitizeBlogHtml = sanitizeHtml;
