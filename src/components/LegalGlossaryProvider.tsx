import React, { useEffect, useRef, useCallback } from "react";
import { findDefinition, buildGlossaryRegex } from "@/lib/legalGlossary";
import DOMPurify from "dompurify";

/**
 * LegalGlossaryProvider scans rendered text for legal terms and adds
 * dotted-underline + tooltip behavior. Uses MutationObserver for dynamic content.
 */
export default function LegalGlossaryProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const processedNodes = useRef(new WeakSet<Node>());
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const createTooltip = useCallback(() => {
    if (tooltipRef.current) return tooltipRef.current;
    const el = document.createElement("div");
    el.className = "legal-glossary-tooltip";
    el.style.cssText = `
      position: fixed; z-index: 9999; max-width: 280px; padding: 8px 12px;
      background: hsl(var(--popover)); color: hsl(var(--popover-foreground));
      border: 1px solid hsl(var(--border)); border-radius: 6px;
      font-size: 13px; line-height: 1.4; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none; opacity: 0; transition: opacity 0.15s;
    `;
    document.body.appendChild(el);
    tooltipRef.current = el;
    return el;
  }, []);

  const showTooltip = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("legal-term")) return;
    const def = target.getAttribute("data-definition");
    if (!def) return;
    const tip = createTooltip();
    const term = target.textContent || "";
    tip.innerHTML = DOMPurify.sanitize(`<strong style="color:hsl(var(--primary))">${term}</strong><br/>${def}`, { ALLOWED_TAGS: ["strong", "br"], ALLOWED_ATTR: ["style"] });
    tip.style.opacity = "1";
    const rect = target.getBoundingClientRect();
    tip.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
    tip.style.top = `${rect.bottom + 6}px`;
  }, [createTooltip]);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
  }, []);

  const processTextNode = useCallback((node: Text) => {
    if (processedNodes.current.has(node)) return;
    const parent = node.parentElement;
    if (!parent) return;
    // Skip script, style, input, textarea, editable elements, and already-processed elements
    const tag = parent.tagName;
    if (["SCRIPT", "STYLE", "INPUT", "TEXTAREA", "CODE", "PRE"].includes(tag)) return;
    if (parent.isContentEditable) return;
    if (parent.classList.contains("legal-term")) return;
    // Skip elements (or ancestors) marked with data-no-glossary
    if (parent.closest("[data-no-glossary]")) return;

    const regex = buildGlossaryRegex();
    const text = node.textContent || "";
    if (!regex.test(text)) { processedNodes.current.add(node); return; }

    // Reset regex
    regex.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let hasMatch = false;

    while ((match = regex.exec(text)) !== null) {
      hasMatch = true;
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = document.createElement("span");
      span.className = "legal-term";
      span.textContent = match[0];
      span.setAttribute("data-definition", findDefinition(match[0]) || "");
      span.style.cssText = "border-bottom: 1px dotted hsl(var(--primary)/0.5); cursor: help;";
      frag.appendChild(span);
      lastIndex = regex.lastIndex;
    }

    if (!hasMatch) { processedNodes.current.add(node); return; }
    if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    processedNodes.current.add(node);
    parent.replaceChild(frag, node);
  }, []);

  const scanElement = useCallback((root: Node) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    textNodes.forEach(processTextNode);
  }, [processTextNode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial scan (debounced to avoid blocking render)
    const timeout = setTimeout(() => scanElement(container), 500);

    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        mut.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) processTextNode(node as Text);
          else if (node.nodeType === Node.ELEMENT_NODE) scanElement(node);
        });
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    // Event delegation for tooltips
    container.addEventListener("mouseenter", showTooltip, true);
    container.addEventListener("mouseleave", hideTooltip, true);
    container.addEventListener("touchstart", showTooltip, { passive: true });
    container.addEventListener("touchend", hideTooltip, { passive: true });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      container.removeEventListener("mouseenter", showTooltip, true);
      container.removeEventListener("mouseleave", hideTooltip, true);
      if (tooltipRef.current) { document.body.removeChild(tooltipRef.current); tooltipRef.current = null; }
    };
  }, [scanElement, processTextNode, showTooltip, hideTooltip]);

  return <div ref={containerRef}>{children}</div>;
}
