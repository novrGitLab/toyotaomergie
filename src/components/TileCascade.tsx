"use client";

import { useEffect, useState } from "react";
import { ImageFrame } from "./ImageFrame";
import type { ImageSlot } from "@/content/types";

const TILE_STEP_MS = 58; // cascade step from the random origin tile
const TILE_FADE_MS = 365; // per-tile fade
const SETTLE_BUFFER_MS = 80;

/** Tile grids chosen so tiles land close to square per breakpoint. */
const GRID = { desktop: { cols: 8, rows: 4 }, mobile: { cols: 4, rows: 5 } };

/** djb2 string hash — stable across server and client. */
function hashSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Mulberry32 — tiny deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Checkerboard tile cascade for one image.
 *
 * The image is cut into a grid of tiles (8x4 desktop, 4x5 mobile) that ripple
 * outward from a random origin tile, each framing its own piece of the image,
 * until the photo is assembled. After the cascade the tiles swap for a single
 * img, so the resting state has no composited tile seams.
 *
 * Reusable in any relatively-positioned container: use the homepage hero,
 * the vehicle detail stage, or anywhere else a photo should assemble.
 *
 * - Seedable: the origin is derived from `seed` via a deterministic PRNG, so
 *   server and client agree (no hydration mismatches) and each subject keeps
 *   its own starting spot.
 * - Reduced motion: no cascade - the photo is simply present.
 * - `idleDrift`: optionally let the settled photo drift very slowly (Ken
 *   Burns), paused whenever the page is active (html[data-idle]).
 */
export function TileCascade({
  slot,
  seed,
  idleDrift = false,
  sizes = "100vw",
  className,
}: {
  slot: ImageSlot;
  /** Included in the origin seed; change it per presentation context. */
  seed: string;
  idleDrift?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [settled, setSettled] = useState(false);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const tileMq = window.matchMedia("(max-width: 720px)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setCompact(tileMq.matches);
      setReduce(reduceMq.matches);
    };
    apply();
    tileMq.addEventListener("change", apply);
    reduceMq.addEventListener("change", apply);
    return () => {
      tileMq.removeEventListener("change", apply);
      reduceMq.removeEventListener("change", apply);
    };
  }, []);

  const { cols, rows } = compact ? GRID.mobile : GRID.desktop;
  const cascadeMs = (rows + cols - 2) * TILE_STEP_MS + TILE_FADE_MS;

  // Cascade readiness. The tiles only animate once the real image has been
  // fetched and decoded - otherwise the cascade plays over blank tiles and
  // looks broken on a cold load. The settle timer starts after readiness, so
  // the resting swap can never land before the photo is visible.
  useEffect(() => {
    if (reduce || !slot.src) {
      setReady(true);
      setSettled(true);
      return;
    }
    setReady(false);
    setSettled(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const go = () => {
      if (cancelled) return;
      cancelled = true;
      setReady(true);
      timer = setTimeout(() => setSettled(true), cascadeMs + SETTLE_BUFFER_MS);
    };
    // Safety net: never leave the hero blank if the load events stall.
    const safety = setTimeout(go, 6000);
    const img = new Image();
    img.onload = go;
    img.onerror = go;
    img.src = slot.src;
    img.decode?.().catch(() => {});
    return () => {
      cancelled = true;
      clearTimeout(safety);
      if (timer) clearTimeout(timer);
    };
  }, [slot.src, seed, cascadeMs, reduce]);

  // Random origin tile, deterministic per seed.
  const origin = (() => {
    const rand = mulberry32(hashSeed(`${slot.subject ?? "image"}-${seed}`));
    return {
      row: Math.floor(rand() * rows),
      col: Math.floor(rand() * cols),
    };
  })();

  const tiles: { col: number; row: number; delay: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dist = Math.abs(row - origin.row) + Math.abs(col - origin.col);
      tiles.push({ col, row, delay: dist * TILE_STEP_MS });
    }
  }

  const cls = className ? ` ${className}` : "";

  if (!slot.src) {
    // No photo: designed placeholder, no cascade.
    return (
      <ImageFrame slot={slot} showCaption={false} sizes={sizes} className={className} />
    );
  }

  if (settled || reduce) {
    return (
      <div
        className={`hero__settled${idleDrift ? "" : " kb-off"}${cls}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slot.src} alt="" decoding="async" />
      </div>
    );
  }

  // Not ready yet: hold the empty box so the cascade always starts on a
  // clean background, exactly like the load-time presentation intends.
  if (!ready) {
    return <div className={`hero__tiles${cls}`} aria-hidden="true" style={{ "--cols": cols, "--rows": rows } as React.CSSProperties} />;
  }

  return (
    <div
      key={`${slot.src}-${seed}`}
      className={`hero__tiles${cls}`}
      style={{ "--cols": cols, "--rows": rows } as React.CSSProperties}
      aria-hidden="true"
    >
      {tiles.map((t) => (
        <span
          key={`${t.row}-${t.col}`}
          className="hero__tile"
          style={
            {
              "--tile-col": t.col,
              "--tile-row": t.row,
              "--tile-delay": `${t.delay}ms`,
            } as React.CSSProperties
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.src} alt="" decoding="async" />
        </span>
      ))}
    </div>
  );
}
