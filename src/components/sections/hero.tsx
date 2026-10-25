import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import heroImage from "../../../public/images/werkstatt-hero.jpg";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-12 px-4 pt-12 pb-10 sm:px-6 lg:col-span-5 lg:py-20 lg:pr-12 lg:pl-10">
          <div>
            <p className="eyebrow">
              {site.tagline} · {site.contact.city}
            </p>
            <h1
              id="hero-title"
              className="mt-6 text-[2.75rem] leading-[0.95] font-extrabold tracking-tight text-balance font-wide sm:text-6xl lg:text-[4.25rem]"
            >
              Ehrliche Arbeit an Ihrem Auto.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              Inspektion, Reparatur und Fehlerdiagnose für alle gängigen Marken. Sie erfahren, was
              zu tun ist und was es kostet – bevor wir anfangen.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/termin"
                className="bg-accent px-6 py-4 text-center font-semibold text-paper transition-colors duration-200 hover:bg-accent-strong"
              >
                Termin vereinbaren
              </Link>
              <Link
                href="#leistungen"
                className="group px-1 py-3 text-center font-medium sm:text-left"
              >
                Leistungen ansehen{" "}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 ease-out-quart group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </Link>
            </div>
          </div>

          <dl className="grid gap-3 border-t border-line pt-6 sm:grid-cols-3 sm:gap-4">
            {site.openingHours.map((entry) => (
              <div key={entry.short} className="flex items-baseline justify-between sm:block">
                <dt className="eyebrow">{entry.short}</dt>
                <dd className="font-mono text-sm whitespace-nowrap sm:mt-1.5">
                  {entry.hours ?? "geschlossen"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative aspect-[4/3] lg:col-span-7 lg:aspect-auto lg:min-h-[640px]">
          <Image
            src={heroImage}
            alt="Werkstatthalle mit einem rotbraunen Oldtimer mit geöffneter Motorhaube, daneben ein ausgebauter Motor am Kran."
            fill
            preload
            placeholder="blur"
            sizes="(min-width: 1280px) 750px, (min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
