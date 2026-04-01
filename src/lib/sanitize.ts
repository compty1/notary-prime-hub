import DOMPurify from "dompurify";

/**
 * Sanitize user-provided HTML to prevent XSS.
 * Use for any content that may be rendered as HTML.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "b", "i",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "span", "a", "blockquote",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
  });
}

/**
 * Strip all HTML tags from a string, returning plain text.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
