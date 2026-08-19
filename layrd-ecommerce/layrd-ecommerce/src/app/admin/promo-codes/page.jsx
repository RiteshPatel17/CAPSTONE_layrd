"use client";
// LÄYRD – Admin Promo Codes (/admin/promo-codes)
// TODO: Build promo code CRUD. Fields: code, discount type (% or $), value, expiry, max uses, active.
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminPromoCodesPage() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Promo Codes" subtitle="Create and manage discount codes" />
      <EmptyState
        icon="🎟"
        title="Promo codes coming soon"
        message="Create percentage or dollar-amount discount codes with optional expiry dates and usage limits. Connect to Supabase to activate."
      />
    </AdminLayout>
  );
}
