"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TileCascade } from "./TileCascade";
import type { ImageSlot } from "@/content/types";
import { cx } from "@/lib/cx";
import { ArrowRight, WhatsApp } from "./icons";

const GALLERY_ROTATE_MS = 4500;

/**
 * Vehicle product hero.
 *
 * Deliberately different from the editorial `PageHero` used elsewhere: the car
 * leads, occupying the full width, with the model name overlaid bottom-left and
 * the specification rail beneath. This is the one page where the product should
 * own the screen rather than share it with a text column.
 *
 * Gallery images use the same checkerboard cascade as the homepage hero, and
 * advance automatically (ambient-gated: only while the page is idle, paused
 * in hidden tabs, off under reduced motion). A thumbnail click shows that
 * image and restarts the timer.
 */
export function VehicleHero({
  name,
  family,
  bodyType,
  tagline,
  summary,
  images,
  enquireHref,
  priceHref,
  callHref,
  testDriveHref,
}: {
  name: string;
  family: string;
  bodyType: string;
  tagline?: string;
  summary: string;
  images: ImageSlot[];
  enquireHref: string;
  priceHref: string;
  callHref: string;
  testDriveHref: string;
}) {
  const [active, setActive] = useState(0);
  const [rotate, setRotate] = useState(false);
  const gallery = useMemo(() => (images.length ? images : []), [images]);

  // Auto-advance gate: no reduced motion, at least two images.
  useEffect(() => {
    if (gallery.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setRotate(true);
  }, [gallery.length]);

  useEffect(() => {
    if (!rotate || gallery.length < 2) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      // Ambient only: hold the current image while the visitor interacts.
      if (document.documentElement.dataset.idle === "false") return;
      setActive((a) => (a + 1) % gallery.length);
    }, GALLERY_ROTATE_MS);
    return () => clearInterval(id);
  }, [rotate, gallery.length, active]);

  // Preload the upcoming image so its cascade never starts on blank tiles.
  useEffect(() => {
    const next = gallery[(active + 1) % gallery.length];
    if (!next?.src) return;
    const im = new window.Image();
    im.src = next.src;
    im.decode?.().catch(() => {});
  }, [active, gallery]);

  return (
    <section className="vhero" aria-labelledby="vhero-title">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="vhero__crumbs">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/vehicles">Vehicles</Link>
            </li>
            <li aria-current="page">{name}</li>
          </ol>
        </nav>
      </div>

      {/* The car owns the screen. */}
      <div className="vhero__stage">
        <TileCascade
          key={`${active}-${gallery[active]?.subject ?? name}`}
          slot={gallery[active]}
          seed={`${name}-${active}`}
          sizes="(min-width: 1280px) 78vw, 100vw"
        />

        <div className="vhero__overlay">
          <div className="shell vhero__overlayinner">
            <div className="vhero__lead">
              <p className="vhero__eyebrow">{tagline ?? family}</p>
              <h1 id="vhero-title" className="vhero__title">
                {name}
              </h1>
              <p className="vhero__price">Price on request</p>
            </div>
            <div className="vhero__actions">
              <a
                className="btn btn--primary"
                href={enquireHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsApp width={16} height={16} />
                Enquire on WhatsApp
              </a>
              <a className="btn btn--ondark" href={priceHref}>
                Request price
              </a>
              <a className="btn btn--ondark" href={callHref}>
                Call us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Specification rail — sit beneath the car, not beside the copy. */}
      <div className="shell">
        {gallery.length > 1 && (
          <ul className="vhero__thumbs" aria-label={`${name} images`}>
            {gallery.map((img, i) => (
              <li key={img.subject}>
                <button
                  type="button"
                  className={cx("vhero__thumb", i === active && "is-active")}
                  aria-label={`Show image ${i + 1}: ${img.subject}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                >
                  <Image
                    src={img.src ?? ""}
                    alt=""
                    width={160}
                    height={100}
                    sizes="120px"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        <dl className="vhero__specs">
          <div>
            <dt>Body type</dt>
            <dd>{bodyType}</dd>
          </div>
          <div>
            <dt>Model family</dt>
            <dd>{family}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>On request</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>Available through Omoregie Motors</dd>
          </div>
          <div className="vhero__specactions">
            <a className="btn btn--ink" href={testDriveHref}>
              Book a test drive
              <ArrowRight width={15} height={15} />
            </a>
          </div>
        </dl>

        <p className="vhero__summary">{summary}</p>
      </div>
    </section>
  );
}
