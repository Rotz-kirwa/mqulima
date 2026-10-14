import { z } from "zod";

export const SignUpSchema = z.object({
  firstName: z.string().min(1, "Name is required"),
  lastName: z.string().optional().default(""),
  phoneNumber: z.string().min(9, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  nationalId: z.string().optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  deliveryLocation: z.string().optional().or(z.literal("")),
  landmark: z.string().optional().or(z.literal("")),
  farmingType: z.string().optional().or(z.literal("")),
  specifyFarmingType: z.string().optional().or(z.literal("")),
  password: z.string().min(4, "PIN / Password must be at least 4 digits"),
  confirmPassword: z.string().optional(),
  terms: z.boolean().optional().default(true)
}).superRefine((data, ctx) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

export const SignInSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});
