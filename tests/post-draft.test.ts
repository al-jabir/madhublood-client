import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePostDraft } from "../src/features/blood-requests/components/post-draft";
test("social post parser normalizes Bengali digits without guessing dates or consent", () => {
  const draft = parsePostDraft(
    "জরুরী ভিত্তিতে O+ রক্তের প্রয়োজন আজকেই।\nরোগীর সমস্যা: সিজার।\nপরিমাণ: একব্যাগ।\nস্থান: মেট্রো হাসপাতাল মধুপুর\nরেফারেন্স: ব্যক্তি (০১৯০৩০১০৮২৮)",
  );
  assert.deepEqual(draft, {
    bloodGroup: "O+",
    contact: "01903010828",
    units: "1",
    hospital: "মেট্রো হাসপাতাল মধুপুর",
    patientReason: "সিজার।",
  });
  assert.equal(Object.hasOwn(draft, "requiredAt"), false);
  assert.equal(Object.hasOwn(draft, "contactConsent"), false);
});
test("post import bounds fields and ignores malformed units", () => {
  assert.equal(
    parsePostDraft("AB- 2 bags\nHospital: Example").bloodGroup,
    "AB-",
  );
  assert.equal(parsePostDraft("Units: 99").units, undefined);
  assert.deepEqual(parsePostDraft("No usable fields"), {});
});
