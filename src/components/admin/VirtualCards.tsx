/**
 * VirtualCards — windowed renderer for long lists of variable-height cards.
 *
 * Uses @tanstack/react-virtual with dynamic measurement so existing card
 * markup (with wrapping toolbars / responsive heights) renders unchanged.
 *
 * For lists below `threshold` (default 50) it renders normally — virtualization
 * only kicks in when there is meaningful win, avoiding overhead on small datasets.
 */
import { useRef, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualCardsProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  threshold?: number;
  /** Max viewport height for the scroll container when virtualizing. */
  maxHeight?: string;
  className?: string;
  gap?: number;
}

export function VirtualCards<T>({
  items,
  renderItem,
  estimateSize = 140,
  overscan = 6,
  threshold = 50,
  maxHeight = "calc(100vh - 280px)",
  className = "space-y-3",
  gap = 12,
}: VirtualCardsProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Small lists: render normally — virtualization has overhead.
  if (items.length < threshold) {
    return <div className={className}>{items.map((item, i) => renderItem(item, i))}</div>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    measureElement: (el) => el.getBoundingClientRect().height + gap,
  });

  return (
    <div ref={parentRef} className="overflow-auto" style={{ maxHeight }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {rowVirtualizer.getVirtualItems().map((vi) => (
          <div
            key={vi.key}
            data-index={vi.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start}px)`,
              paddingBottom: gap,
            }}
          >
            {renderItem(items[vi.index], vi.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
