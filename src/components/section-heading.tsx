import type { ReactNode } from "react";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
};

export function SectionHeading({ id, eyebrow, title, children }: SectionHeadingProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <p className="eyebrow">{eyebrow}</p>
        <h2
          id={id}
          className="font-wide mt-4 text-4xl leading-none font-extrabold tracking-tight sm:text-5xl"
        >
          {title}
        </h2>
      </div>
      {children ? (
        <p className="max-w-md text-lg leading-relaxed text-ink-soft lg:col-span-5 lg:col-start-8 lg:self-end">
          {children}
        </p>
      ) : null}
    </div>
  );
}
