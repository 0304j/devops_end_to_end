import Link from "next/link";
import { mapsUrl, site } from "@/config/site";
import { SectionHeading } from "../section-heading";

export function Contact() {
  const { contact } = site;

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading id="kontakt-title" eyebrow="Kontakt" title="So erreichen Sie uns" />

        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          <div>
            <h3 className="eyebrow">Adresse</h3>
            <address className="mt-4 text-lg leading-relaxed not-italic">
              {site.name}
              <br />
              {contact.street}
              <br />
              {contact.postalCode} {contact.city}
            </address>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-medium underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
            >
              Route planen
              <span className="sr-only"> (öffnet Google Maps in einem neuen Tab)</span>
            </a>
          </div>

          <div>
            <h3 className="eyebrow">Telefon &amp; E-Mail</h3>
            <ul className="mt-4 space-y-2 text-lg">
              <li>
                <a href={`tel:${contact.phoneHref}`} className="hover:text-accent">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="break-all hover:text-accent">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow">Öffnungszeiten</h3>
            <table className="mt-4 w-full text-left">
              <caption className="sr-only">Öffnungszeiten der Werkstatt</caption>
              <tbody>
                {site.openingHours.map((entry) => (
                  <tr key={entry.days} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2.5 pr-4 font-normal">
                      {entry.days}
                    </th>
                    <td className="py-2.5 text-right font-mono text-sm whitespace-nowrap">
                      {entry.hours ?? "geschlossen"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-10">
          <p className="max-w-xl text-3xl leading-tight font-extrabold tracking-tight text-balance font-wide sm:text-4xl">
            Steht eine Inspektion an oder stimmt etwas nicht?
          </p>
          <Link
            href="/termin"
            className="shrink-0 bg-accent px-6 py-4 text-center font-semibold text-paper transition-colors duration-200 hover:bg-accent-strong"
          >
            Termin vereinbaren
          </Link>
        </div>
      </div>
    </section>
  );
}
