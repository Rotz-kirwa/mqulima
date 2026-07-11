import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import crypto from "crypto";

export const generateCsrfToken = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = crypto.randomBytes(32).toString("hex");
    setCookie("mq_csrf", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    return { token };
  });
