"use client";

import {
  type FormEvent,
  type ReactNode,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { site } from "@/config/site";
import { requestBooking } from "@/app/termin/actions";
import type { AvailabilityDay } from "@/lib/booking/availability";
import {
  type BookingField,
  type BookingFormValues,
  DESCRIPTION_MAX,
  serviceOptions,
  validateBooking,
} from "@/lib/booking/schema";
import type { BookingSubmitState } from "@/lib/booking/submit-state";
import { BookingConfirmation } from "./booking-confirmation";
import { FieldError, TextAreaField, TextField } from "./fields";
import { SlotPicker } from "./slot-picker";

const initialValues: BookingFormValues = {
  serviceId: "",
  date: "",
  time: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  licensePlate: "",
  description: "",
  name: "",
  phone: "",
  email: "",
  consent: false,
};

/** Fields in on-screen order, with the labels used in the error summary. */
const fieldLabels: Record<BookingField, string> = {
  serviceId: "Leistung",
  date: "Tag",
  time: "Uhrzeit",
  vehicleMake: "Marke",
  vehicleModel: "Modell",
  vehicleYear: "Baujahr",
  licensePlate: "Kennzeichen",
  description: "Beschreibung",
  name: "Name",
  phone: "Telefon",
  email: "E-Mail",
  consent: "Einwilligung",
};

const allFields = Object.keys(fieldLabels) as BookingField[];

const fieldId = (field: BookingField) => `booking-${field}`;

/** Moves focus to a field; for radio groups, to the first selectable option. */
function focusField(field: BookingField) {
  const element = document.getElementById(fieldId(field));
  if (!element) return;
  const target =
    element instanceof HTMLFieldSetElement
      ? (element.querySelector<HTMLInputElement>("input:not(:disabled)") ?? element)
      : element;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "center" });
}

const initialSubmitState: BookingSubmitState = { status: "idle" };

type BookingFormProps = {
  days: AvailabilityDay[];
  onRestart: () => void;
};

