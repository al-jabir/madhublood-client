import { z } from "zod";
export function authSchema(register: boolean) {
  return z.object({
    name: register ? z.string().min(2) : z.string().optional(),
    phone: z.string().regex(/^\+8801[3-9]\d{8}$/, "Use +8801XXXXXXXXX"),
    password: z.string().min(register ? 12 : 1),
    mfa: z.string().optional(),
    consent: register ? z.literal(true) : z.boolean().optional(),
  });
}
