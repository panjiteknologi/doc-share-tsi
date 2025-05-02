// src/app/drive/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LayoutDashboard from "@/layout/LayoutDashboard";
import {
  CalendarClock,
  HardDrive,
  FolderGit2,
  Construction,
  FileSearch,
  Clock,
  Check,
  Users,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Metadata } from "next";
import Link from "next/link";
import DriveView from "@/views/drive";

export const metadata: Metadata = {
  title: "Document Drive | TSI Audit Document Share",
  description:
    "Access and organize all your audit-related documents in a secure, centralized document drive with advanced sorting, filtering, and sharing capabilities.",
  keywords:
    "document drive, file management, audit documents, secure storage, TSI",
};

export default async function DrivePage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <LayoutDashboard>
      <DriveView />
    </LayoutDashboard>
  );
}