export function BookingForm({ days, onRestart }: BookingFormProps) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<ReadonlySet<BookingField>>(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [submitState, submit, pending] = useActionState(requestBooking, initialSubmitState);

  const summaryRef = useRef<HTMLDivElement>(null);
  const submitErrorRef = useRef<HTMLDivElement>(null);

  const { errors } = validateBooking(values);
  // The selected slot can become unavailable when the availability is
  // refreshed (e.g. someone else requested it first).
  const selectedSlot = days
    .find((day) => day.date === values.date)
    ?.slots.find((slot) => slot.time === values.time);
  if (values.time && !selectedSlot?.available) {
    errors.time ??= "Diese Uhrzeit ist nicht mehr verfügbar. Bitte wählen Sie eine andere.";
  }
  const errorFor = (field: BookingField) => (touched.has(field) ? errors[field] : undefined);
  const summaryErrors = allFields.filter((field) => errors[field]);

  useEffect(() => {
    if (submitState.status === "error") submitErrorRef.current?.focus();
  }, [submitState]);

  function update<K extends BookingField>(field: K, value: BookingFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function touch(field: BookingField) {
    setTouched((current) => (current.has(field) ? current : new Set(current).add(field)));
  }

  function changeAndTouch<K extends BookingField>(field: K, value: BookingFormValues[K]) {
    update(field, value);
    touch(field);
  }

  /** Props shared by all text inputs: value, change and validate-on-blur. */
  function textProps(field: BookingField) {
    return {
      id: fieldId(field),
      value: values[field] as string,
      error: errorFor(field),
      onChange: (event: { target: { value: string } }) => update(field, event.target.value),
      onBlur: () => touch(field),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(new Set(allFields));

    if (summaryErrors.length > 0) {
      flushSync(() => setShowSummary(true));
      summaryRef.current?.focus({ preventScroll: true });
      summaryRef.current?.scrollIntoView({ block: "start" });
      return;
    }

    setShowSummary(false);
    startTransition(() => submit(values));
  }

  if (submitState.status === "success") {
    return <BookingConfirmation request={submitState.request} onRestart={onRestart} />;
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={pending} className="space-y-14">
      {showSummary && summaryErrors.length > 0 ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          aria-labelledby="booking-summary-title"
          className="border-2 border-danger bg-field p-5 focus:outline-none"
        >
          <h2 id="booking-summary-title" className="font-semibold text-danger">
            Bitte prüfen Sie Ihre Angaben
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {summaryErrors.map((field) => (
              <li key={field}>
                <a
                  href={`#${fieldId(field)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    focusField(field);
                  }}
                  className="underline underline-offset-2 hover:text-danger"
                >
                  {fieldLabels[field]}: {errors[field]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset disabled={pending} className="space-y-14">
        <FormSection step={1} title="Leistung">
          <fieldset
            id={fieldId("serviceId")}
            aria-describedby={errorFor("serviceId") ? "booking-serviceId-error" : undefined}
          >
            <legend className="sr-only">Gewünschte Leistung</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {serviceOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 border border-line bg-field px-4 py-3.5 transition-colors hover:border-ink has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    name="booking-serviceId"
                    value={option.id}
                    checked={values.serviceId === option.id}
                    onChange={() => changeAndTouch("serviceId", option.id)}
                    className="size-4 accent-accent"
                  />
                  {option.title}
                </label>
              ))}
            </div>
            <FieldError id="booking-serviceId-error" message={errorFor("serviceId")} />
          </fieldset>
        </FormSection>

        <FormSection
          step={2}
          title="Wunschtermin"
          description="Wählen Sie, wann Sie Ihr Fahrzeug bringen möchten. Der Termin gilt erst nach unserer Bestätigung."
        >
          <SlotPicker
            days={days}
            date={values.date}
            time={values.time}
            dateError={errorFor("date")}
            timeError={errorFor("time")}
            onDateChange={(date) => {
              setValues((current) => ({ ...current, date, time: "" }));
              touch("date");
            }}
            onTimeChange={(time) => changeAndTouch("time", time)}
          />
        </FormSection>

        <FormSection step={3} title="Fahrzeug">
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField label="Marke" placeholder="z. B. Volkswagen" autoComplete="off" {...textProps("vehicleMake")} />
            <TextField label="Modell" placeholder="z. B. Golf" autoComplete="off" {...textProps("vehicleModel")} />
            <TextField
              label="Baujahr"
              optional
              inputMode="numeric"
              maxLength={4}
              placeholder="z. B. 2016"
              autoComplete="off"
              {...textProps("vehicleYear")}
            />
            <TextField
              label="Kennzeichen"
              optional
              maxLength={12}
              placeholder="z. B. B-AC 1234"
              autoComplete="off"
              className="uppercase placeholder:normal-case"
              {...textProps("licensePlate")}
            />
          </div>
        </FormSection>

        <FormSection step={4} title="Ihr Anliegen">
          <TextAreaField
            label="Was sollen wir uns ansehen?"
            maxLength={DESCRIPTION_MAX}
            placeholder="z. B. Beim Bremsen quietscht es vorne links, seit etwa zwei Wochen."
            hint={
              <>
                Beschreiben Sie Geräusche, Warnleuchten oder seit wann das Problem besteht.{" "}
                <span className="font-mono">
                  {values.description.length}/{DESCRIPTION_MAX}
                </span>
              </>
            }
            {...textProps("description")}
          />
        </FormSection>

        <FormSection step={5} title="Kontaktdaten">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField label="Vor- und Nachname" autoComplete="name" {...textProps("name")} />
            </div>
            <TextField label="Telefon" type="tel" autoComplete="tel" {...textProps("phone")} />
            <TextField label="E-Mail" type="email" autoComplete="email" {...textProps("email")} />
          </div>

          <div className="mt-8">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                id={fieldId("consent")}
                type="checkbox"
                checked={values.consent}
                onChange={(event) => changeAndTouch("consent", event.target.checked)}
                aria-invalid={errorFor("consent") ? true : undefined}
                aria-describedby={errorFor("consent") ? "booking-consent-error" : undefined}
                className="mt-1 size-4 shrink-0 accent-accent"
              />
              <span className="leading-relaxed text-ink-soft">
                Ich bin einverstanden, dass {site.name} meine Angaben zur Bearbeitung dieser
                Terminanfrage speichert und mich dazu kontaktiert.
              </span>
            </label>
            <FieldError id="booking-consent-error" message={errorFor("consent")} />
          </div>
        </FormSection>
      </fieldset>

      <div className="border-t border-line pt-8">
        {submitState.status === "error" ? (
          <div
            ref={submitErrorRef}
            tabIndex={-1}
            role="alert"
            className="mb-6 border-2 border-danger bg-field p-5 focus:outline-none"
          >
            <p className="font-semibold text-danger">{submitState.message}</p>
            <p className="mt-2 text-ink-soft">
              Ihre Eingaben bleiben erhalten. Sie erreichen uns auch telefonisch unter{" "}
              <a href={`tel:${site.contact.phoneHref}`} className="font-medium underline">
                {site.contact.phoneDisplay}
              </a>
              .
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Mit dem Absenden stellen Sie eine unverbindliche Anfrage.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="bg-accent px-8 py-4 font-semibold text-paper transition-colors duration-200 hover:bg-accent-strong disabled:cursor-wait disabled:bg-muted"
          >
            {pending ? "Anfrage wird gesendet …" : "Terminanfrage senden"}
          </button>
        </div>
        <p className="sr-only" role="status">
          {pending ? "Ihre Anfrage wird gesendet." : ""}
        </p>
      </div>
    </form>
  );
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = `booking-step-${step}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-6 border-b border-line pb-4">
        <h2 id={headingId} className="flex items-baseline gap-3 text-2xl font-semibold">
          <span className="font-mono text-sm text-accent">{String(step).padStart(2, "0")}</span>
          {title}
        </h2>
        {description ? <p className="mt-2 text-ink-soft">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
