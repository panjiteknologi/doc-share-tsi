import { RegisterAdminForm } from "@/components/register-admin-form";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Registration | TSI Audit Document Share",
  description:
    "Create an administrator account for TSI Audit Document Share platform to manage audit processes, users, and documents with advanced administrative controls.",
  keywords:
    "admin registration, create account, document management administrator, TSI admin",
};

export default async function Admin() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterAdminForm />
      </div>
    </div>
  );
}
