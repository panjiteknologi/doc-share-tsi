"use client";

import { SectionCards } from "@/views/dashboard/section-cards";
import { DialogAddClient } from "./dialog-add-client";
import { DialogAddAuditor } from "./dialog-add-auditor";
import { DialogAddFolder } from "./dialog-add-folder";

const DashboardView = () => {
  return (
    <div>
      <SectionCards />

      {/* Dialogs */}
      <DialogAddClient />
      <DialogAddAuditor />
      <DialogAddFolder />
    </div>
  );
};

export default DashboardView;
