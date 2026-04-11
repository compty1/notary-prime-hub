import { useState } from "react";
import { motion } from "framer-motion";

interface ProductPreview3DProps {
  productType: string;
  label?: string;
  className?: string;
}

const PRODUCT_VISUALS: Record<string, { bg: string; icon: string; shape: string }> = {
  "business-cards": { bg: "from-primary/20 to-accent/20", icon: "💼", shape: "card" },
  stationery: { bg: "from-blue-500/15 to-sky-400/15", icon: "📄", shape: "paper" },
  marketing: { bg: "from-orange-500/15 to-amber-400/15", icon: "📢", shape: "brochure" },
  signage: { bg: "from-green-500/15 to-emerald-400/15", icon: "🪧", shape: "banner" },
  apparel: { bg: "from-purple-500/15 to-violet-400/15", icon: "👕", shape: "tshirt" },
  "legal-supplies": { bg: "from-red-500/15 to-rose-400/15", icon: "⚖️", shape: "stamp" },
  packaging: { bg: "from-yellow-500/15 to-amber-400/15", icon: "📦", shape: "box" },
  promotional: { bg: "from-pink-500/15 to-fuchsia-400/15", icon: "🎁", shape: "pen" },
  books: { bg: "from-indigo-500/15 to-blue-400/15", icon: "📚", shape: "book" },
  notebooks: { bg: "from-teal-500/15 to-cyan-400/15", icon: "📓", shape: "notebook" },
  stickers: { bg: "from-lime-500/15 to-green-400/15", icon: "🏷️", shape: "sticker" },
};

function CardShape() {
  return (
    <div className="relative w-48 h-28">
      <div className="absolute inset-0 rounded-lg bg-card border border-border shadow-lg" />
      <div className="absolute top-3 left-4 w-16 h-2 rounded bg-primary/40" />
      <div className="absolute top-7 left-4 w-24 h-1.5 rounded bg-muted-foreground/20" />
      <div className="absolute top-11 left-4 w-20 h-1.5 rounded bg-muted-foreground/15" />
      <div className="absolute bottom-3 right-4 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">ND</div>
    </div>
  );
}

function BookShape() {
  return (
    <div className="relative w-32 h-44">
      <div className="absolute inset-0 rounded-r-md bg-primary/30 border border-border shadow-xl" style={{ transform: "perspective(300px) rotateY(-15deg)" }} />
      <div className="absolute inset-y-0 left-0 w-3 bg-primary/50 rounded-l-sm" />
      <div className="absolute top-6 left-6 right-4 h-2 rounded bg-card/60" />
      <div className="absolute top-10 left-6 right-8 h-1.5 rounded bg-card/40" />
    </div>
  );
}

function BannerShape() {
  return (
    <div className="relative w-52 h-20">
      <div className="absolute inset-0 rounded bg-accent/30 border border-border shadow-lg" />
      <div className="absolute top-4 left-6 w-24 h-3 rounded bg-primary/40" />
      <div className="absolute top-9 left-6 w-32 h-2 rounded bg-muted-foreground/20" />
    </div>
  );
}

function StampShape() {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full border-4 border-primary/40 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center text-xs font-bold text-primary/50">SEAL</div>
      </div>
    </div>
  );
}

function StickerShape() {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-border shadow-md flex items-center justify-center">
        <span className="text-2xl">⭐</span>
      </div>
    </div>
  );
}

function DefaultShape({ icon }: { icon: string }) {
  return (
    <div className="w-24 h-24 rounded-xl bg-muted/50 border border-border shadow-md flex items-center justify-center">
      <span className="text-3xl">{icon}</span>
    </div>
  );
}

const SHAPE_MAP: Record<string, React.FC> = {
  card: CardShape,
  book: BookShape,
  notebook: BookShape,
  banner: BannerShape,
  stamp: StampShape,
  sticker: StickerShape,
};

export function ProductPreview3D({ productType, label, className = "" }: ProductPreview3DProps) {
  const [rotateY, setRotateY] = useState(0);
  const visual = PRODUCT_VISUALS[productType] || { bg: "from-muted/20 to-muted/10", icon: "📦", shape: "default" };
  const ShapeComponent = SHAPE_MAP[visual.shape];

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br ${visual.bg} ${className}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        setRotateY(x * 20);
      }}
      onMouseLeave={() => setRotateY(0)}
      style={{ perspective: 600 }}
    >
      <motion.div
        animate={{ rotateY }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {ShapeComponent ? <ShapeComponent /> : <DefaultShape icon={visual.icon} />}
      </motion.div>
      {label && <p className="text-sm font-medium text-foreground/80 mt-2">{label}</p>}
    </motion.div>
  );
}
