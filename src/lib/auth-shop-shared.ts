import { z } from "zod";

export const SignUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phoneNumber: z.string()
    .regex(/^\+254 \d{3} \d{3} \d{3}$/, "Phone number must be in +254 7XX XXX XXX format"),
  email: z.string().email("Invalid email address"),
  nationalId: z.string().regex(/^\d{7,8}$/, "National ID must be 7 or 8 digits"),
  county: z.string().min(1, "County is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  landmark: z.string().optional(),
  farmingType: z.enum([
    "Crop Farming",
    "Livestock Farming",
    "Mixed Farming",
    "Dairy Farming",
    "Poultry Farming",
    "Horticulture",
    "Aquaculture (Fish Farming)",
    "Apiculture (Bee Keeping)",
    "Greenhouse Farming",
    "Fruit Farming",
    "Coffee Farming",
    "Tea Farming",
    "Sugarcane Farming",
    "Other"
  ], { errorMap: () => ({ message: "Nature of Farming is required" }) }),
  specifyFarmingType: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must accept the terms & conditions")
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
  
  if (data.farmingType === "Other" && (!data.specifyFarmingType || data.specifyFarmingType.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your farming type",
      path: ["specifyFarmingType"],
    });
  }
});

export const SignInSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});
