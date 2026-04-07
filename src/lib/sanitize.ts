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
      "table", "thead", "tbody", "tfoot", "tr", "td", "th",
      "hr", "img", "sub", "sup", "code", "pre", "div",
      "caption", "colgroup", "col",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style",
      "src", "alt", "title", "colspan", "rowspan", "width", "height"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * Sanitize email HTML for rendering in the email reader pane.
 * Allows email-specific layout tags (table, div, img, etc.) that are
 * stripped by the generic sanitizer, while still blocking scripts and XSS.
 */
export function sanitizeEmailHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "b", "i",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "span", "a", "blockquote",
      "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption", "colgroup", "col",
      "div", "img", "hr", "pre", "code", "center", "font",
      "sup", "sub", "small", "big", "abbr",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "class", "id",
      "style", "width", "height", "align", "valign",
      "bgcolor", "color", "border", "cellpadding", "cellspacing",
      "src", "alt", "title", "colspan", "rowspan",
      "dir", "lang", "face", "size",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strip all HTML tags from a string, returning plain text.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
