/**
 * Client-side integration for Wholesale Applications.
 */
export async function submitWholesaleApplication(payload) {
  try {
    const res = await fetch("/api/business-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        message: data.message || data.error || "We could not submit your application. Please try again.",
      };
    }
    const data = await res.json();
    return {
      ok: true,
      message: data.message || "Your wholesale application has been received. The LÄYRD team will review your information and contact you directly.",
    };
  } catch (error) {
    console.error("Wholesale application error:", error);
    return {
      ok: false,
      message: "We could not submit your application. Please try again.",
    };
  }
}