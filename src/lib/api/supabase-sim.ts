export interface ContactSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: string;
  subject: string;
  message: string;
  consent: boolean;
  created_at: string;
}

export interface PartnershipApplication {
  id: string;
  org_name: string;
  contact_name: string;
  role: string;
  email: string;
  phone: string;
  org_type: string;
  tier_interest: string;
  countries: string[];
  goal: string;
  referral_source: string;
  consent: boolean;
  created_at: string;
}

export const supabaseSim = {
  async insertSubmission(data: Omit<ContactSubmission, "id" | "created_at">): Promise<{ success: boolean; data?: ContactSubmission; error?: string }> {
    // Simulate network latency (500ms - 1000ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      const newSubmission: ContactSubmission = {
        ...data,
        id: `sub_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };

      // Retrieve existing from localStorage
      const submissionsRaw = localStorage.getItem("mqulima_contact_submissions");
      const submissions: ContactSubmission[] = submissionsRaw ? JSON.parse(submissionsRaw) : [];

      // Append new
      submissions.push(newSubmission);
      localStorage.setItem("mqulima_contact_submissions", JSON.stringify(submissions));

      // Stylized Console Log for Developer Inspection
      console.log(
        `%c [Supabase SIM] Inserted row into 'contact_submissions' table `,
        "background: #2D6A4F; color: #F0EDE6; font-weight: bold; padding: 4px; border-radius: 4px;"
      );
      console.table(newSubmission);

      return {
        success: true,
        data: newSubmission,
      };
    } catch (err: any) {
      console.error("[Supabase SIM] Error inserting submission:", err);
      return {
        success: false,
        error: err?.message || "Failed to insert row",
      };
    }
  },

  getSubmissions(): ContactSubmission[] {
    const submissionsRaw = localStorage.getItem("mqulima_contact_submissions");
    return submissionsRaw ? JSON.parse(submissionsRaw) : [];
  },

  async insertPartnershipApplication(data: Omit<PartnershipApplication, "id" | "created_at">): Promise<{ success: boolean; data?: PartnershipApplication; error?: string }> {
    // Simulate network latency (500ms - 1000ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      const newApp: PartnershipApplication = {
        ...data,
        id: `part_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };

      // Retrieve existing from localStorage
      const appsRaw = localStorage.getItem("mqulima_partnership_applications");
      const apps: PartnershipApplication[] = appsRaw ? JSON.parse(appsRaw) : [];

      // Append new
      apps.push(newApp);
      localStorage.setItem("mqulima_partnership_applications", JSON.stringify(apps));

      // Stylized Console Log for Developer Inspection
      console.log(
        `%c [Supabase SIM] Inserted row into 'partnership_applications' table `,
        "background: #2D6A4F; color: #F5A623; font-weight: bold; padding: 4px; border-radius: 4px;"
      );
      console.table(newApp);

      return {
        success: true,
        data: newApp,
      };
    } catch (err: any) {
      console.error("[Supabase SIM] Error inserting partnership application:", err);
      return {
        success: false,
        error: err?.message || "Failed to insert row",
      };
    }
  },

  getPartnershipApplications(): PartnershipApplication[] {
    const appsRaw = localStorage.getItem("mqulima_partnership_applications");
    return appsRaw ? JSON.parse(appsRaw) : [];
  }
};
