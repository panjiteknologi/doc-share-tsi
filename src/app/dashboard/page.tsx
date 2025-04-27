import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import LayoutDashboard from "@/layout/LayoutDashboard";
import DashboardView from "@/views/dashboard";

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
