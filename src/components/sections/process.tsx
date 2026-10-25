import { SectionHeading } from "../section-heading";

const steps = [
  {
    title: "Termin anfragen",
    description:
      "Wählen Sie Leistung, Wunschtag und Uhrzeit und beschreiben Sie kurz, was Ihnen am Fahrzeug aufgefallen ist.",
  },
  {
    title: "Bestätigung abwarten",
    description:
      "Wir prüfen die Anfrage und melden uns bei Ihnen. Erst mit unserer Bestätigung ist der Termin fest vereinbart.",
  },
  {
    title: "Fahrzeug bringen",
    description:
      "Zum vereinbarten Zeitpunkt nehmen wir Ihr Auto an, besprechen den Auftrag und nennen Ihnen die voraussichtlichen Kosten.",
  },
  {
    title: "Abholen",
    description:
      "Wir erklären Ihnen, was gemacht wurde, und übergeben Ihnen das Fahrzeug mit der Rechnung.",
  },
];

export function Process() {
  return (
    <section
      id="ablauf"
      aria-labelledby="ablauf-title"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28"
    >
      <SectionHeading id="ablauf-title" eyebrow="Ablauf" title="So kommen Sie zu Ihrem Termin">
        Vier Schritte, von der Anfrage bis zur Abholung.
      </SectionHeading>

      <ol className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="bg-paper py-8 sm:pr-8 lg:py-10">
            <span className="font-wide text-5xl font-extrabold text-line">
              {index + 1}
            </span>
            <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
