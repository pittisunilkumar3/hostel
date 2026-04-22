import type { Metadata } from "next";
import "./globals.css";
import { SiteSettingsProvider } from "@/lib/siteSettings";
import { I18nProvider } from "@/lib/i18n";

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
      <body className="min-h-full font-sans">
        <SiteSettingsProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
