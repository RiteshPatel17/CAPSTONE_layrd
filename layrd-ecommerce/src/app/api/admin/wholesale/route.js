import { NextResponse } from "next/server";
import { verifyAdminRequest } from "../../../../lib/admin-server-auth.js";
import { getApplications, updateApplication } from "../../../../lib/wholesale-applications.js";
import { notifyAsync } from "../../../../lib/notify.js";

export async function GET(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const applications = await getApplications({ search, status });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[Admin Wholesale] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing application id" }, { status: 400 });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    const updated = await updateApplication(id, updates);

    if (status !== undefined) {
      const approvedLike = ["Qualified", "Approved", "Contacted"];
      const declinedLike = ["Not a Fit", "Rejected"];
      let emailEndpoint = null;
      if (approvedLike.includes(status)) emailEndpoint = "wholesale-approved";
      else if (declinedLike.includes(status)) emailEndpoint = "wholesale-declined";

      if (emailEndpoint && updated.email) {
        notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/${emailEndpoint}`, {
          to: updated.email,
          businessName: updated.businessName,
          contactName: updated.contactName,
        }, { label: "Admin Wholesale" });
      }
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("[Admin Wholesale] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}