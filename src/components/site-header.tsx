import Link from "next/link";
import { site } from "@/config/site";
import { MobileNav } from "./mobile-nav";

export const navItems = [
  { href: "/#leistungen", label: "Leistungen" },
  { href: "/#ablauf", label: "Ablauf" },
  { href: "/#kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-wide text-lg font-extrabold tracking-tight">
            {site.name}
          </span>
          <span className="hidden font-mono text-[0.7rem] tracking-[0.14em] text-muted uppercase sm:inline">
            {site.tagline}
          </span>
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/termin"
            className="hidden bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent sm:inline-block"
          >
            Termin vereinbaren
          </Link>
          <MobileNav items={navItems} />
        </div>
      </div>
    </header>
  );
}
