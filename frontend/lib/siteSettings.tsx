"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_URL } from "./auth";

interface SiteSettings {
  companyName: string;
  companyLogo: string;
  companyFavicon: string;
  companyEmail: string;
  companyPhone: string;
  companyCountry: string;
  companyDescription: string;
  companyLatitude: string;
  companyLongitude: string;
  copyrightText: string;
  cookiesText: string;
  currencyCode: string;
  currencySymbol: string;
  currencySymbolPosition: string;
  decimalDigits: string;
  timeZone: string;
  timeFormat: string;
  maintenanceMode: boolean;
  loaded: boolean;
}

const defaults: SiteSettings = {
  companyName: "Hostel Management System",
  companyLogo: "",
  companyFavicon: "",
  companyEmail: "info@hostelmanagment.com",
  companyPhone: "+91 9999999999",
  companyCountry: "India",
  companyDescription: "A modern hostel management system for seamless room booking and management.",
  companyLatitude: "",
  companyLongitude: "",
  copyrightText: "© 2026 Hostel Management System. All rights reserved.",
  cookiesText: "We use cookies to improve your experience.",
  currencyCode: "INR",
  currencySymbol: "₹",
  currencySymbolPosition: "left",
  decimalDigits: "0",
  timeZone: "Asia/Kolkata",
  timeFormat: "12",
  maintenanceMode: false,
  loaded: false,
};

const SiteSettingsContext = createContext<SiteSettings>(defaults);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaults);

  const currencySymbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$", AUD: "A$",
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // Try localStorage cache first for instant paint
      try {
        const cached = localStorage.getItem("siteSettings");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (mounted) {
            setSettings({ ...parsed, loaded: true });
            applyToDOM(parsed);
          }
        }
      } catch {}

      // Fetch fresh from API
      try {
        const res = await fetch(`${API_URL}/api/settings/business-public`);
        const data = await res.json();
        if (data.success && data.data && mounted) {
          const d = data.data;
          const s: SiteSettings = {
            companyName: d.company_name || defaults.companyName,
            companyLogo: d.company_logo || "",
            companyFavicon: d.company_favicon || "",
            companyEmail: d.company_email || defaults.companyEmail,
            companyPhone: d.company_phone || defaults.companyPhone,
            companyCountry: d.company_country || defaults.companyCountry,
            companyDescription: d.company_description || defaults.companyDescription,
            companyLatitude: d.company_latitude || "",
            companyLongitude: d.company_longitude || "",
            copyrightText: d.copyright_text || defaults.copyrightText,
            cookiesText: d.cookies_text || defaults.cookiesText,
            currencyCode: d.currency_code || "INR",
            currencySymbol: currencySymbols[d.currency_code] || "₹",
            currencySymbolPosition: d.currency_symbol_position || "left",
            decimalDigits: d.decimal_digits || "0",
            timeZone: d.time_zone || "Asia/Kolkata",
            timeFormat: d.time_format || "12",
            maintenanceMode: d.maintenance_mode_active === 1 || d.maintenance_mode === "1",
            loaded: true,
          };
          setSettings(s);
          localStorage.setItem("siteSettings", JSON.stringify(s));
          applyToDOM(s);
        }
      } catch {
        // API unreachable — keep defaults or cached
        if (mounted) setSettings((prev) => ({ ...prev, loaded: true }));
      }
    };

    load();

    // Refresh settings every 60 seconds
    const interval = setInterval(load, 60000);

    // Listen for manual refresh events (e.g. after saving business settings)
    const handleRefresh = () => {
      // Clear cache first so we get fresh data
      localStorage.removeItem("siteSettings");
      load();
    };
    window.addEventListener("site-settings-changed", handleRefresh);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("site-settings-changed", handleRefresh);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

function applyToDOM(s: SiteSettings) {
  // Set page title
  if (s.companyName) {
    document.title = s.companyName;
  }

  // Set favicon — ONLY update href on existing elements, never remove them.
  // Next.js 16 internally manages <head> elements; calling el.remove() on
  // them causes "Cannot read properties of null (reading 'removeChild')"
  // when React tries to reconcile during navigation.
  if (s.companyFavicon) {
    try {
      const cacheBust = '?t=' + Date.now();
      const faviconUrl = s.companyFavicon + cacheBust;

      // Find existing favicons and update their href in-place
      const existingIcons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
      if (existingIcons.length > 0) {
        // Update existing elements — never remove them
        existingIcons.forEach((el) => {
          (el as HTMLLinkElement).href = faviconUrl;
        });
      } else {
        // No existing favicon — safe to create new ones only if none exist
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = faviconUrl;
        document.head.appendChild(newLink);
      }
    } catch {
      // Silently ignore DOM errors during navigation
    }
  }
}

/**
 * Helper: Format currency value using site settings.
 * Usage: formatCurrency(5000) → "₹5000" or "5000₹" depending on position
 */
export function formatCurrency(value: number, settings: SiteSettings): string {
  const digits = parseInt(settings.decimalDigits || "0", 10);
  const formatted = value.toFixed(digits);
  const symbol = settings.currencySymbol || "₹";
  return settings.currencySymbolPosition === "right"
    ? `${formatted}${symbol}`
    : `${symbol}${formatted}`;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
