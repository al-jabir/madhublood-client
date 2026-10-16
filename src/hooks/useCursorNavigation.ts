import { useState } from "react";
export function useCursorNavigation(scope = "") {
  const [state, setState] = useState<{
    scope: string;
    cursors: (string | undefined)[];
  }>({ scope, cursors: [undefined] });
  const cursors = state.scope === scope ? state.cursors : [undefined];
  return {
    after: cursors.at(-1),
    canBack: cursors.length > 1,
    next: (cursor: string) =>
      setState({ scope, cursors: [...cursors, cursor] }),
    back: () =>
      setState({
        scope,
        cursors: cursors.length > 1 ? cursors.slice(0, -1) : cursors,
      }),
  };
}
