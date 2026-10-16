export interface ReturnTo {
  pathname: string;
  state?: unknown;
}
export function returnToFrom(state: unknown): ReturnTo | undefined {
  if (!state || typeof state !== "object" || !("returnTo" in state)) return;
  const target = state.returnTo;
  if (
    !target ||
    typeof target !== "object" ||
    !("pathname" in target) ||
    typeof target.pathname !== "string"
  )
    return;
  if (
    !/^\/(?:requests(?:\/new|\/[a-f0-9]{24}(?:\/edit)?)?|dashboard|admin)$/.test(
      target.pathname,
    )
  )
    return;
  return {
    pathname: target.pathname,
    state: "state" in target ? target.state : undefined,
  };
}
