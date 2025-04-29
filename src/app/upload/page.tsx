// src/app/upload/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LayoutDashboard from "@/layout/LayoutDashboard";
import {
  Upload,
  UploadCloud,
  Construction,
  RocketIcon,
  BarChart2,
  Database,
  ShieldCheck,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Upload Documents | TSI Audit Document Share",
  description:
    "Securely upload audit documents with our intuitive interface. Supports various file formats with automatic categorization and metadata extraction.",
  keywords:
    "document upload, file upload, audit documentation, secure upload, TSI",
};

export default async function UploadPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const supportedFileTypes = [
    { name: "PDF Documents", extensions: ".pdf", icon: "📄" },
    { name: "Word Documents", extensions: ".doc, .docx", icon: "📝" },
    { name: "Excel Spreadsheets", extensions: ".xls, .xlsx", icon: "📊" },
    { name: "Images", extensions: ".jpg, .png, .gif", icon: "🖼️" },
  ];

  const features = [
    {
      title: "Secure File Upload",
      description:
        "Files are encrypted and stored with enterprise-grade security",
      icon: ShieldCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Batch Processing",
      description: "Upload multiple files at once with categorization",
      icon: Layers,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Automatic Indexing",
      description: "Smart document metadata extraction and categorization",
      icon: Database,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Analytics & Tracking",
      description: "Track document usage, downloads, and access patterns",
      icon: BarChart2,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900",
    },
  ];

  return (
    <LayoutDashboard>
      <div className="px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Document Upload
            </h1>
            <p className="text-muted-foreground mt-2">
              Securely upload audit documents for review and storage
            </p>
          </div>

          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950 px-4 py-2 rounded-lg">
            <Construction className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Under Development
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Interface
              </CardTitle>
              <CardDescription>
                This feature is currently under development and will be
                available soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg border border-dashed border-muted-foreground/25 p-10 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Our enhanced document upload interface will allow you to
                  securely upload, categorize, and process audit documents with
                  ease.
                </p>
                <Button disabled>Upload Documents</Button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">
                  Supported File Types
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {supportedFileTypes.map((type) => (
                    <div
                      key={type.name}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{type.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.extensions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Maximum file size: 10MB
              </p>
              <Badge variant="outline">Beta</Badge>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RocketIcon className="h-5 w-5 text-primary" />
                  Upcoming Features
                </CardTitle>
                <CardDescription>
                  Here's what you can look forward to when our upload system
                  launches:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className={`p-2 rounded-md ${feature.bgColor}`}>
                        <feature.icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Get Notified</CardTitle>
                <CardDescription>
                  Be the first to know when the upload feature launches.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      type="email"
                      disabled
                    />
                  </div>
                  <Button disabled className="w-full">
                    Notify Me
                  </Button>
                </form>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-muted border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <img
                src="/images/tsi-logo.png"
                alt="TSI Logo"
                className="h-16 w-auto"
              />
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  TSI Document Upload System
                </h2>
                <p className="text-sm text-muted-foreground">
                  Our upcoming document upload system will streamline the audit
                  process by providing a secure, efficient, and compliant way to
                  manage all your documentation needs. Check back soon for
                  updates on our progress.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutDashboard>
  );
}
