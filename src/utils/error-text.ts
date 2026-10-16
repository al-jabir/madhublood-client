import { isAxiosError } from "axios";
export function errorText(error: unknown): string {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data?.error?.message ??
      "সার্ভারে সংযোগ করা যাচ্ছে না। Please try again."
    );
  }
  return "সার্ভারে সংযোগ করা যাচ্ছে না। Please try again.";
}
