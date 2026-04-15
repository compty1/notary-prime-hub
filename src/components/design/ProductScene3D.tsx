/**
 * True WebGL 3D Preview Engine using React Three Fiber
 * Provides product-specific procedural geometry with OrbitControls
 */
import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, RoundedBox, Text, Center } from "@react-three/drei";
import * as THREE from "three";

// ── WebGL Detection ─────────────────────────────────────
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

// ── Shared Types ────────────────────────────────────────
export interface DesignTexture {
  text?: string;
  textColor?: string;
  bgColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

interface ProductScene3DProps {
  productType: string;
  design?: DesignTexture;
  className?: string;
  label?: string;
}

// ── Canvas Texture Generator ────────────────────────────
function useCanvasTexture(design: DesignTexture, width = 512, height = 512) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = design.bgColor || "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Accent strip
    if (design.accentColor) {
      ctx.fillStyle = design.accentColor;
      ctx.fillRect(0, 0, width, 12);
    }

    // Text
    if (design.text) {
      ctx.fillStyle = design.textColor || "#ffffff";
      ctx.font = `bold ${Math.min(width / 10, 48)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Word-wrap
      const words = design.text.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      const maxWidth = width * 0.8;

      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = Math.min(width / 8, 56);
      const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, startY + i * lineHeight);
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    textureRef.current = tex;
    return tex;
  }, [design.bgColor, design.textColor, design.accentColor, design.text, width, height]);
}

// ── Product Geometry Components ─────────────────────────

function BusinessCardModel({ design }: { design: DesignTexture }) {
  const texture = useCanvasTexture(design, 700, 400);
  return (
    <group>
      <RoundedBox args={[3.5, 2, 0.05]} radius={0.05} smoothness={4}>
        <meshStandardMaterial
          map={texture}
          roughness={0.3}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Shadow card behind */}
      <RoundedBox args={[3.5, 2, 0.05]} radius={0.05} smoothness={4} position={[0.1, -0.1, -0.08]}>
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

function StickerModel({ design }: { design: DesignTexture }) {
  const texture = useCanvasTexture(design, 512, 512);
  return (
    <group>
      <mesh>
        <circleGeometry args={[1.5, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.2}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Peel effect */}
      <mesh position={[0.8, -0.8, 0.02]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BookModel({ design }: { design: DesignTexture }) {
  const coverTexture = useCanvasTexture(design, 512, 720);
  const spineWidth = 0.3;
  return (
    <group rotation={[0, -0.3, 0]}>
      {/* Cover */}
      <RoundedBox args={[3, 4.2, 0.08]} radius={0.02} smoothness={4} position={[0, 0, spineWidth / 2]}>
        <meshStandardMaterial map={coverTexture} roughness={0.3} />
      </RoundedBox>
      {/* Spine */}
      <RoundedBox args={[spineWidth, 4.2, 0.08]} radius={0.02} smoothness={4} position={[-1.5 - spineWidth / 2 + 0.04, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color={design.bgColor || "#1a1a2e"} roughness={0.4} />
      </RoundedBox>
      {/* Back cover */}
      <RoundedBox args={[3, 4.2, 0.06]} radius={0.02} smoothness={4} position={[0, 0, -spineWidth / 2]}>
        <meshStandardMaterial color={design.bgColor || "#1a1a2e"} roughness={0.5} />
      </RoundedBox>
      {/* Pages */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 4.0, spineWidth - 0.1]} />
        <meshStandardMaterial color="#f8f6f0" roughness={0.8} />
      </mesh>
    </group>
  );
}

function ApparelModel({ design }: { design: DesignTexture }) {
  const bodyColor = design.bgColor || "#f5f5f5";
  return (
    <group>
      {/* Body */}
      <mesh>
        <boxGeometry args={[2.8, 3.2, 0.3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      {/* Sleeves */}
      <mesh position={[-1.8, 0.6, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[1.2, 1.0, 0.25]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh position={[1.8, 0.6, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[1.2, 1.0, 0.25]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 1.7, 0.05]}>
        <torusGeometry args={[0.5, 0.08, 8, 24, Math.PI]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Design area indicator */}
      {design.text && (
        <Center position={[0, 0.2, 0.2]}>
          <Text fontSize={0.25} color={design.textColor || "#1a1a2e"} maxWidth={2} textAlign="center">
            {design.text}
          </Text>
        </Center>
      )}
    </group>
  );
}

function SignModel({ design }: { design: DesignTexture }) {
  const texture = useCanvasTexture(design, 720, 480);
  return (
    <group>
      {/* Sign face */}
      <mesh>
        <boxGeometry args={[4.5, 3, 0.08]} />
        <meshStandardMaterial map={texture} roughness={0.3} />
      </mesh>
      {/* Stakes */}
      <mesh position={[-1.2, -2.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.5, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[1.2, -2.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.5, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function LetterheadModel({ design }: { design: DesignTexture }) {
  const texture = useCanvasTexture(design, 510, 660);
  return (
    <group rotation={[-0.2, 0.1, 0]}>
      {/* Main sheet */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.4, 4.4]} />
        <meshStandardMaterial map={texture} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Envelope behind */}
      <mesh position={[0.3, -0.5, -0.05]} rotation={[0, 0, 0.02]}>
        <planeGeometry args={[3.8, 1.6]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function NotebookModel({ design }: { design: DesignTexture }) {
  const coverTexture = useCanvasTexture(design, 440, 600);
  return (
    <group rotation={[0, -0.25, 0]}>
      {/* Cover */}
      <RoundedBox args={[2.5, 3.5, 0.12]} radius={0.03} smoothness={4}>
        <meshStandardMaterial map={coverTexture} roughness={0.4} />
      </RoundedBox>
      {/* Pages visible on the side */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.3, 3.3, 0.08]} />
        <meshStandardMaterial color="#fffef5" roughness={0.9} />
      </mesh>
      {/* Elastic closure */}
      <mesh position={[1.26, 0, 0.02]}>
        <cylinderGeometry args={[0.02, 0.02, 3.6, 8]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
    </group>
  );
}

function PromoMugModel({ design }: { design: DesignTexture }) {
  const bodyColor = design.bgColor || "#ffffff";
  return (
    <group rotation={[0, -0.5, 0]}>
      {/* Mug body */}
      <mesh>
        <cylinderGeometry args={[1.0, 0.85, 2.2, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} />
      </mesh>
      {/* Handle */}
      <mesh position={[1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.45, 0.08, 8, 24, Math.PI]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} />
      </mesh>
      {/* Imprint text */}
      {design.text && (
        <Center position={[0, 0.1, 1.02]}>
          <Text fontSize={0.22} color={design.textColor || "#1a1a2e"} maxWidth={1.5} textAlign="center">
            {design.text}
          </Text>
        </Center>
      )}
    </group>
  );
}

// ── Model Selector ──────────────────────────────────────
const MODEL_MAP: Record<string, React.FC<{ design: DesignTexture }>> = {
  "business-cards": BusinessCardModel,
  stickers: StickerModel,
  books: BookModel,
  notebooks: NotebookModel,
  apparel: ApparelModel,
  signage: SignModel,
  stationery: LetterheadModel,
  promotional: PromoMugModel,
};

// ── Loading Fallback ────────────────────────────────────
function LoadingIndicator() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hsl(var(--muted))" wireframe />
    </mesh>
  );
}

// ── CSS Fallback (no WebGL) ─────────────────────────────
function CSSFallback({ productType, design }: { productType: string; design: DesignTexture }) {
  const bgColor = design.bgColor || "#1a1a2e";
  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-2xl"
      style={{ background: `linear-gradient(135deg, ${bgColor}33, ${bgColor}11)` }}
    >
      <div className="text-center space-y-2 p-4">
        <div className="w-20 h-20 mx-auto rounded-xl border-2 border-dashed border-border flex items-center justify-center">
          <span className="text-2xl">
            {productType === "business-cards" ? "💼" : productType === "stickers" ? "🏷️" : productType === "books" || productType === "notebooks" ? "📚" : productType === "apparel" ? "👕" : productType === "signage" ? "🪧" : productType === "stationery" ? "📄" : "🎁"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">3D preview requires WebGL</p>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────
export function ProductScene3D({
  productType,
  design = {},
  className = "",
  label,
}: ProductScene3DProps) {
  const [webgl] = useState(() => hasWebGL());
  const ModelComponent = MODEL_MAP[productType];

  if (!webgl || !ModelComponent) {
    return (
      <div className={`relative ${className}`}>
        <CSSFallback productType={productType} design={design} />
        {label && <p className="text-sm font-medium text-foreground/80 text-center mt-2">{label}</p>}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 35 }}
        dpr={[1, 2]}
        style={{ borderRadius: "1rem" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<LoadingIndicator />}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.3} />
          <Environment preset="studio" />
          <ModelComponent design={design} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            autoRotate
            autoRotateSpeed={1.5}
          />
        </Suspense>
      </Canvas>
      {label && <p className="text-sm font-medium text-foreground/80 text-center mt-2">{label}</p>}
    </div>
  );
}
