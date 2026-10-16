import { z } from "zod";
export function authSchema(register: boolean) {
  return z
    .object({
      email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
      password: z
        .string()
        .min(register ? 6 : 1)
        .max(128),
      confirmPassword: register ? z.string().min(6) : z.string().optional(),
      consent: register ? z.literal(true) : z.boolean().optional(),
    })
    .refine((data) => !register || data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
}
