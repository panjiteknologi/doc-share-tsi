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

  const features = [
    {
      title: "Folder Structure",
      description: "Organize audit documents in hierarchical folders",
      status: "in-progress",
      progress: 70,
      icon: FolderGit2,
    },
    {
      title: "Document Preview",
      description: "Preview documents directly in the browser",
      status: "in-progress",
      progress: 60,
      icon: FileSearch,
    },
    {
      title: "Access Control",
      description: "Fine-grained permissions for documents and folders",
      status: "planned",
      progress: 30,
      icon: Shield,
    },
    {
      title: "Sharing & Collaboration",
      description: "Share documents with clients and auditors",
      status: "planned",
      progress: 20,
      icon: Users,
    },
  ];

  return (
    <LayoutDashboard>
      <div className="px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Document Drive
            </h1>
            <p className="text-muted-foreground mt-2">
              Access and manage your audit documents in one centralized location
            </p>
          </div>

          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950 px-4 py-2 rounded-lg">
            <Construction className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Under Development
            </span>
          </div>
        </div>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Development in Progress
            </CardTitle>
            <CardDescription>
              We're actively building the Document Drive. Here's what you can
              expect:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-2 p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    {feature.status === "completed" ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                        <Check className="h-4 w-4" />
                        Complete
                      </div>
                    ) : feature.status === "in-progress" ? (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium">
                        <Clock className="h-4 w-4" />
                        In Progress
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        <CalendarClock className="h-4 w-4" />
                        Planned
                      </div>
                    )}
                  </div>
                  <Progress value={feature.progress} className="h-2" />
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-lg bg-muted flex flex-col md:flex-row items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    The Document Drive will be available in the next release.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 rounded-lg border bg-card shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Why we're building the Document Drive
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-medium">Centralized Document Management</h3>
              <p className="text-sm text-muted-foreground">
                Store all audit-related documents in one secure location with
                proper organization and versioning.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Streamlined Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Easily share documents with clients and auditors, with proper
                access controls and permissions.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Audit Trail & Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Maintain a complete history of document access, modifications,
                and approvals for compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}
