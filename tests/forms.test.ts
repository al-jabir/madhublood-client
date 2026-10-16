import { test } from "node:test";
import assert from "node:assert/strict";
import { authSchema } from "../src/features/auth/schemas/auth.schema.ts";
import { t } from "../src/i18n/translate.ts";
import { errorText } from "../src/utils/error-text.ts";
import { AxiosError } from "axios";
test("registration retains phone, password and explicit consent validation", () => {
  const input = {
    name: "Donor",
    phone: "+8801712345678",
    password: "a-long-password",
    consent: true,
  };
  assert.equal(authSchema(true).safeParse(input).success, true);
  assert.equal(
    authSchema(true).safeParse({ ...input, consent: false }).success,
    false,
  );
  assert.equal(
    authSchema(true).safeParse({ ...input, phone: "bad" }).success,
    false,
  );
  assert.equal(
    authSchema(true).safeParse({ ...input, password: "short" }).success,
    false,
  );
});
test("login accepts established login fields without registration consent", () =>
  assert.equal(
    authSchema(false).safeParse({
      phone: "+8801712345678",
      password: "password",
    }).success,
    true,
  ));
test("language helper keeps Bangla as the default preference", () => {
  assert.equal(t(false, "বাংলা", "English"), "বাংলা");
  assert.equal(t(true, "বাংলা", "English"), "English");
});
test("error messages use API-safe text and do not echo arbitrary exception content", () => {
  assert.ok(
    !errorText(new Error("private payload")).includes("private payload"),
  );
  const error = new AxiosError("network");
  assert.match(errorText(error), /Please try again/);
});
