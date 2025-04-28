"use client";

import { SectionCards } from "@/views/dashboard/section-cards";
import { DialogAddClient } from "./dialog-add-client";
import { DialogAddAuditor } from "./dialog-add-auditor";
import { DialogAddFolder } from "./dialog-add-folder";
import { DialogAddDocument } from "./dialog-add-document";
import { DashboardTabs } from "./dashboard-tabs";

const DashboardView = () => {
  return (
    <div className="px-6 gap-6">
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
