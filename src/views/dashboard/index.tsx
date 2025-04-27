"use client";

import { SectionCards } from "@/views/dashboard/section-cards";
import { DialogAddClient } from "./dialog-add-client";
import { DialogAddAuditor } from "./dialog-add-auditor";
import { DialogAddFolder } from "./dialog-add-folder";
import { DialogAddDocument } from "./dialog-add-document";

const DashboardView = () => {
  return (
    <div>
      <SectionCards />

      {/* Dialogs */}
      <DialogAddClient />
      <DialogAddAuditor />
      <DialogAddFolder />
      <DialogAddDocument />
    </div>
  );
};

export default DashboardView;
