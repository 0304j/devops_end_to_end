import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookingSection, BookingSectionSkeleton } from "@/components/booking/booking-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Termin anfragen",
  description: `Termin bei ${site.name} online anfragen: Leistung, Wunschtermin und Fahrzeug angeben.`,
};

export default function BookingPage() {
  const { contact } = site;

  return (
    <>
      <SiteHeader />
      <main
        id="inhalt"
        className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-20"
      >
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Termin vereinbaren</p>
            <h1 className="mt-4 text-4xl leading-none font-extrabold tracking-tight font-wide sm:text-5xl">
              Termin anfragen
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              Wählen Sie Leistung und Wunschtermin und beschreiben Sie kurz Ihr Anliegen. Wir prüfen
              die Anfrage und bestätigen den Termin telefonisch oder per E-Mail.
            </p>

            <div className="mt-10 border-t border-line pt-6">
              <p className="eyebrow">Lieber telefonisch?</p>
              <a
                href={`tel:${contact.phoneHref}`}
                className="mt-2 block text-xl font-semibold hover:text-accent"
              >
                {contact.phoneDisplay}
              </a>
              <p className="mt-2 text-sm text-muted">
                Zu unseren{" "}
                <Link href="/#kontakt" className="underline underline-offset-2 hover:text-ink">
                  Öffnungszeiten
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Suspense fallback={<BookingSectionSkeleton />}>
            <BookingSection />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
