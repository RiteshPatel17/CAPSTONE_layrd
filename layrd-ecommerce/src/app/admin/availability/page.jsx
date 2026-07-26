"use client";
// LÄYRD – Admin Availability (/admin/availability)
// TODO: Build availability toggle. Adam can open/close the shop and set pickup windows.
// Fields: shop open/closed, pickup days, pickup time windows, delivery days.
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminAvailabilityPage() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Availability" subtitle="Control shop hours and pickup windows" />
      <EmptyState
        icon="📅"
        title="Availability control coming soon"
        message="Toggle the shop open or closed, set which days pickup is available, and control delivery windows. Connect to Supabase to activate."
      />
    </AdminLayout>
  );
}
