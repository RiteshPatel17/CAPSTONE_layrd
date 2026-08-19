"use client";
// LÄYRD – Admin Wholesale (/admin/wholesale)
// TODO: Build wholesale application review UI. Show pending applications, approve/reject, assign tiers.
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminWholesalePage() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Wholesale" subtitle="Review wholesale applications" />
      <EmptyState
        icon="🏪"
        title="Wholesale applications coming soon"
        message="This page will display wholesale account applications. You'll be able to review business details, approve accounts, and set pricing tiers."
      />
    </AdminLayout>
  );
}
