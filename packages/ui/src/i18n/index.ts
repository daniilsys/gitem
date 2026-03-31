import { en } from "./en";
import { fr } from "./fr";
import type { Translations, TFunction } from "./types";

const dictionaries: Record<string, Translations> = { en, fr };

export function resolveLocale(override?: string | null): string {
  if (override && override in dictionaries) return override;
  const nav = navigator.language.slice(0, 2);
  return nav in dictionaries ? nav : "en";
}

export function createT(locale: string): TFunction {
  const translations = dictionaries[locale] ?? dictionaries.en;
  return (key, vars) => {
    let str = translations[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return str;
  };
}

export { I18nProvider, useT } from "./context";
export type { TKey, TFunction, Translations } from "./types";
