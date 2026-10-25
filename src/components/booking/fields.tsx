import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export const inputClass =
  "mt-2 block w-full border bg-field px-3.5 py-3 text-base text-ink placeholder:text-muted/70 transition-colors focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-accent aria-invalid:border-danger";

type FieldShellProps = {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
};

/** Label, hint and error message around one form control. */
export function FieldShell({ id, label, optional, hint, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 font-medium">
        {label}
        {optional ? <span className="text-sm font-normal text-muted">optional</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

/** aria-describedby value that links a control to its hint and error. */
export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: string }) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type TextFieldProps = Omit<FieldShellProps, "children"> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function TextField({ id, label, optional, hint, error, className, ...input }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <input
        id={id}
        name={id}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        className={`${inputClass} border-line ${className ?? ""}`}
        {...input}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<FieldShellProps, "children"> &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextAreaField({ id, label, optional, hint, error, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <textarea
        id={id}
        name={id}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        className={`${inputClass} min-h-40 resize-y border-line leading-relaxed`}
        {...textarea}
      />
    </FieldShell>
  );
}
