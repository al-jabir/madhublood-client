const labels: Record<string, [string, string]> = {
  "whole-blood": ["সম্পূর্ণ রক্ত", "Whole blood"],
  "red-cells": ["লোহিত রক্তকণিকা", "Red cells"],
  platelets: ["অণুচক্রিকা", "Platelets"],
  plasma: ["রক্তরস", "Plasma"],
  routine: ["সাধারণ", "Routine"],
  urgent: ["জরুরি", "Urgent"],
  critical: ["অতি জরুরি", "Critical"],
  submitted: ["জমা হয়েছে", "Submitted"],
  verification: ["যাচাই চলছে", "Under review"],
  active: ["সক্রিয়", "Active"],
  "donors-contacted": ["রক্তদাতাদের জানানো হয়েছে", "Donors contacted"],
  arranged: ["রক্তের ব্যবস্থা হয়েছে", "Arranged"],
  completed: ["সম্পন্ন", "Completed"],
  cancelled: ["বাতিল", "Cancelled"],
  rejected: ["প্রত্যাখ্যাত", "Rejected"],
  expired: ["মেয়াদ শেষ", "Expired"],
  accepted: ["সাড়া দিয়েছেন", "Accepted"],
  declined: ["সাড়া দেননি", "Declined"],
};
export const requestLabel = (en: boolean, value: string) =>
  labels[value]?.[en ? 1 : 0] ?? value;
