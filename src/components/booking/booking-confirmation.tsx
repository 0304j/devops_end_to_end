"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { site } from "@/config/site";
import { formatLongDate } from "@/lib/booking/availability";
import { type BookingRequest, serviceOptions } from "@/lib/booking/schema";

type BookingConfirmationProps = {
  request: BookingRequest;
  onRestart: () => void;
};

export function BookingConfirmation({ request, onRestart }: BookingConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const service = serviceOptions.find((option) => option.id === request.serviceId);
  const vehicle = [request.vehicleMake, request.vehicleModel, request.vehicleYear]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-10">
      <div className="border-l-4 border-accent pl-6">
        <p className="eyebrow">Anfrage übermittelt</p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-wide mt-3 text-3xl leading-tight font-extrabold tracking-tight focus:outline-none sm:text-4xl"
        >
          Vielen Dank, {request.name}.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          Wir haben Ihre Terminanfrage erhalten.{" "}
          <strong className="font-semibold text-ink">
            Das ist noch keine Terminbestätigung.
          </strong>{" "}
          Wir prüfen Ihre Anfrage und melden uns telefonisch oder per E-Mail bei Ihnen.
        </p>
      </div>

      <dl className="grid border-t border-line sm:grid-cols-2">
        <SummaryItem label="Leistung">{service?.title}</SummaryItem>
        <SummaryItem label="Wunschtermin">
          {formatLongDate(request.date)}, {request.time} Uhr
        </SummaryItem>
        <SummaryItem label="Fahrzeug">
          {vehicle}
          {request.licensePlate ? ` · ${request.licensePlate.toUpperCase()}` : null}
        </SummaryItem>
        <SummaryItem label="Kontakt">
          {request.phone}
          <br />
          <span className="break-all">{request.email}</span>
        </SummaryItem>
        <div className="border-b border-line py-5 sm:col-span-2">
          <dt className="eyebrow">Ihr Anliegen</dt>
          <dd className="mt-2 leading-relaxed whitespace-pre-line">{request.description}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRestart}
          className="border border-ink px-6 py-3.5 font-semibold transition-colors hover:bg-ink hover:text-paper"
        >
          Weitere Anfrage stellen
        </button>
        <p className="text-sm text-muted">
          Fragen? Rufen Sie uns an:{" "}
          <a href={`tel:${site.contact.phoneHref}`} className="underline">
            {site.contact.phoneDisplay}
          </a>
        </p>
      </div>
    </div>
  );
}

function SummaryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-line py-5 sm:odd:pr-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 font-medium">{children}</dd>
    </div>
  );
}
