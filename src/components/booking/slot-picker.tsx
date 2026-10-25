import { type AvailabilityDay, formatShortDate } from "@/lib/booking/availability";
import { FieldError } from "./fields";

const optionClass =
  "relative flex cursor-pointer flex-col border border-line bg-field px-3 py-2.5 transition-colors hover:border-ink has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:bg-transparent has-disabled:text-muted/60 has-disabled:hover:border-line";

type SlotPickerProps = {
  days: AvailabilityDay[];
  date: string;
  time: string;
  dateError?: string;
  timeError?: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

export function SlotPicker({
  days,
  date,
  time,
  dateError,
  timeError,
  onDateChange,
  onTimeChange,
}: SlotPickerProps) {
  if (days.length === 0) {
    return (
      <p className="border border-dashed border-line px-4 py-6 text-ink-soft">
        Derzeit sind keine Termine online verfügbar. Bitte rufen Sie uns an.
      </p>
    );
  }

  const selectedDay = days.find((day) => day.date === date);

  return (
    <div className="space-y-8">
      <fieldset id="booking-date" aria-describedby={dateError ? "booking-date-error" : undefined}>
        <legend className="font-medium">Tag</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {days.map((day) => {
            const fullyBooked = day.slots.every((slot) => !slot.available);
            const [weekday, dayMonth] = formatShortDate(day.date).split(", ");
            return (
              <label key={day.date} className={optionClass}>
                <input
                  type="radio"
                  name="booking-date"
                  value={day.date}
                  checked={date === day.date}
                  disabled={fullyBooked}
                  onChange={() => onDateChange(day.date)}
                  className="sr-only"
                />
                <span className="font-mono text-xs tracking-wider uppercase opacity-70">
                  {weekday.replace(".", "")}
                </span>
                <span className="font-semibold">{dayMonth}</span>
                {fullyBooked ? <span className="text-xs">ausgebucht</span> : null}
              </label>
            );
          })}
        </div>
        <FieldError id="booking-date-error" message={dateError} />
      </fieldset>

      <fieldset
        id="booking-time"
        aria-describedby={timeError ? "booking-time-error" : "booking-time-hint"}
      >
        <legend className="font-medium">Uhrzeit der Fahrzeugannahme</legend>
        {selectedDay ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {selectedDay.slots.map((slot) => (
              <label key={slot.time} className={`${optionClass} items-center`}>
                <input
                  type="radio"
                  name="booking-time"
                  value={slot.time}
                  checked={time === slot.time}
                  disabled={!slot.available}
                  onChange={() => onTimeChange(slot.time)}
                  className="sr-only"
                />
                <span className="font-mono font-medium">{slot.time}</span>
                {slot.available ? null : <span className="text-xs">belegt</span>}
              </label>
            ))}
          </div>
        ) : (
          <p id="booking-time-hint" className="mt-3 text-sm text-muted">
            Bitte wählen Sie zuerst einen Tag.
          </p>
        )}
        <FieldError id="booking-time-error" message={timeError} />
      </fieldset>
    </div>
  );
}
