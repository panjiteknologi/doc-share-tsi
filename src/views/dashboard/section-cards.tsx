"use client";

import React from "react";
import {
  IconUserPlus,
  IconBuildingStore,
  IconFolderPlus,
  IconFileUpload,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogType, useDashboardDialog } from "@/store/store-dashboard-dialog";
import { cn } from "@/lib/utils";

export function SectionCards() {
  const { openDialog } = useDashboardDialog();

  const sections: {
    id: DialogType;
    title: string;
    description: string;
    icon: React.ElementType;
    buttonText: string;
    iconBg: string;
    button: string;
  }[] = [
    {
      id: "auditor",
      title: "Add Auditor",
      description:
        "Register new auditors who will review and verify documents in the system.",
      icon: IconUserPlus,
      buttonText: "Add New Auditor",
      iconBg: "bg-gradient-to-br from-[#0a1f44] to-blue-600",
      button: "bg-gradient-to-r from-[#0a1f44] to-blue-600 hover:opacity-90",
    },
    {
      id: "client",
      title: "Add Client",
      description:
        "Register new clients who will submit documents for audit review and verification.",
      icon: IconBuildingStore,
      buttonText: "Add New Client",
      iconBg: "bg-gradient-to-br from-emerald-600 to-teal-500",
      button: "bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90",
    },
    {
      id: "folder",
      title: "Add Folder",
      description:
        "Create new folders to organize documents by project, client, or audit category.",
      icon: IconFolderPlus,
      buttonText: "Create Folder",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      button: "bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90",
    },
    // {
    //   id: "document",
    //   title: "Add Document",
    //   description:
    //     "Upload new documents to be shared, reviewed, and audited in the system.",
    //   icon: IconFileUpload,
    //   buttonText: "Upload Document",
    // },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Card
          key={section.id}
          className="group flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105",
                  section.iconBg
                )}
              >
                <section.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </div>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow" />
          <CardFooter>
            <Button
              className={cn("w-full text-white hover:cursor-pointer", section.button)}
              onClick={() => openDialog(section.id)}
            >
              {section.buttonText}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
