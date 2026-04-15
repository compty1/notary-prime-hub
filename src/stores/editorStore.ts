/**
 * DocuDex Editor Store — Zustand + Immer
 * P0-001: Centralized state for the visual document editor
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

// P0-002: Structured ElementNode schema
export interface ElementNode {
  id: string;
  type: "text" | "image" | "shape" | "table" | "signature" | "qrcode" | "header" | "footer" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  layerIndex: number;
  groupId?: string;
  styles: Record<string, string | number>;
  content: Record<string, any>;
}

export interface EditorPage {
  id: string;
  elements: ElementNode[];
  background?: string;
  width: number;
  height: number;
}

export interface HistoryEntry {
  pages: EditorPage[];
  timestamp: number;
  label: string;
}

// P0-004: Command pattern types
interface Command {
  type: string;
  pageId: string;
  elementId?: string;
  before: any;
  after: any;
}

interface DocumentSlice {
  documentId: string | null;
  title: string;
  pages: EditorPage[];
  pageSize: { width: number; height: number; label: string };
}

interface UiSlice {
  selectedElementIds: string[];
  activePageId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showRulers: boolean;
  showLayers: boolean;
  sidebarTab: "elements" | "templates" | "uploads" | "layers" | "properties";
  contextToolbarPosition: { x: number; y: number } | null;
}

interface HistorySlice {
  undoStack: Command[];
  redoStack: Command[];
  maxHistory: number;
}

interface SettingsSlice {
  autoSave: boolean;
  autoSaveInterval: number;
  snapToGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
}

type EditorState = DocumentSlice & UiSlice & HistorySlice & SettingsSlice & {
  // Document actions
  setTitle: (title: string) => void;
  setDocumentId: (id: string | null) => void;
  setPages: (pages: EditorPage[]) => void;
  addPage: (page?: Partial<EditorPage>) => void;
  removePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setPageSize: (size: { width: number; height: number; label: string }) => void;

  // Element actions
  addElement: (pageId: string, element: Omit<ElementNode, "id" | "layerIndex">) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<ElementNode>) => void;
  removeElement: (pageId: string, elementId: string) => void;
  duplicateElement: (pageId: string, elementId: string) => void;
  reorderElement: (pageId: string, elementId: string, direction: "up" | "down" | "top" | "bottom") => void;

  // Selection
  selectElement: (elementId: string, multi?: boolean) => void;
  selectAll: (pageId: string) => void;
  clearSelection: () => void;

  // UI
  setActivePage: (pageId: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleLayers: () => void;
  setSidebarTab: (tab: UiSlice["sidebarTab"]) => void;
  setContextToolbar: (pos: { x: number; y: number } | null) => void;

  // History (P0-004)
  pushUndo: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Settings
  toggleAutoSave: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  toggleAlignmentGuides: () => void;

  // Bulk
  reset: () => void;
};

const generateId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const generatePageId = () => `pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultPage: EditorPage = {
  id: "page-1",
  elements: [],
  width: 816, // 8.5" at 96dpi
  height: 1056, // 11" at 96dpi
};

export const useEditorStore = create<EditorState>()(
  persist(
    immer((set, get) => ({
      // Document slice
      documentId: null,
      title: "Untitled Document",
      pages: [{ ...defaultPage }],
      pageSize: { width: 816, height: 1056, label: "Letter (8.5 × 11)" },

      // UI slice
      selectedElementIds: [],
      activePageId: "page-1",
      zoom: 1,
      panX: 0,
      panY: 0,
      showGrid: false,
      showRulers: true,
      showLayers: false,
      sidebarTab: "elements",
      contextToolbarPosition: null,

      // History slice
      undoStack: [],
      redoStack: [],
      maxHistory: 100,

      // Settings slice
      autoSave: true,
      autoSaveInterval: 30000,
      snapToGrid: true,
      gridSize: 8,
      showAlignmentGuides: true,

      // Document actions
      setTitle: (title) => set((s) => { s.title = title; }),
      setDocumentId: (id) => set((s) => { s.documentId = id; }),
      setPages: (pages) => set((s) => { s.pages = pages; }),
      addPage: (partial) => set((s) => {
        const newPage: EditorPage = {
          id: generatePageId(),
          elements: [],
          width: s.pageSize.width,
          height: s.pageSize.height,
          ...partial,
        };
        s.pages.push(newPage);
        s.activePageId = newPage.id;
      }),
      removePage: (pageId) => set((s) => {
        if (s.pages.length <= 1) return;
        s.pages = s.pages.filter(p => p.id !== pageId);
        if (s.activePageId === pageId) s.activePageId = s.pages[0]?.id ?? null;
      }),
      reorderPages: (from, to) => set((s) => {
        const [moved] = s.pages.splice(from, 1);
        s.pages.splice(to, 0, moved);
      }),
      setPageSize: (size) => set((s) => {
        s.pageSize = size;
        s.pages.forEach(p => { p.width = size.width; p.height = size.height; });
      }),

      // Element actions
      addElement: (pageId, element) => set((s) => {
        const page = s.pages.find(p => p.id === pageId);
        if (!page) return;
        const maxLayer = page.elements.reduce((max, el) => Math.max(max, el.layerIndex), -1);
        page.elements.push({
          ...element,
          id: generateId(),
          layerIndex: maxLayer + 1,
        } as ElementNode);
      }),
      updateElement: (pageId, elementId, updates) => set((s) => {
        const page = s.pages.find(p => p.id === pageId);
        if (!page) return;
        const el = page.elements.find(e => e.id === elementId);
        if (!el) return;
        Object.assign(el, updates);
      }),
      removeElement: (pageId, elementId) => set((s) => {
        const page = s.pages.find(p => p.id === pageId);
        if (!page) return;
        page.elements = page.elements.filter(e => e.id !== elementId);
        s.selectedElementIds = s.selectedElementIds.filter(id => id !== elementId);
      }),
      duplicateElement: (pageId, elementId) => set((s) => {
        const page = s.pages.find(p => p.id === pageId);
        if (!page) return;
        const el = page.elements.find(e => e.id === elementId);
        if (!el) return;
        const maxLayer = page.elements.reduce((max, e) => Math.max(max, e.layerIndex), -1);
        const clone = { ...JSON.parse(JSON.stringify(el)), id: generateId(), layerIndex: maxLayer + 1, x: el.x + 20, y: el.y + 20 };
        page.elements.push(clone);
        s.selectedElementIds = [clone.id];
      }),
      reorderElement: (pageId, elementId, direction) => set((s) => {
        const page = s.pages.find(p => p.id === pageId);
        if (!page) return;
        const sorted = [...page.elements].sort((a, b) => a.layerIndex - b.layerIndex);
        const idx = sorted.findIndex(e => e.id === elementId);
        if (idx === -1) return;
        if (direction === "up" && idx < sorted.length - 1) {
          const tmp = sorted[idx].layerIndex;
          sorted[idx].layerIndex = sorted[idx + 1].layerIndex;
          sorted[idx + 1].layerIndex = tmp;
        } else if (direction === "down" && idx > 0) {
          const tmp = sorted[idx].layerIndex;
          sorted[idx].layerIndex = sorted[idx - 1].layerIndex;
          sorted[idx - 1].layerIndex = tmp;
        } else if (direction === "top") {
          const maxL = sorted[sorted.length - 1].layerIndex;
          const el = page.elements.find(e => e.id === elementId);
          if (el) el.layerIndex = maxL + 1;
        } else if (direction === "bottom") {
          const minL = sorted[0].layerIndex;
          const el = page.elements.find(e => e.id === elementId);
          if (el) el.layerIndex = minL - 1;
        }
      }),

      // Selection
      selectElement: (elementId, multi) => set((s) => {
        if (multi) {
          if (s.selectedElementIds.includes(elementId)) {
            s.selectedElementIds = s.selectedElementIds.filter(id => id !== elementId);
          } else {
            s.selectedElementIds.push(elementId);
          }
        } else {
          s.selectedElementIds = [elementId];
        }
      }),
      selectAll: (pageId) => set((s) => {
        const page = s.pages.find(p => p.id === pageId);
        if (!page) return;
        s.selectedElementIds = page.elements.filter(e => !e.locked).map(e => e.id);
      }),
      clearSelection: () => set((s) => { s.selectedElementIds = []; s.contextToolbarPosition = null; }),

      // UI
      setActivePage: (pageId) => set((s) => { s.activePageId = pageId; s.selectedElementIds = []; }),
      setZoom: (zoom) => set((s) => { s.zoom = Math.max(0.1, Math.min(5, zoom)); }),
      setPan: (x, y) => set((s) => { s.panX = x; s.panY = y; }),
      toggleGrid: () => set((s) => { s.showGrid = !s.showGrid; }),
      toggleRulers: () => set((s) => { s.showRulers = !s.showRulers; }),
      toggleLayers: () => set((s) => { s.showLayers = !s.showLayers; }),
      setSidebarTab: (tab) => set((s) => { s.sidebarTab = tab; }),
      setContextToolbar: (pos) => set((s) => { s.contextToolbarPosition = pos; }),

      // History (P0-004)
      pushUndo: (command) => set((s) => {
        s.undoStack.push(command);
        if (s.undoStack.length > s.maxHistory) s.undoStack.shift();
        s.redoStack = [];
      }),
      undo: () => set((s) => {
        const cmd = s.undoStack.pop();
        if (!cmd) return;
        s.redoStack.push(cmd);
        // Apply cmd.before state
        const page = s.pages.find(p => p.id === cmd.pageId);
        if (page && cmd.elementId) {
          const el = page.elements.find(e => e.id === cmd.elementId);
          if (el) Object.assign(el, cmd.before);
        }
      }),
      redo: () => set((s) => {
        const cmd = s.redoStack.pop();
        if (!cmd) return;
        s.undoStack.push(cmd);
        const page = s.pages.find(p => p.id === cmd.pageId);
        if (page && cmd.elementId) {
          const el = page.elements.find(e => e.id === cmd.elementId);
          if (el) Object.assign(el, cmd.after);
        }
      }),
      clearHistory: () => set((s) => { s.undoStack = []; s.redoStack = []; }),

      // Settings
      toggleAutoSave: () => set((s) => { s.autoSave = !s.autoSave; }),
      toggleSnapToGrid: () => set((s) => { s.snapToGrid = !s.snapToGrid; }),
      setGridSize: (size) => set((s) => { s.gridSize = size; }),
      toggleAlignmentGuides: () => set((s) => { s.showAlignmentGuides = !s.showAlignmentGuides; }),

      // Reset
      reset: () => set((s) => {
        s.documentId = null;
        s.title = "Untitled Document";
        s.pages = [{ ...defaultPage, id: generatePageId() }];
        s.selectedElementIds = [];
        s.activePageId = s.pages[0].id;
        s.zoom = 1;
        s.panX = 0;
        s.panY = 0;
        s.undoStack = [];
        s.redoStack = [];
      }),
    })),
    {
      name: "docudex-editor-state",
      partialize: (state) => ({
        title: state.title,
        pages: state.pages,
        pageSize: state.pageSize,
        autoSave: state.autoSave,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        showAlignmentGuides: state.showAlignmentGuides,
      }),
    }
  )
);
