import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display:  "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets:  ["latin"],
  weight:   ["700", "800"],
  variable: "--font-bricolage",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "PowerChat Field Ops",
  description: "Internal app for PowerChat field agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${bricolage.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
