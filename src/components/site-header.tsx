"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Sun, Moon, User, ShieldCheck, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const userRole = session?.user?.roleCode || "";

  const getHeaderTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard Audit Document";
      case "/drive":
        return "Document Drive";
      case "/upload":
        return "Upload File Document";
      default:
        return "Documents";
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Get role badge color and icon
  const getRoleBadge = () => {
    switch (userRole) {
      case "surveyor":
        return {
          color: "bg-primary text-primary-foreground",
          label: "Surveyor",
          icon: <User className="h-3 w-3 mr-1" />,
        };
      case "auditor":
        return {
          color: "bg-green-500 text-white dark:bg-green-600",
          label: "Auditor",
          icon: <ShieldCheck className="h-3 w-3 mr-1" />,
        };
      case "client":
        return {
          color: "bg-amber-500 text-white dark:bg-amber-600",
          label: "Client",
          icon: <Building className="h-3 w-3 mr-1" />,
        };
      default:
        return {
          color: "bg-gray-500 text-white",
          label: "Guest",
          icon: <User className="h-3 w-3 mr-1" />,
        };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getHeaderTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">
          {session?.user && (
            <Badge
              className={`${roleBadge.color} flex items-center h-6 px-2 mr-2`}
            >
              {roleBadge.icon}
              {roleBadge.label}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
