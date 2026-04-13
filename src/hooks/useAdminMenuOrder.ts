import { useState, useCallback, useRef } from "react";

const STORAGE_KEY = "admin-sidebar-order";

type OrderMap = Record<string, string[]>; // groupLabel -> ordered item titles

function loadOrder(): OrderMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOrder(order: OrderMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function useAdminMenuOrder() {
  const [orderMap, setOrderMap] = useState<OrderMap>(loadOrder);
  const dragItem = useRef<{ group: string; index: number } | null>(null);
  const dragOverItem = useRef<{ group: string; index: number } | null>(null);

  /** Reorder a group's visible items based on stored order */
  const applyOrder = useCallback(
    <T extends { title: string }>(groupLabel: string, items: T[]): T[] => {
      const saved = orderMap[groupLabel];
      if (!saved || saved.length === 0) return items;
      const itemMap = new Map(items.map((i) => [i.title, i]));
      const ordered: T[] = [];
      // First add items in saved order (if they still exist)
      for (const title of saved) {
        const item = itemMap.get(title);
        if (item) {
          ordered.push(item);
          itemMap.delete(title);
        }
      }
      // Then append any new items not in the saved order
      for (const item of itemMap.values()) {
        ordered.push(item);
      }
      return ordered;
    },
    [orderMap]
  );

  const onDragStart = useCallback((group: string, index: number) => {
    dragItem.current = { group, index };
  }, []);

  const onDragEnter = useCallback((group: string, index: number) => {
    dragOverItem.current = { group, index };
  }, []);

  const onDragEnd = useCallback(
    <T extends { title: string }>(groupLabel: string, currentItems: T[]) => {
      if (
        !dragItem.current ||
        !dragOverItem.current ||
        dragItem.current.group !== groupLabel ||
        dragOverItem.current.group !== groupLabel ||
        dragItem.current.index === dragOverItem.current.index
      ) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
      }

      const titles = currentItems.map((i) => i.title);
      const fromIdx = dragItem.current.index;
      const toIdx = dragOverItem.current.index;
      const [moved] = titles.splice(fromIdx, 1);
      titles.splice(toIdx, 0, moved);

      const newOrder = { ...orderMap, [groupLabel]: titles };
      setOrderMap(newOrder);
      saveOrder(newOrder);

      dragItem.current = null;
      dragOverItem.current = null;
    },
    [orderMap]
  );

  const resetOrder = useCallback(() => {
    setOrderMap({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { applyOrder, onDragStart, onDragEnter, onDragEnd, resetOrder };
}
