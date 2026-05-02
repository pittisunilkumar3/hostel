// Currency helper for backend (notifications, emails, etc.)
import { getSettingValue } from "../services/settingsService";

const currencySymbols: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$", AUD: "A$",
};

export async function getCurrencySymbol(): Promise<string> {
  const code = await getSettingValue("currency_code") || "INR";
  return currencySymbols[code] || "₹";
}

export async function formatAmount(amount: number): Promise<string> {
  const code = await getSettingValue("currency_code") || "INR";
  const symbol = currencySymbols[code] || "₹";
  const position = await getSettingValue("currency_symbol_position") || "left";
  const digits = parseInt(await getSettingValue("decimal_digits") || "0", 10);
  const formatted = amount.toFixed(digits);
  return position === "right" ? `${formatted}${symbol}` : `${symbol}${formatted}`;
}
