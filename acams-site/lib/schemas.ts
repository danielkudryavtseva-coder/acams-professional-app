import { Role, Source, Status } from "@prisma/client";
import { z } from "zod";
import { getAllowedSignupDomain, SIGNUP_BLOCKED_MESSAGE } from "./domain";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

export const signupFormSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    name: z.string().min(1, "Full name is required."),
  })
  .superRefine((val, ctx) => {
    const domain = getAllowedSignupDomain();
    const at = val.email.lastIndexOf("@");
    const d = at >= 0 ? val.email.slice(at + 1).trim().toLowerCase() : "";
    if (d !== domain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: SIGNUP_BLOCKED_MESSAGE,
      });
    }
  });

export const signInFormSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export const inviteUserFormSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum([Role.MEMBER, Role.ALUMNUS, Role.GUEST]),
  note: z.string().optional(),
});

export const acceptInviteFormSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;

export { Role, Status, Source };
