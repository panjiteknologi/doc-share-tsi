"use client";

import { SectionCards } from "@/views/dashboard/section-cards";
import { DialogAddClient } from "./dialogs/dialog-add-client";
import { DialogAddAuditor } from "./dialogs/dialog-add-auditor";
import { DialogAddFolder } from "./dialogs/dialog-add-folder";
import { DialogAddDocument } from "./dialogs/dialog-add-document";
import { DashboardTabs } from "./dashboard-tabs";
import { useSession } from "next-auth/react";

const DashboardView = () => {
  const { data: session } = useSession();

  return (
    <div className="px-6 gap-6">
      <div className="flex flex-col mb-10">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          Here's an overview of your audit document management system.
        </p>
      </div>

      <SectionCards />
      <DashboardTabs />

      {/* Dialogs */}
      <DialogAddClient />
      <DialogAddAuditor />
      <DialogAddFolder />
      <DialogAddDocument />
    </div>
  );
};

export default DashboardView;
