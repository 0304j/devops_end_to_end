import Link from "next/link";
import { fullAddress, site } from "@/config/site";
import { navItems } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-paper/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-5">
          <p className="font-wide text-2xl font-extrabold text-paper">
            {site.name}
          </p>
          <p className="mt-2 text-sm">
            {site.tagline} · {fullAddress}
          </p>
        </div>

        <nav aria-label="Fußzeile" className="md:col-span-3">
          <ul className="space-y-2 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/termin" className="hover:text-paper">
                Termin vereinbaren
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="font-mono text-xs tracking-[0.14em] text-paper/50 uppercase">
            Bildnachweis
          </h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed">
            {site.imageCredits.map((credit) => (
              <li key={credit.sourceUrl}>
                {credit.subject}:{" "}
                <a href={credit.sourceUrl} className="underline hover:text-paper">
                  {credit.author}
                </a>
                , Wikimedia Commons,{" "}
                <a href={credit.licenseUrl} className="underline hover:text-paper">
                  {credit.license}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-7xl px-4 py-5 font-mono text-xs text-paper/50 sm:px-6 lg:px-10">
          © <CopyrightYear /> {site.name}
        </p>
      </div>
    </footer>
  );
}

// Cached so the footer stays part of the prerendered static shell.
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}
