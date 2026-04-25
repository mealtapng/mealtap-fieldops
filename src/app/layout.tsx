import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "Mealtap Field Ops",
  description: "Internal app for Mealtap field agents to capture restaurant vendors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
