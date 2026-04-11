import { type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3, Heading4,
  Link, Unlink, Subscript, Superscript, Quote, Minus,
  Undo2, Redo2, Eraser, Search,
  Type, Highlighter, Image as ImageIcon, SeparatorHorizontal,
  Indent, Outdent, CheckSquare,
} from "lucide-react";
import { TEXT_COLORS, HIGHLIGHT_COLORS, FONT_SIZES, BRAND_FONTS } from "./constants";
import { DocuDexTablePicker } from "./DocuDexTablePicker";
import { DocuDexLinkDialog } from "./DocuDexLinkDialog";

interface ToolbarProps {
  editor: Editor | null;
  brandFont: string;
  onBrandFontChange: (font: string) => void;
  onImageUpload: () => void;
  onFindReplace: () => void;
}

function ToolBtn({ active, onClick, children, title, disabled }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={title}
          className={cn(
            "h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0",
            "hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active && "bg-primary/10 text-primary"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{title}</TooltipContent>
    </Tooltip>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

function ColorPicker({ colors, activeColor, onSelect, icon: Icon, title }: {
  colors: { value: string; label: string }[];
  activeColor?: string;
  onSelect: (color: string) => void;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
}) {
  const [custom, setCustom] = useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="h-3.5 w-3.5" />
          {activeColor && (
            <div
              className="absolute bottom-0.5 left-1 right-1 h-0.5 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="grid grid-cols-5 gap-1 mb-2">
          {colors.map(c => (
            <button
              key={c.value}
              onClick={() => onSelect(c.value)}
              className={cn(
                "h-6 w-6 rounded border transition-all hover:scale-110",
                activeColor === c.value ? "border-foreground ring-1 ring-primary" : "border-border dark:border-muted-foreground/30"
              )}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            className="h-6 text-xs flex-1"
            placeholder="#hex"
            value={custom}
            onChange={e => setCustom(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2"
            onClick={() => { if (custom) onSelect(custom); }}
          >
            Apply
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs w-full mt-1"
          onClick={() => onSelect("")}
        >
          <Eraser className="h-3 w-3 mr-1" /> Remove
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function DocuDexToolbar({ editor, brandFont, onBrandFontChange, onImageUpload, onFindReplace }: ToolbarProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const addLink = useCallback(() => {
    setShowLinkDialog(true);
  }, []);

  if (!editor) return null;

  const currentTextColor = editor.getAttributes("textStyle")?.color || "";
  const currentHighlight = editor.getAttributes("highlight")?.color || "";

  return (
    <div
      className="flex items-center gap-0.5 border-b border-border bg-card px-2 py-1 shrink-0 overflow-x-auto"
      role="toolbar"
      aria-label="Formatting toolbar"
    >
      {/* Undo/Redo */}
      <ToolBtn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator />

      {/* Font family */}
      <Select value={brandFont} onValueChange={onBrandFontChange}>
        <SelectTrigger className="h-7 w-20 md:w-28 text-xs border-none shadow-none shrink-0" aria-label="Font family">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BRAND_FONTS.map(f => (
            <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font size */}
      <Select
        value={(() => {
          const fs = editor.getAttributes("textStyle")?.fontSize;
          if (fs) return fs.replace("px", "");
          return "14";
        })()}
        onValueChange={v => {
          (editor.chain().focus() as any).setFontSize(`${v}px`).run();
        }}
      >
        <SelectTrigger className="h-7 w-14 md:w-16 text-xs border-none shadow-none shrink-0" aria-label="Font size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map(s => (
            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator />

      {/* Headings */}
      <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Heading 4" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        <Heading4 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator />

      {/* Text formatting */}
      <ToolBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Subscript" active={editor.isActive("subscript")} onClick={() => (editor.chain().focus() as any).toggleSubscript().run()}>
        <Subscript className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Superscript" active={editor.isActive("superscript")} onClick={() => (editor.chain().focus() as any).toggleSuperscript().run()}>
        <Superscript className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator />

      {/* Colors */}
      <ColorPicker
        colors={TEXT_COLORS}
        activeColor={currentTextColor}
        onSelect={color => {
          if (color) (editor.chain().focus() as any).setColor(color).run();
          else (editor.chain().focus() as any).unsetColor().run();
        }}
        icon={Type}
        title="Text Color"
      />
      <ColorPicker
        colors={HIGHLIGHT_COLORS}
        activeColor={currentHighlight}
        onSelect={color => {
          if (color) (editor.chain().focus() as any).toggleHighlight({ color }).run();
          else (editor.chain().focus() as any).unsetHighlight().run();
        }}
        icon={Highlighter}
        title="Highlight Color"
      />

      <Separator />

      {/* Alignment */}
      <ToolBtn title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator />

      {/* Lists */}
      <ToolBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator />

      {/* Insert */}
      <ToolBtn title="Insert Link" active={editor.isActive("link")} onClick={addLink}>
        <Link className="h-3.5 w-3.5" />
      </ToolBtn>
      {editor.isActive("link") && (
        <ToolBtn title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="h-3.5 w-3.5" />
        </ToolBtn>
      )}
      <ToolBtn title="Insert Image" onClick={onImageUpload}>
        <ImageIcon className="h-3.5 w-3.5" />
      </ToolBtn>
      <DocuDexTablePicker editor={editor} />
      <ToolBtn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Page Break" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <SeparatorHorizontal className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator />

      {/* Utilities */}
      <ToolBtn title="Clear Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
        <Eraser className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Find & Replace (Ctrl+F)" onClick={onFindReplace}>
        <Search className="h-3.5 w-3.5" />
      </ToolBtn>

      {/* Link Dialog */}
      <DocuDexLinkDialog open={showLinkDialog} onOpenChange={setShowLinkDialog} editor={editor} />
    </div>
  );
}
