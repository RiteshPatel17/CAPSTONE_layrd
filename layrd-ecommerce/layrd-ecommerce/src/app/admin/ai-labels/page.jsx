"use client";
// LÄYRD – Admin AI Labels (/admin/ai-labels)
// TODO: Build AI label generation management. Show generated labels, allow re-generation with tone/flavour settings.
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminAILabelsPage() {
  return (
    <AdminLayout>
      <AdminPageHeader title="AI Labels" subtitle="Manage AI-generated label copy" />
      <EmptyState
        icon="🏷"
        title="AI label management coming soon"
        message="This page will let you generate, preview, and save AI-written label copy for each product using the Gemini integration."
      />
    </AdminLayout>
  );
}
