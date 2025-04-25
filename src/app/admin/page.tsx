import { RegisterAdminForm } from "@/components/register-admin-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
