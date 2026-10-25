"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/booking/fields";
import { type ActionState, login } from "../actions";

const initialState: ActionState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-10 space-y-6">
      {state.status === "error" ? (
        <p
          role="alert"
          className="border-2 border-danger bg-field px-4 py-3 font-medium text-danger"
        >
          {state.message}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="font-medium">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={`${inputClass} border-line`}
        />
      </div>
      <div>
        <label htmlFor="password" className="font-medium">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`${inputClass} border-line`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink px-6 py-3.5 font-semibold text-paper transition-colors hover:bg-accent disabled:cursor-wait disabled:bg-muted"
      >
        {pending ? "Anmeldung läuft …" : "Anmelden"}
      </button>
    </form>
  );
}
