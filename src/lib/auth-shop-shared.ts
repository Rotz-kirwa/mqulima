import { z } from "zod";

export const SignUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phoneNumber: z.string().optional().or(z.literal("")),
  nationalId: z.string().optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  deliveryLocation: z.string().optional().or(z.literal("")),
  landmark: z.string().optional().or(z.literal("")),
  farmingType: z.string().optional().or(z.literal("")),
  specifyFarmingType: z.string().optional().or(z.literal("")),
  terms: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
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
