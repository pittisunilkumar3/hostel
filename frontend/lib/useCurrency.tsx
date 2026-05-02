"use client";

import { useSiteSettings, formatCurrency } from "./siteSettings";

/**
 * Lightweight hook that returns the currency formatter + current symbol.
 * Usage:
 *   const { fc, symbol } = useCurrency();
 *   <span>{fc(5000)}</span>  → "₹5000" or "$5000" etc.
 *   <span>{symbol}</span>    → "₹" or "$" etc.
 */
export function useCurrency() {
  const settings = useSiteSettings();
  const fc = (value: number) => formatCurrency(value, settings);
  return {
    fc,                             // format currency value
    symbol: settings.currencySymbol || "₹",
    code: settings.currencyCode || "INR",
    position: settings.currencySymbolPosition || "left",
    digits: settings.decimalDigits || "0",
  };
}
