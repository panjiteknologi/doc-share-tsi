import { auth } from "@/lib/auth";
import { SectionCards } from "@/components/section-cards";
import { redirect } from "next/navigation";

import LayoutDashboard from "@/layout/LayoutDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <LayoutDashboard>
      <SectionCards />
    </LayoutDashboard>
  );
}
