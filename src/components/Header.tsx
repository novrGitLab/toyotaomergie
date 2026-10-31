"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { brand, primaryNav, telHref, utilityNav, waHref } from "@/content/site";
import { ImageFrame } from "./ImageFrame";
import { ArrowRight, ChevronDown, Close, Menu, Phone, WhatsApp } from "./icons";
import type { NavItem } from "@/content/types";

/* ---------------------------------------------------------------------------
   Brand mark — typographic. The Toyota wordmark appears as the certification
   the dealer carries; Omoregie Motors is the business.
--------------------------------------------------------------------------- */

function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="Omoregie Motors — home">
      <span className="wordmark__logo">
        <Image
          src="/images/dealer/logo.webp"
          alt="Regemoto logo — Omoregie Motors"
          width={48}
          height={48}
          priority
        />
      </span>
      <span className="wordmark__suffix">
        <span className="wordmark__certified">Certified Toyota Dealer</span>
        <span className="wordmark__since">Since 1978</span>
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------------------------
   Header — brand layer + primary nav + mega menus.
--------------------------------------------------------------------------- */

export function Header() {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [focusIntent, setFocusIntent] = useState<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Move focus into a mega menu after it has mounted (triggered by ArrowDown).
  useEffect(() => {
    if (openIndex === null || focusIntent !== openIndex) return;
    const menu = navRef.current?.querySelector<HTMLElement>(
      `[data-mega-index="${openIndex}"]`,
    );
    const first = menu?.querySelector<HTMLElement>("a.mega__link, a.mega__feature");
    first?.focus();
    setFocusIntent(null);
  }, [focusIntent, openIndex]);

  // Close menus on navigation.
  useEffect(() => {
    setOpenIndex(null);
    setMobileOpen(false);
  }, [pathname]);

  // Sticky condense. Hysteresis (pin past 64px, un-pin only under 16px)
  // stops the utility bar from flickering when the scroll position sits on
  // the trigger; rAF batches so rapid wheel events toggle at most per frame.
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > 16 : y > 64));
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Escape closes the mega menu and the mobile drawer. When the menu was open,
  // focus returns to the top-level nav link so keyboard position is not lost.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenIndex((current) => {
        if (current !== null) {
          const link = navRef.current?.querySelector<HTMLElement>(
            `[data-nav-index="${current}"] a.nav__link`,
          );
          link?.focus();
        }
        return null;
      });
      setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close the mega menu on outside click.
  useEffect(() => {
    if (openIndex === null) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openIndex]);

  const cancelClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    openTimer.current = setTimeout(() => setOpenIndex(null), 160);
  }, [cancelClose]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="masthead" data-scrolled={scrolled ? "true" : "false"}>
        {/* ---- Brand layer ------------------------------------------------ */}
        <div className="brandlayer">
          <div className="shell brandlayer__inner">
            <p className="brandlayer__tagline">
              <span className="brandlayer__hours">
                Mon–Fri 8:00am–5:30pm · Sat 8:00am–2:00pm
              </span>
              <span className="brandlayer__sep" aria-hidden="true" />
              <span>{brand.certifiedLine}</span>
            </p>
            <nav aria-label="Utility" className="brandlayer__nav">
              <a
                className="brandlayer__link brandlayer__call"
                href={telHref(brand.salesPhone[0])}
              >
                <Phone width={13} height={13} />
                <span>{brand.salesPhone[0]}</span>
              </a>
              {utilityNav.primary.map((l) => (
                <Link key={l.href} href={l.href} className="brandlayer__link">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* ---- Primary nav ------------------------------------------------ */}
        <header
          className="nav"
          ref={navRef}
          onMouseLeave={scheduleClose}
          onMouseEnter={cancelClose}
        >
          <div className="shell nav__inner">
            <Wordmark />

            <nav aria-label="Primary" className="nav__primary">
              <ul className="nav__list">
                {primaryNav.map((item, i) => (
                  <NavTopLevel
                    key={item.label}
                    item={item}
                    index={i}
                    active={isActive(item.href)}
                    open={openIndex === i}
                    onOpen={() => {
                      cancelClose();
                      setOpenIndex(i);
                    }}
                    onToggle={() =>
                      setOpenIndex((cur) => (cur === i ? null : i))
                    }
                    onClose={scheduleClose}
                    requestMenuFocus={(idx) => setFocusIntent(idx)}
                  />
                ))}
              </ul>
            </nav>

            <div className="nav__actions">
              <a href={waHref("Hello Omoregie Motors, I'd like to enquire about a Toyota.")}
                 className="nav__cta nav__cta--wa"
                 target="_blank"
                 rel="noopener noreferrer">
                <WhatsApp width={15} height={15} />
                <span>WhatsApp</span>
              </a>
              <Link href="/vehicles" className="nav__cta nav__cta--primary">
                <span>Book a test drive</span>
                <ArrowRight width={15} height={15} />
              </Link>
              <button
                type="button"
                className="nav__burger"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <Close width={18} height={18} /> : <Menu width={18} height={18} />}
                <span className="visually-hidden">
                  {mobileOpen ? "Close menu" : "Open menu"}
                </span>
              </button>
            </div>
          </div>

          {/* ---- Mega menu ------------------------------------------------ */}
          {primaryNav.map((item, i) =>
            item.groups && openIndex === i ? (
              <MegaMenu key={item.label} item={item} index={i} />
            ) : null,
          )}
        </header>
      </div>

      {/* ---- Mobile drawer ------------------------------------------------ */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

/* ---------------------------------------------------------------------------
   Top-level nav item.
--------------------------------------------------------------------------- */

function NavTopLevel({
  item,
  index,
  active,
  open,
  onOpen,
  onToggle,
  onClose,
  requestMenuFocus,
}: {
  item: NavItem;
  index: number;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
  requestMenuFocus: (index: number) => void;
}) {
  const hasMenu = Boolean(item.groups?.length);

  return (
    <li
      className="nav__item"
      data-nav-index={index}
      onMouseEnter={hasMenu ? onOpen : undefined}
      data-open={open ? "true" : "false"}
    >
      <Link
        href={item.href}
        className="nav__link"
        data-active={active ? "true" : "false"}
        aria-current={active ? "page" : undefined}
        aria-expanded={hasMenu ? open : undefined}
        aria-haspopup={hasMenu ? "true" : undefined}
        onKeyDown={(e) => {
          if (!hasMenu) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            requestMenuFocus(index);
            onOpen();
          }
          if (e.key === "Escape") onClose();
        }}
      >
        <span className="nav__label">{item.label}</span>
        {hasMenu && <ChevronDown width={14} height={14} className="nav__chev" />}
      </Link>
      {hasMenu && (
        <button
          type="button"
          className="nav__expander"
          aria-expanded={open}
          onClick={onToggle}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </li>
  );
}

/* ---------------------------------------------------------------------------
   Mega menu.
--------------------------------------------------------------------------- */

function MegaMenu({ item, index }: { item: NavItem; index: number }) {
  return (
    <div
      className="mega"
      role="group"
      aria-label={`${item.label} menu`}
      data-mega-index={index}
    >
      <div className="shell mega__inner">
        <div className="mega__cols">
          {item.groups?.map((group) => (
            <div className="mega__col" key={group.label}>
              <p className="mega__coltitle">{group.label}</p>
              <ul className="mega__links">
                {group.children.map((child) => (
                  <li key={child.label}>
                    <Link href={child.href} className="mega__link">
                      <span className="mega__linklabel">
                        {child.label}
                        {child.badge && (
                          <span className="chip chip--verify mega__badge">
                            {child.badge}
                          </span>
                        )}
                      </span>
                      {child.description && (
                        <span className="mega__linkdesc">{child.description}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {group.note && <p className="mega__note">{group.note}</p>}
            </div>
          ))}
        </div>

        {item.feature && (
          <Link href={item.feature.href} className="mega__feature">
            <ImageFrame
              slot={item.feature.image}
              className="mega__featureimg"
              showCaption={false}
              sizes="(min-width: 1024px) 320px, 100vw"
            />
            <div className="mega__featurebody">
              <p className="eyebrow eyebrow--red eyebrow--bare">
                {item.feature.label}
              </p>
              <p className="mega__featuretitle">{item.feature.title}</p>
              <p className="mega__featuretext">{item.feature.body}</p>
              <span className="link-rule link-rule--static mega__featurecta">
                Explore <ArrowRight width={14} height={14} />
              </span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Mobile navigation.
--------------------------------------------------------------------------- */

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      id="mobile-nav"
      className="mobilenav"
      data-open={open ? "true" : "false"}
      hidden={!open}
    >
      <div className="mobilenav__scroll">
        <nav aria-label="Mobile" className="mobilenav__body">
          {primaryNav.map((item) => (
            <details key={item.label} className="mobilenav__group">
              <summary className="mobilenav__summary">
                {item.label}
                <ChevronDown width={18} height={18} />
              </summary>
              <div className="mobilenav__panel">
                <Link href={item.href} className="mobilenav__overview" onClick={onClose}>
                  Overview — {item.label}
                </Link>
                {item.groups?.map((group) => (
                  <div key={group.label} className="mobilenav__sub">
                    <p className="mobilenav__subtitle">{group.label}</p>
                    <ul>
                      {group.children.map((child) => (
                        <li key={child.label}>
                          <Link href={child.href} onClick={onClose}>
                            {child.label}
                            {child.badge && (
                              <span className="chip chip--verify">{child.badge}</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}

          <div className="mobilenav__utility">
            {utilityNav.primary.map((l) => (
              <Link key={l.href} href={l.href} onClick={onClose}>
                {l.label}
              </Link>
            ))}
            <Link href="/legal/privacy" onClick={onClose}>
              Privacy policy
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
