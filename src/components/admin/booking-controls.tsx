"use client";

import { useActionState } from "react";
import {
  type ActionState,
  changeBookingStatus,
  moveBooking,
  resendNotification,
} from "@/app/admin/actions";
import { type AvailabilityDay, formatShortDate } from "@/lib/booking/availability";
import type { BookingRequestRow } from "@/lib/db/schema";
import { useReportedAction } from "./feedback";

const initialState: ActionState = { status: "idle" };

const buttonBase =
  "px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60";

type BookingControlsProps = {
  id: string;
  status: BookingRequestRow["status"];
  canResend: boolean;
  availability: AvailabilityDay[];
};

export function BookingControls({ id, status, canResend, availability }: BookingControlsProps) {
  const [, statusAction, statusPending] = useActionState(
    useReportedAction(changeBookingStatus),
    initialState,
  );
  const [, moveAction, movePending] = useActionState(useReportedAction(moveBooking), initialState);
  const [, resendAction, resendPending] = useActionState(
    useReportedAction(resendNotification),
    initialState,
  );

  const active = status === "requested" || status === "confirmed";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "requested" ? (
        <>
          <form action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="transition" value="confirm" />
            <button
              type="submit"
              disabled={statusPending}
              className={`${buttonBase} bg-ink text-paper hover:bg-accent`}
            >
              Bestätigen
            </button>
          </form>
          <form
            action={statusAction}
            onSubmit={(event) => {
              if (!window.confirm("Diese Anfrage wirklich ablehnen?")) event.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="transition" value="reject" />
            <button
              type="submit"
              disabled={statusPending}
              className={`${buttonBase} border border-line hover:border-danger hover:text-danger`}
            >
              Ablehnen
            </button>
          </form>
        </>
      ) : null}

      {status === "confirmed" ? (
        <form
          action={statusAction}
          onSubmit={(event) => {
            if (!window.confirm("Diesen Termin wirklich stornieren?")) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="transition" value="cancel" />
          <button
            type="submit"
            disabled={statusPending}
            className={`${buttonBase} border border-line hover:border-danger hover:text-danger`}
          >
            Stornieren
          </button>
        </form>
      ) : null}

      {active ? (
        <form action={moveAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <label htmlFor={`slot-${id}`} className="sr-only">
            Neuer Termin
          </label>
          <select
            id={`slot-${id}`}
            name="slot"
            required
            defaultValue=""
            className="border border-line bg-paper px-2 py-2 text-sm focus:border-ink"
          >
            <option value="" disabled>
              Neuer Termin …
            </option>
            {availability.map((day) => (
              <optgroup key={day.date} label={formatShortDate(day.date)}>
                {day.slots
                  .filter((slot) => slot.available)
                  .map((slot) => (
                    <option key={slot.time} value={`${day.date}T${slot.time}`}>
                      {formatShortDate(day.date)} {slot.time}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <button
            type="submit"
            disabled={movePending}
            className={`${buttonBase} border border-line hover:border-ink`}
          >
            Verschieben
          </button>
        </form>
      ) : null}

      {canResend ? (
        <form action={resendAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={resendPending}
            className={`${buttonBase} border border-line hover:border-ink`}
          >
            {resendPending ? "Wird gesendet …" : "Benachrichtigung erneut senden"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
