import type { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function CursorPager({
  navigation,
  nextCursor,
  busy = false,
}: {
  navigation: ReturnType<typeof useCursorNavigation>;
  nextCursor?: string | null;
  busy?: boolean;
}) {
  const { en } = usePrefs();
  if (!navigation.canBack && !nextCursor) return null;
  return (
    <nav
      className="button-row"
      aria-label={t(en, "তালিকার পৃষ্ঠা", "List pagination")}
    >
      <button
        type="button"
        className="button secondary"
        disabled={!navigation.canBack || busy}
        onClick={navigation.back}
      >
        {t(en, "আগের পৃষ্ঠা", "Previous")}
      </button>
      <button
        type="button"
        className="button secondary"
        disabled={!nextCursor || busy}
        onClick={() => nextCursor && navigation.next(nextCursor)}
      >
        {t(en, "পরের পৃষ্ঠা", "Next")}
      </button>
    </nav>
  );
}
