"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_URL } from "./auth";

interface SiteSettings {
  companyName: string;
  companyLogo: string;
  companyFavicon: string;
  companyEmail: string;
  companyPhone: string;
  companyDescription: string;
  copyrightText: string;
  currencyCode: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  loaded: boolean;
}

const defaults: SiteSettings = {
  companyName: "Hostel Management",
  companyLogo: "",
  companyFavicon: "",
  companyEmail: "",
  companyPhone: "",
  companyDescription: "",
  copyrightText: "",
  currencyCode: "INR",
  currencySymbol: "₹",
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
          const s: SiteSettings = {
            companyName: data.data.company_name || defaults.companyName,
            companyLogo: data.data.company_logo || "",
            companyFavicon: data.data.company_favicon || "",
            companyEmail: data.data.company_email || "",
            companyPhone: data.data.company_phone || "",
            companyDescription: data.data.company_description || "",
            copyrightText: data.data.copyright_text || "",
            currencyCode: data.data.currency_code || "INR",
            currencySymbol: currencySymbols[data.data.currency_code] || "₹",
            maintenanceMode: data.data.maintenance_mode_active === 1,
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
    const handleRefresh = () => load();
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

  // Set favicon
  if (s.companyFavicon) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = s.companyFavicon;
  }
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
