import { site } from "@/config/site";
import { OTHER_SERVICE_ID } from "@/lib/booking/schema";
import type { BookingRequestRow } from "@/lib/db/schema";
import type { NotificationMessage } from "./types";

/**
 * Arabic notification for the garage owner about a new booking request.
 *
 * The fixed texts below were written for this template. Have a native
 * speaker review them before going live. Only the customer's free-text
 * description is machine-translated.
 */

export type BookingNotificationData = Pick<
  BookingRequestRow,
  | "id"
  | "serviceId"
  | "slotStart"
  | "vehicleMake"
  | "vehicleModel"
  | "vehicleYear"
  | "licensePlate"
  | "description"
  | "descriptionAr"
  | "translationStatus"
  | "translationProvider"
  | "customerName"
  | "customerPhone"
  | "customerEmail"
>;

/** Arabic service names, keyed by service id. Must cover every service. */
const serviceNamesAr: Record<string, string> = {
  inspektion: "الفحص الدوري والصيانة",
  bremsen: "الفرامل",
  reifen: "الإطارات والعجلات",
  diagnose: "تشخيص الأعطال",
  klima: "صيانة المكيّف",
  "hu-au": "التحضير للفحص الفني (HU/AU)",
  [OTHER_SERVICE_ID]: "أخرى / غير محدد",
};

const text = {
  subject: "طلب موعد جديد",
  heading: "طلب موعد جديد",
  notConfirmed:
    "هذا طلب من العميل وليس موعدًا مؤكدًا بعد. يُرجى التواصل مع العميل لتأكيد الموعد أو رفضه.",
  service: "الخدمة",
  date: "التاريخ",
  time: "وقت تسليم السيارة",
  customer: "العميل",
  phone: "الهاتف",
  email: "البريد الإلكتروني",
  vehicle: "السيارة",
  plate: "رقم اللوحة",
  problem: "وصف المشكلة",
  original: "النص الأصلي (بالألمانية)",
  machineTranslated: "ترجمة آلية من الألمانية – قد تحتوي على أخطاء.",
  translationFailed:
    "تعذّرت الترجمة الآلية. يُرجى الاطلاع على النص الأصلي باللغة الألمانية أدناه.",
  translationSkipped: "الترجمة الآلية غير مفعّلة. النص الأصلي باللغة الألمانية أدناه.",
  reference: "رقم الطلب",
  devBanner: "بيئة تطوير – رسالة تجريبية · Entwicklungsmodus – Testnachricht",
};

const arabicDate = new Intl.DateTimeFormat("ar-u-nu-latn", {
  timeZone: site.booking.timeZone,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const arabicTime = new Intl.DateTimeFormat("ar-u-nu-latn", {
  timeZone: site.booking.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Text that must stay left-to-right inside the RTL layout (numbers, e-mails, Latin text). */
const ltr = (value: string) => `<span dir="ltr">${escapeHtml(value)}</span>`;

function describeTranslation(data: BookingNotificationData) {
  switch (data.translationStatus) {
    case "translated":
      return { arabic: data.descriptionAr, note: text.machineTranslated };
    case "failed":
      return { arabic: null, note: text.translationFailed };
    default:
      return { arabic: null, note: text.translationSkipped };
  }
}

export function renderBookingNotification(
  data: BookingNotificationData,
  { development }: { development: boolean },
): NotificationMessage {
  const service = serviceNamesAr[data.serviceId] ?? data.serviceId;
  const date = arabicDate.format(data.slotStart);
  const time = arabicTime.format(data.slotStart);
  const vehicle = [data.vehicleMake, data.vehicleModel, data.vehicleYear].filter(Boolean).join(" ");
  const translation = describeTranslation(data);
  const subject = `${development ? "[DEV] " : ""}${text.subject}: ${service} – ${date}، ${time}`;

  const rows: [string, string][] = [
    [text.service, escapeHtml(service)],
    [text.date, escapeHtml(date)],
    [text.time, ltr(time)],
    [text.customer, `<bdi>${escapeHtml(data.customerName)}</bdi>`],
    [text.phone, `<a href="tel:${escapeHtml(data.customerPhone.replace(/[^\d+]/g, ""))}">${ltr(data.customerPhone)}</a>`],
    [text.email, `<a href="mailto:${escapeHtml(data.customerEmail)}">${ltr(data.customerEmail)}</a>`],
    [text.vehicle, ltr(vehicle)],
    ...(data.licensePlate ? [[text.plate, ltr(data.licensePlate)] as [string, string]] : []),
  ];

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;color:#1b1a17;font-family:Tahoma,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.7;">
<div dir="rtl" style="max-width:600px;margin:0 auto;padding:24px;text-align:right;">
${development ? `<p style="margin:0 0 16px;padding:8px 12px;border:1px dashed #6b665c;background:#ebe6db;font-size:13px;">${escapeHtml(text.devBanner)}</p>` : ""}
<h1 style="margin:0 0 8px;font-size:24px;">${escapeHtml(text.heading)}</h1>
<p style="margin:0 0 24px;padding:12px 16px;border-right:4px solid #c9500c;background:#fbfaf6;">${escapeHtml(text.notConfirmed)}</p>
<table role="presentation" dir="rtl" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
${rows
  .map(
    ([label, value]) =>
      `<tr><th scope="row" style="width:40%;padding:8px 0;border-bottom:1px solid #d6cfc1;text-align:right;font-weight:normal;color:#6b665c;vertical-align:top;">${escapeHtml(label)}</th><td style="padding:8px 0;border-bottom:1px solid #d6cfc1;font-weight:bold;">${value}</td></tr>`,
  )
  .join("\n")}
</table>
<h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(text.problem)}</h2>
${translation.arabic ? `<p style="margin:0 0 8px;white-space:pre-line;unicode-bidi:plaintext;">${escapeHtml(translation.arabic)}</p>` : ""}
<p style="margin:0 0 24px;font-size:13px;color:#6b665c;">${escapeHtml(translation.note)}</p>
<h2 style="margin:0 0 8px;font-size:16px;color:#6b665c;">${escapeHtml(text.original)}</h2>
<p dir="ltr" lang="de" style="margin:0 0 24px;padding:12px 16px;background:#fbfaf6;text-align:left;white-space:pre-line;">${escapeHtml(data.description)}</p>
<p style="margin:0;font-size:12px;color:#6b665c;">${escapeHtml(text.reference)}: ${ltr(data.id)}</p>
</div>
</body>
</html>`;

  const plain = [
    development ? text.devBanner : null,
    text.heading,
    text.notConfirmed,
    "",
    `${text.service}: ${service}`,
    `${text.date}: ${date}`,
    `${text.time}: ${time}`,
    `${text.customer}: ${data.customerName}`,
    `${text.phone}: ${data.customerPhone}`,
    `${text.email}: ${data.customerEmail}`,
    `${text.vehicle}: ${vehicle}`,
    data.licensePlate ? `${text.plate}: ${data.licensePlate}` : null,
    "",
    `${text.problem}:`,
    translation.arabic,
    `(${translation.note})`,
    "",
    `${text.original}:`,
    data.description,
    "",
    `${text.reference}: ${data.id}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, html, text: plain, reference: data.id };
}
