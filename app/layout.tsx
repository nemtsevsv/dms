import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealer Management System",
  description: "Internal DMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800">{children}</body>
    </html>
  );
}
