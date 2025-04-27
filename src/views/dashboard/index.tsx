"use client";

import { SectionCards } from "@/views/dashboard/section-cards";
import { DialogAddClient } from "./dialog-add-client";
import { DialogAddAuditor } from "./dialog-add-auditor";

const DashboardView = () => {
  return (
    <div>
      <SectionCards />

      {/* Dialogs */}
      <DialogAddClient />
      <DialogAddAuditor />
    </div>
  );
};

export default DashboardView;
