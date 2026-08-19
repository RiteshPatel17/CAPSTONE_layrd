"use client";
// LÄYRD – Admin FAQ (/admin/faq)
// TODO: Build FAQ CRUD. Add/edit/delete FAQ items that appear on the public /faq page.
// Data currently lives in src/data/faqs.js — connect to Supabase to make this editable.
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminFAQPage() {
  return (
    <AdminLayout>
      <AdminPageHeader title="FAQ" subtitle="Manage frequently asked questions" />
      <EmptyState
        icon="❓"
        title="FAQ editor coming soon"
        message="Add, edit, and reorder FAQ items that appear on the public FAQ page. Currently using static data in src/data/faqs.js."
      />
    </AdminLayout>
  );
}
