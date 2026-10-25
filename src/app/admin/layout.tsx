import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Verwaltung", template: "%s – Verwaltung" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-paper">{children}</div>;
}
