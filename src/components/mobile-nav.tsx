"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type NavItem = { href: string; label: string };

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 px-2 text-sm font-medium"
      >
        <span aria-hidden="true" className="relative block h-3 w-5">
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-ink transition-transform duration-200 ${open ? "top-1.25 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-ink transition-transform duration-200 ${open ? "top-1.25 -rotate-45" : "top-2.5"}`}
          />
        </span>
        {open ? "Schließen" : "Menü"}
      </button>

      <nav
        id={panelId}
        aria-label="Mobile Navigation"
        hidden={!open}
        className="absolute inset-x-0 top-16 border-b border-line bg-paper"
      >
        <ul className="px-4 py-2 sm:px-6">
          {items.map((item) => (
            <li key={item.href} className="border-b border-line last:border-0">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-4 text-lg"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-4 pb-6 sm:px-6">
          <Link
            href="/termin"
            onClick={() => setOpen(false)}
            className="block bg-ink px-4 py-3.5 text-center font-semibold text-paper"
          >
            Termin vereinbaren
          </Link>
        </div>
      </nav>
    </div>
  );
}
