import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, FileLock2, Users2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "TSI Audit Document Share | Secure Document Management",
  description:
    "Log in to TSI Audit Document Share - A secure platform for managing, sharing, and collaborating on audit documentation between clients, auditors, and surveyors.",
  keywords:
    "audit document management, document sharing, secure audit platform, TSI",
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Role-based access keeps every audit document protected.",
  },
  {
    icon: FileLock2,
    title: "Organized folders",
    description: "Structure documents by client, project, and audit cycle.",
  },
  {
    icon: Users2,
    title: "Built for collaboration",
    description: "Surveyors, clients, and auditors work from one source of truth.",
  },
];

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
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#060f24] via-[#0a1f44] to-blue-800">
      {/* Shared background texture across the whole page */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_90%_90%_at_50%_0%,black_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-blue-400/20 blur-3xl [animation-duration:6s]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-3xl" />

      {/* Centered two-column content, capped so it doesn't stretch edge-to-edge on wide screens */}
      <div className="relative z-10 grid w-full max-w-5xl lg:grid-cols-2 lg:items-stretch lg:gap-8">
      {/* Hero content - hidden on small screens */}
      <div className="relative z-10 hidden lg:flex lg:flex-col lg:px-6 lg:py-12">
        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 mb-5 text-xs font-medium text-blue-100 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            Trusted Audit Platform
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="max-w-md">
            <h1 className="bg-gradient-to-br from-white to-blue-200 bg-clip-text text-3xl font-bold leading-tight text-transparent xl:text-4xl">
              TSI Audit Document Share
            </h1>
            <p className="mt-4 text-base text-blue-100/80">
              A secure platform for managing, sharing, and collaborating on
              audit documentation between clients, auditors, and surveyors.
            </p>

            <div className="mt-10 space-y-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-transparent">
                    <item.icon className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-blue-100/70">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-blue-100/40 pt-5">
          &copy; {new Date().getFullYear()} TSI. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative z-10 flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:px-6">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
      </div>
    </div>
  );
}
