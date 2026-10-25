/**
 * Business content for the public website.
 *
 * EXAMPLE DATA: every value below is a placeholder (note the "Muster…" address
 * and the reserved `.example` e-mail domain). Replace it with the garage's real
 * details before going live. Do not add claims (certifications, awards,
 * ratings) the business cannot back up.
 */

export type OpeningHours = {
  /** Human-readable day range, e.g. "Montag – Freitag". */
  days: string;
  /** Short form for compact layouts, e.g. "Mo – Fr". */
  short: string;
  /** Opening time range, or null when closed. */
  hours: string | null;
};

export type Service = {
  /** Stable identifier, used in booking requests. Do not change once live. */
  id: string;
  title: string;
  description: string;
};

export type ImageCredit = {
  subject: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

const weekdaySlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

export const site = {
  name: "AutoCare",
  tagline: "Freie Kfz-Werkstatt",
  description:
    "Inspektion, Reparatur und Diagnose für Ihr Auto. Freie Kfz-Werkstatt in Berlin – Termin online anfragen.",

  contact: {
    phoneDisplay: "030 123 456 78",
    /** E.164 format, used for the tel: link. */
    phoneHref: "+493012345678",
    email: "kontakt@autocare-werkstatt.example",
    street: "Musterstraße 12",
    postalCode: "10115",
    city: "Berlin",
  },

  openingHours: [
    { days: "Montag – Freitag", short: "Mo – Fr", hours: "07:30 – 18:00" },
    { days: "Samstag", short: "Sa", hours: "09:00 – 13:00" },
    { days: "Sonntag und Feiertage", short: "So", hours: null },
  ] satisfies OpeningHours[],

  services: [
    {
      id: "inspektion",
      title: "Inspektion & Wartung",
      description:
        "Wartung nach Herstellervorgaben, Ölwechsel, Filter und Flüssigkeiten – mit Eintrag ins Serviceheft.",
    },
    {
      id: "bremsen",
      title: "Bremsen",
      description: "Prüfung und Erneuerung von Bremsbelägen, Bremsscheiben und Bremsflüssigkeit.",
    },
    {
      id: "reifen",
      title: "Reifen & Räder",
      description: "Saisonaler Radwechsel, Reifenmontage, Auswuchten und Einlagerung auf Anfrage.",
    },
    {
      id: "diagnose",
      title: "Fehlerdiagnose",
      description:
        "Auslesen des Fehlerspeichers und systematische Suche, wenn eine Warnleuchte aufleuchtet oder etwas nicht stimmt.",
    },
    {
      id: "klima",
      title: "Klimaservice",
      description:
        "Dichtheitsprüfung, Kältemittel absaugen und neu befüllen, Desinfektion der Anlage.",
    },
    {
      id: "hu-au",
      title: "Vorbereitung HU/AU",
      description:
        "Durchsicht vor der Hauptuntersuchung und Behebung von Mängeln, damit Ihr Termin bei der Prüforganisation glatt läuft.",
    },
  ] satisfies Service[],

  booking: {
    /** All booking dates and times are wall-clock times in this time zone. */
    timeZone: "Europe/Berlin",
    /** Earliest bookable day, counted from today (1 = tomorrow). */
    minLeadDays: 1,
    /** How many calendar days ahead customers can request a slot. */
    windowDays: 21,
    /** Vehicle drop-off times per weekday (0 = Sunday … 6 = Saturday). */
    slotsByWeekday: {
      0: [],
      1: weekdaySlots,
      2: weekdaySlots,
      3: weekdaySlots,
      4: weekdaySlots,
      5: weekdaySlots,
      6: ["09:00", "10:00", "11:00"],
    } satisfies Record<number, readonly string[]>,
    /** Days without appointments, e.g. public holidays or company holidays ("YYYY-MM-DD"). */
    closedDates: [] as readonly string[],
  },

  /** Working principles shown on the landing page. Keep them true. */
  principles: [
    {
      title: "Erst sprechen, dann schrauben",
      description:
        "Vor jeder Reparatur erhalten Sie einen Kostenvoranschlag. Zusätzliche Arbeiten führen wir nur nach Ihrer Freigabe aus.",
    },
    {
      title: "Nachvollziehbar",
      description:
        "Wir erklären den Befund in verständlichen Worten. Ausgebaute Teile zeigen wir Ihnen auf Wunsch.",
    },
    {
      title: "Alle Marken",
      description: "Als freie Werkstatt arbeiten wir an Fahrzeugen aller gängigen Hersteller.",
    },
  ],

  imageCredits: [
    {
      subject: "Werkstatt (Titelbild)",
      author: "Martin Vorel",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Car_repair_shop.jpg",
    },
    {
      subject: "Motorraum",
      author: "Shixart1985",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Old_car_engine_showing_various_parts_and_tools_during_maintenance_work_in_a_garage.jpg",
    },
  ] satisfies ImageCredit[],
} as const;

export const fullAddress = `${site.contact.street}, ${site.contact.postalCode} ${site.contact.city}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
