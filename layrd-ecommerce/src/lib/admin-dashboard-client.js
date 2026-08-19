import { getAuthHeader } from "./auth";

export async function getAdminDashboard() {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch("/api/admin/dashboard", {
      headers: { ...authHeader },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Failed to fetch admin dashboard:", err);
    return { ok: false, error: err.message };
  }
}