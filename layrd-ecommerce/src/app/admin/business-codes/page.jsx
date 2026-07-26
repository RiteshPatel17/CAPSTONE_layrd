"use client";
// LÄYRD – Admin Business Codes (/admin/business-codes)
// TODO: Build business verification code generator.
// Codes are single-use and expire after 48 hours (BUSINESS_CODE_EXPIRY_HOURS in constants.js).
// They unlock wholesale pricing for verified business accounts.
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminBusinessCodesPage() {
  return (
    <AdminLayout>
      <AdminPageHeader title="Business Codes" subtitle="Generate verification codes for wholesale accounts" />
      <EmptyState
        icon="🔑"
        title="Business code generator coming soon"
        message="Generate single-use business verification codes (expire in 48h) to grant wholesale pricing access to verified business accounts."
      />
    </AdminLayout>
  );
}
