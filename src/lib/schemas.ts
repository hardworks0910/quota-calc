import { z } from "zod";

export const industries = [
  { id: "fnb", label: "F&B", icon: "UtensilsCrossed" },
  { id: "manufacturing", label: "Manufacturing", icon: "Factory" },
  { id: "construction", label: "Construction", icon: "HardHat" },
  { id: "agriculture", label: "Agriculture", icon: "Wheat" },
  { id: "cleaning", label: "Cleaning Services", icon: "SprayCan" },
] as const;

export type IndustryId = (typeof industries)[number]["id"];

export const fnbSchema = z.object({
  localStaffCount: z
    .number({ error: "Required" })
    .int()
    .min(1, "Minimum 1 staff"),
});

export const manufacturingSchema = z.object({
  factoryScale: z.enum(["sme", "mnc"], {
    error: "Please select factory scale",
  }),
  exportPercentage: z
    .number({ error: "Required" })
    .min(0, "Min 0%")
    .max(100, "Max 100%"),
});

export const constructionSchema = z.object({
  projectValue: z
    .number({ error: "Required" })
    .min(1, "Must be greater than 0"),
  cidbRegistered: z.boolean().default(false),
});

export const agricultureSchema = z.object({
  landSize: z
    .number({ error: "Required" })
    .min(1, "Minimum 1 acre"),
});

export const cleaningSchema = z.object({
  contractValue: z
    .number({ error: "Required" })
    .min(1, "Must be greater than 0"),
});

export const leadSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters"),
  contactPerson: z
    .string()
    .min(2, "Contact person must be at least 2 characters"),
  whatsapp: z
    .string()
    .regex(/^(\+?6?01)[0-9]{8,9}$/, "Enter a valid Malaysian phone number"),
});

export type FnbData = z.infer<typeof fnbSchema>;
export type ManufacturingData = z.infer<typeof manufacturingSchema>;
export type ConstructionData = z.infer<typeof constructionSchema>;
export type AgricultureData = z.infer<typeof agricultureSchema>;
export type CleaningData = z.infer<typeof cleaningSchema>;
export type LeadData = z.infer<typeof leadSchema>;
