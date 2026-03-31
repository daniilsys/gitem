import { createContext, useContext } from "react";
import type { TFunction } from "./types";

const fallback: TFunction = (key) => key;

const I18nContext = createContext<TFunction>(fallback);

export function I18nProvider({ t, children }: { t: TFunction; children: React.ReactNode }) {
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useT(): TFunction {
  return useContext(I18nContext);
}
