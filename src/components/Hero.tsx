"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TileCascade } from "./TileCascade";
import type { ImageSlot } from "@/content/types";
import { ArrowRight, ChevronDown, Phone, Shield } from "./icons";
import { brand, telHref, waHref } from "@/content/site";

const ROTATE_MS = 3500;

/**
 * Showroom hero.
 *
 * The featured cars crossfade via the checkerboard cascade (shared
 * `TileCascade`), advancing automatically while the page is idle, with
 * clickable ticks. The media block wipes in on load; the copy column stages
 * in after the headline lines.
 */
export function Hero({
  images,
  badge,
  titleLines,
  lede,
  primary,
  secondary,
  stats,
}: {
  /** The cars to present; the first is shown on load. */
  images: ImageSlot[];
  badge: string;
  titleLines: string[];
  lede: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  stats: { value: string; label: string }[];
}) {
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(0);

  // Load reveal for the copy column.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Rotation: ambient-gated (only while the page is idle, never in hidden
  // tabs). Reduced motion is handled inside TileCascade, which simply shows
  // the photo - index changes stay invisible, so no gate needed here.
  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      if (document.documentElement.dataset.idle === "false") return;
      setActive((a) => (a + 1) % images.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [images.length, active]);

  return (
    <section className="hero" data-revealed={revealed ? "true" : "false"}>
      <div className="hero__media" aria-hidden="true">
        {images[active] && (
          <TileCascade
            key={`${active}-${images[active].subject ?? active}`}
            slot={images[active]}
            seed={`${active}`}
            idleDrift
            sizes="(min-width: 900px) 62vw, 100vw"
            className="hero__img"
          />
        )}

        <div className="hero__scrim" aria-hidden="true" />

        {images.length > 1 && (
          <ul className="hero__ticks" aria-label="Featured vehicles">
            {images.map((img, i) => (
              <li key={`tick-${img.subject}-${i}`}>
                <button
                  type="button"
                  className={i === active ? "hero__tick is-active" : "hero__tick"}
                  aria-label={`Show ${img.subject}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hero__content shell">
        <div className="hero__lead">
          <p className="hero__badge">
            <Shield width={14} height={14} />
            {badge}
          </p>
          <h1 className="hero__title">
            {titleLines.map((line, i) => (
              <span
                className="rise"
                key={line}
                style={
                  {
                    "--reveal-delay": `${160 + i * 90}ms`,
                  } as React.CSSProperties
                }
              >
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <p className="hero__lede">{lede}</p>
          <div className="hero__actions">
            <Link className="btn btn--primary" href={primary.href}>
              {primary.label}
              <ArrowRight width={16} height={16} />
            </Link>
            <Link className="btn btn--outline" href={secondary.href}>
              {secondary.label}
            </Link>
          </div>
          <div className="hero__contact">
            <a href={telHref("+2348038002222")} className="hero__phone">
              <Phone width={15} height={15} />
              +234 803 800 2222
            </a>
            <a
              href={waHref("Hello Omoregie Motors, I'd like to enquire about a Toyota.")}
              className="hero__wa"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
            <a
              href={waHref(
                "Hello Omoregie Motors, I'd like to enquire about a Toyota.",
                brand.whatsapp2,
              )}
              className="hero__wa"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp 0903 563 4038
            </a>
          </div>
        </div>

        <ul className="hero__stats">
          {stats.map((s) => (
            <li key={s.label}>
              <span className="hero__statvalue">{s.value}</span>
              <span className="hero__statlabel">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hero__cue" aria-hidden="true">
        <ChevronDown width={18} height={18} />
      </div>
    </section>
  );
}
