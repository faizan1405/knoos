import { z } from "zod";

export const couponTypes = ["PERCENTAGE", "FIXED"] as const;

const couponCodeSchema = z
  .string()
  .trim()
  .min(1, "Coupon code is required")
  .max(50, "Coupon code must be at most 50 characters")
  .transform((code) => code.toUpperCase())
  .refine(
    (code) => /^[A-Z0-9_-]+$/.test(code),
    "Coupon code may only contain letters, numbers, hyphens, and underscores"
  );

const optionalPositiveInteger = (label: string) =>
  z.number().int(`${label} must be a whole number`).positive(`${label} must be positive`).nullable();

const optionalDate = z.string().datetime({ offset: true }).nullable();

export const couponInputSchema = z
  .object({
    code: couponCodeSchema,
    type: z.enum(couponTypes),
    discountValue: z.number().int("Discount value must be a whole number").positive("Discount value must be greater than 0"),
    minOrderAmount: optionalPositiveInteger("Minimum order amount").optional().default(null),
    maxDiscount: optionalPositiveInteger("Maximum discount").optional().default(null),
    startDate: optionalDate.optional().default(null),
    endDate: optionalDate.optional().default(null),
    usageLimit: optionalPositiveInteger("Usage limit").optional().default(null),
    isActive: z.boolean().optional().default(true),
  })
  .strict()
  .superRefine((coupon, ctx) => {
    if (coupon.type === "PERCENTAGE" && coupon.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percentage discount must be at most 100",
      });
    }

    if (coupon.startDate && coupon.endDate && new Date(coupon.endDate) < new Date(coupon.startDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date cannot be before start date",
      });
    }
  });

export const couponUpdateSchema = z
  .object({
    code: z.string().optional(),
    type: z.enum(couponTypes).optional(),
    discountValue: z.number().optional(),
    minOrderAmount: z.number().nullable().optional(),
    maxDiscount: z.number().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    usageLimit: z.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type CouponInput = z.infer<typeof couponInputSchema>;

export function couponInputToPrisma(input: CouponInput) {
  return {
    code: input.code,
    type: input.type,
    discountValue: input.discountValue,
    minOrderAmount: input.minOrderAmount,
    maxDiscount: input.maxDiscount,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    usageLimit: input.usageLimit,
    isActive: input.isActive,
  };
}

export function couponFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
