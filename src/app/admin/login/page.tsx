import type { Metadata } from "next";
import { site } from "@/config/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <main
      id="inhalt"
      className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16"
    >
      <p className="text-xl font-extrabold font-wide">{site.name}</p>
      <h1 className="mt-6 text-3xl font-semibold">Verwaltung</h1>
      <p className="mt-2 text-ink-soft">Nur für Mitarbeitende der Werkstatt.</p>
      <LoginForm />
    </main>
  );
}
