import Link from "next/link";
import { site } from "@/config/site";
import { SectionHeading } from "../section-heading";

export function Services() {
  return (
    <section
      id="leistungen"
      aria-labelledby="leistungen-title"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28"
    >
      <SectionHeading id="leistungen-title" eyebrow="Leistungen" title="Was wir für Sie tun">
        Den Preis nennen wir Ihnen nach Sichtung des Fahrzeugs – verbindlich und bevor wir mit der
        Arbeit beginnen.
      </SectionHeading>

      <ol className="mt-14 grid border-t border-line md:grid-cols-2 lg:grid-cols-3">
        {site.services.map((service, index) => (
          <li
            key={service.title}
            className="border-b border-line py-8 md:px-6 md:odd:border-r md:odd:pl-0 lg:border-r lg:odd:pl-6 lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n+1)]:pl-0"
          >
            <span className="font-mono text-sm text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-xl font-semibold">{service.title}</h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{service.description}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-ink-soft">
        Ihr Anliegen ist nicht dabei?{" "}
        <Link
          href="#kontakt"
          className="font-medium text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
        >
          Sprechen Sie uns an
        </Link>
        .
      </p>
    </section>
  );
}
