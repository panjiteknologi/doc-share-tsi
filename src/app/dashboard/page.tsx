import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

import LayoutDashboard from "@/layout/LayoutDashboard";
import DashboardView from "@/views/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | TSI Audit Document Share",
  description:
    "Access your TSI Audit Document Share dashboard for comprehensive document management. Monitor folders, documents, clients, and auditors all in one central location.",
  keywords:
    "audit dashboard, document management, TSI dashboard, audit documentation",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <LayoutDashboard>
      <DashboardView />
    </LayoutDashboard>
  );
}
