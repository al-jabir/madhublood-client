import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePrefs = create(
  persist<{
    en: boolean;
    dark: boolean;
    toggleLang: () => void;
    toggleTheme: () => void;
  }>(
    (set) => ({
      en: false,
      dark: matchMedia("(prefers-color-scheme: dark)").matches,
      toggleLang: () => set((s) => ({ en: !s.en })),
      toggleTheme: () => set((s) => ({ dark: !s.dark })),
    }),
    { name: "madhublood-preferences" },
  ),
);
