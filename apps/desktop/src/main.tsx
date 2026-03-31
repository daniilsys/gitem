import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, resolveLocale, createT } from "@gitem/ui";
import { useAppStore } from "./store";
import { App } from "./App";
import "./styles.css";

function Root() {
  const locale = useAppStore((s) => s.locale);
  const resolved = resolveLocale(locale);
  const t = useMemo(() => createT(resolved), [resolved]);

  return (
    <I18nProvider t={t}>
      <App />
    </I18nProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
