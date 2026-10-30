import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

const SIZE = 280;
const OUTPUT = 512;

export function PhotoCropper({ src, onCancel, onSave }) {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(null);

  useEffect(() => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.src = src;
    return () => {
      el.onload = null; // Prevent state update if component unmounts before load
    };
  }, [src]);

  const baseScale = img ? SIZE / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const drawW = img ? img.naturalWidth * scale : 0;
  const drawH = img ? img.naturalHeight * scale : 0;

  const clamp = (o) => {
    const maxX = Math.max(0, (drawW - SIZE) / 2);
    const maxY = Math.max(0, (drawH - SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, o.x)),
      y: Math.max(-maxY, Math.min(maxY, o.y)),
    };
  };

  useEffect(() => {
    setOffset((o) => clamp(o));
  }, [zoom, img]);

  const onPointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setOffset(
      clamp({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y })
    );
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  const save = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = 1 / scale;
    const srcW = SIZE * s;
    const srcH = SIZE * s;
    const cx = img.naturalWidth / 2 - offset.x * s;
    const cy = img.naturalHeight / 2 - offset.y * s;
    const sx = cx - srcW / 2;
    const sy = cy - srcH / 2;
    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, OUTPUT, OUTPUT);
    ctx.restore();
    onSave(canvas.toDataURL("image/jpeg", 0.92));
  };

  const overlay = (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[360px] bg-background rounded-[28px] p-5 shadow-xl border border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-extrabold text-foreground">Position & zoom</div>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-foreground cursor-pointer"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="relative mx-auto overflow-hidden bg-card select-none touch-none"
          style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                width: drawW,
                height: drawH,
                position: "absolute",
                left: SIZE / 2 - drawW / 2 + offset.x,
                top: SIZE / 2 - drawH / 2 + offset.y,
                maxWidth: "none",
              }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.35) inset",
              borderRadius: SIZE / 2,
            }}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-foreground"
            aria-label="Zoom"
          />
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-2xl bg-card border border-border/60 font-semibold text-[13.5px] text-foreground hover:bg-accent transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 h-11 rounded-2xl bg-foreground text-background font-semibold text-[13.5px] hover:opacity-90 transition inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(overlay, document.body)
    : overlay;
}
