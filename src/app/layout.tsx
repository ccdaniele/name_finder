import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Name Generator",
  description: "AI-powered company and product name generator with trademark validation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
