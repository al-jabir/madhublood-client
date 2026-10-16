import { useEffect } from "react";
import { usePrefs } from "@/store/preferences.store";
export function useDocumentPreferences() {
  const { en, dark } = usePrefs();
  useEffect(() => {
    document.documentElement.lang = en ? "en" : "bn";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [en, dark]);
}
