import type { Metadata } from "next";
import "./globals.css";
import { SiteSettingsProvider } from "@/lib/siteSettings";

export const metadata: Metadata = {
  title: "Hostel Management",
  description: "Manage your hostel bookings, rooms and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full font-sans">
        <SiteSettingsProvider>
          {children}
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
