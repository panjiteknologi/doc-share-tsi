import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "TSI Audit Document Share | Secure Document Management",
  description:
    "Log in to TSI Audit Document Share - A secure platform for managing, sharing, and collaborating on audit documentation between clients, auditors, and surveyors.",
  keywords:
    "audit document management, document sharing, secure audit platform, TSI",
};

export default async function Home() {
  const session = await auth();

  if (session && session.user.roleCode === "surveyor") {
    redirect("/dashboard");
  }

  if (session && session.user.roleCode === "client") {
    redirect("/drive");
  }

  if (session && session.user.roleCode === "auditor") {
    redirect("/drive");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
