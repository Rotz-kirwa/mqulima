export class SanitizationService {
  /**
   * Escapes special HTML characters to prevent XSS.
   */
  static escapeHtml(input: string): string {
    if (!input) return "";
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Strips dangerous script tags and null byte characters from input.
   */
  static sanitizeString(input: string): string {
    if (!input) return "";
    return input
      .replace(/\0/g, "") // Remove null bytes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove <script> tags
      .replace(/on\w+\s*=/gi, ""); // Remove inline event handlers like onload=, onclick=
  }

  /**
   * Masks email address for sensitive security log outputs.
   * e.g., "johndoe@gmail.com" -> "j***e@gmail.com"
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "***@***.com";
    const [name, domain] = email.split("@");
    if (name.length <= 2) {
      return `${name[0]}*@${domain}`;
    }
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }

  /**
   * Masks phone numbers for public user profiles.
   * e.g., "+254712345678" -> "+2547****5678"
   */
  static maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 8) return "*******";
    const prefix = phone.slice(0, 5);
    const suffix = phone.slice(-4);
    return `${prefix}****${suffix}`;
  }
}
