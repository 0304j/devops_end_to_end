import Image from "next/image";
import { site } from "@/config/site";
import engineImage from "../../../public/images/motor-detail.jpg";

export function Approach() {
  return (
    <section aria-labelledby="arbeitsweise-title" className="bg-paper-deep">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-12">
        <div className="relative aspect-[3/2] lg:col-span-6 lg:aspect-auto lg:min-h-[560px]">
          <Image
            src={engineImage}
            alt="Blick von oben in einen älteren Motorraum mit Luftfilter, Ventildeckel und Leitungen."
            fill
            placeholder="blur"
            sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="px-4 py-16 sm:px-6 lg:col-span-6 lg:px-14 lg:py-24">
          <p className="eyebrow">Arbeitsweise</p>
          <h2
            id="arbeitsweise-title"
            className="font-wide mt-4 text-4xl leading-none font-extrabold tracking-tight sm:text-5xl"
          >
            Sie wissen, woran Sie sind.
          </h2>

          <dl className="mt-12 space-y-8">
            {site.principles.map((principle) => (
              <div key={principle.title} className="border-l-2 border-accent pl-5">
                <dt className="text-lg font-semibold">{principle.title}</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">
                  {principle.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
