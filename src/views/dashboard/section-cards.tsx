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

export function SectionCards() {
  const { openDialog } = useDashboardDialog();

  const sections: {
    id: DialogType;
    title: string;
    description: string;
    icon: React.ElementType;
    buttonText: string;
  }[] = [
    {
      id: "auditor",
      title: "Add Auditor",
      description:
        "Register new auditors who will review and verify documents in the system.",
      icon: IconUserPlus,
      buttonText: "Add New Auditor",
    },
    {
      id: "client",
      title: "Add Client",
      description:
        "Register new clients who will submit documents for audit review and verification.",
      icon: IconBuildingStore,
      buttonText: "Add New Client",
    },
    {
      id: "folder",
      title: "Add Folder",
      description:
        "Create new folders to organize documents by project, client, or audit category.",
      icon: IconFolderPlus,
      buttonText: "Create Folder",
    },
    {
      id: "document",
      title: "Add Document",
      description:
        "Upload new documents to be shared, reviewed, and audited in the system.",
      icon: IconFileUpload,
      buttonText: "Upload Document",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {sections.map((section) => (
        <Card key={section.id} className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <section.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{section.title}</CardTitle>
            </div>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow"></CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => openDialog(section.id)}>
              {section.buttonText}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
