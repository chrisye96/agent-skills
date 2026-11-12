"use client";

// PROTOTYPE demo panel (demo-menu skill asset). Copy into the project and
// delete it with the demos once every choice is folded in.
//
// A small translucent chip docked in a corner. Click it (or Alt+D) to open a
// compact card with one row per open question; each row cycles its variants.
// It closes by itself 1.2s after the pointer leaves, on a tap outside, or on
// Esc, so picking an option never needs a manual collapse. Drag the chip (or
// the grip when open) anywhere; on release it snaps to the nearest corner.
//
// Conventions (see the skill): mark variant markup with
// data-proto-<name>="<key>"; every other variant of that name is hidden by an
// injected rule. Each row also sets <html data-proto-<name>-active="<key>"> for
// CSS that restyles existing markup, and mirrors the choice into ?<name>=<key>
// so a link reproduces the view. Renders nothing in production.

import { useEffect, useRef, useState } from "react";

export interface ProtoVariant {
  key: string;
  name: string;
}

export interface ProtoQuestion {
  name: string;
  label: string;
  variants: ProtoVariant[];
}

type Corner = "br" | "bl" | "tl" | "tr";
const CORNERS: Corner[] = ["br", "bl", "tl", "tr"];
const CLOSE_DELAY = 1200;

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

// Applies one question's choice: hide rule, html attribute, URL param
function useChoice({ name, variants }: ProtoQuestion) {
  const [current, setCurrent] = useState(variants[0].key);

  useEffect(() => {
    const v = new URLSearchParams(location.search).get(name);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore after hydration
    if (v && variants.some((x) => x.key === v)) setCurrent(v);
  }, [name, variants]);

  useEffect(() => {
    document.documentElement.setAttribute(`data-proto-${name}-active`, current);
    const url = new URL(location.href);
    url.searchParams.set(name, current);
    history.replaceState(history.state, "", url);
    return () => document.documentElement.removeAttribute(`data-proto-${name}-active`);
  }, [name, current]);

  const cycle = (dir: number) =>
    setCurrent((cur) => variants[(variants.findIndex((x) => x.key === cur) + dir + variants.length) % variants.length].key);

  return { current, cycle, label: variants.find((x) => x.key === current)!.name };
}

const ui = {
  font: "500 12px/1.3 ui-sans-serif, system-ui, -apple-system, sans-serif",
  glass: "rgba(24, 22, 20, 0.72)",
  ink: "#f4f1ec",
  dim: "rgba(244, 241, 236, 0.6)",
};

const arrow: React.CSSProperties = {
  all: "unset",
  cursor: "pointer",
  padding: "2px 7px",
  borderRadius: 6,
  color: ui.dim,
};

function Row(q: ProtoQuestion) {
  const { current, cycle, label } = useChoice(q);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, minHeight: 28 }}>
      <style>{`[data-proto-${q.name}]:not([data-proto-${q.name}="${current}"]){display:none !important}`}</style>
      <span style={{ width: 76, flexShrink: 0, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: ui.dim }}>
        {q.label}
      </span>
      <button type="button" style={arrow} onClick={() => cycle(-1)} aria-label={`Previous ${q.label}`}>
        ‹
      </button>
      {/* Clicking the value also steps forward: the most common action, biggest
          target. The code (e.g. F1) is what the user quotes back when choosing. */}
      <button
        type="button"
        onClick={() => cycle(1)}
        style={{ all: "unset", cursor: "pointer", flex: 1, minWidth: 0, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        <span style={{ fontWeight: 700, marginRight: 6, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.14)" }}>{current}</span>
        {label}
      </button>
      <button type="button" style={arrow} onClick={() => cycle(1)} aria-label={`Next ${q.label}`}>
        ›
      </button>
    </div>
  );
}

// Six-dot grip: the usual "you can drag this" mark
function Grip() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" style={{ display: "block" }}>
      {[2, 7, 12].flatMap((y) => [2.5, 7.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="currentColor" />))}
    </svg>
  );
}

export function DemoPanel({ questions }: { questions: ProtoQuestion[] }) {
  const [open, setOpen] = useState(false);
  const [corner, setCorner] = useState<Corner>("br");
  const [hover, setHover] = useState(false);
  // While dragging, the panel follows the pointer; on release it snaps to the nearest corner
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  useEffect(() => {
    const c = store.get("demo-panel-corner") as Corner | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore after hydration
    if (c && CORNERS.includes(c)) setCorner(c);
  }, []);

  // Close on Esc or a tap outside; Alt+D toggles from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.altKey && e.code === "KeyD") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  // Drag handlers shared by the grip and the collapsed chip. A press that
  // moves less than 4px is a click, not a drag.
  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      const r = ref.current!.getBoundingClientRect();
      drag.current = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < 4) return;
      d.moved = true;
      clearTimeout(timer.current);
      setDragPos({ left: d.left + dx, top: d.top + dy });
    },
    onPointerUp: () => {
      const d = drag.current;
      drag.current = null;
      if (!d?.moved || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const next = `${r.top + r.height / 2 < innerHeight / 2 ? "t" : "b"}${r.left + r.width / 2 < innerWidth / 2 ? "l" : "r"}` as Corner;
      setCorner(next);
      store.set("demo-panel-corner", next);
      setDragPos(null);
      // Only the chip (closed state) gets a click after a drag; swallow that one
      if (!open) justDragged.current = true;
    },
  };

  const pos: React.CSSProperties = dragPos ?? {
    [corner[0] === "b" ? "bottom" : "top"]: 12,
    [corner[1] === "r" ? "right" : "left"]: 12,
  };

  return (
    <div
      ref={ref}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") clearTimeout(timer.current);
        setHover(true);
      }}
      onPointerLeave={(e) => {
        setHover(false);
        // Mouse only, and not mid-drag: on touch, "leave" fires on every tap
        if (e.pointerType === "mouse" && !drag.current) timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
      }}
      style={{
        position: "fixed",
        zIndex: 2147483000,
        ...pos,
        font: ui.font,
        letterSpacing: "normal",
        color: ui.ink,
        background: ui.glass,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: open ? 12 : 999,
        boxShadow: dragPos ? "0 12px 32px rgba(0,0,0,0.3)" : "0 6px 24px rgba(0,0,0,0.18)",
        // Fades back when idle so it stays out of the way of the page
        opacity: open || hover || dragPos ? 1 : 0.55,
        transition: "opacity 200ms ease, box-shadow 200ms ease",
        width: open ? "min(300px, calc(100vw - 24px))" : "auto",
        padding: open ? "6px 8px 8px" : 0,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {open && (
          <span
            {...dragHandlers}
            title="Drag to another corner"
            style={{ cursor: dragPos ? "grabbing" : "grab", padding: "6px 6px 6px 2px", color: ui.dim }}
          >
            <Grip />
          </span>
        )}
        <button
          type="button"
          {...(open ? {} : dragHandlers)}
          onClick={() => {
            if (justDragged.current) {
              justDragged.current = false;
              return;
            }
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          title={open ? "Close (Esc)" : "Demo options (Alt+D). Drag to move."}
          style={{ all: "unset", cursor: "pointer", flex: 1, padding: open ? "4px 2px" : "6px 12px", fontWeight: 600 }}
        >
          ◐ Demos · {questions.length}
        </button>
      </div>
      {/* Rows stay mounted while closed so their choices keep applying */}
      <div style={{ display: open ? "block" : "none", marginTop: 2, maxHeight: "60vh", overflowY: "auto" }}>
        {questions.map((q) => (
          <Row key={q.name} {...q} />
        ))}
      </div>
    </div>
  );
}
