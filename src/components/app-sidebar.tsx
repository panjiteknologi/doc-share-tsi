"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  IconLayoutDashboard,
  IconFolderShare,
  IconCloudUpload,
  Icon,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Building, ShieldCheck, User } from "lucide-react";
import { Badge } from "./ui/badge";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = session?.user?.roleCode || "";

  // Get role badge color and icon
  const getRoleBadge = () => {
    switch (userRole) {
      case "surveyor":
        return {
          color: "text-indigo-500 boder border-indigo-500",
          label: "Lembaga Sertifikasi",
          icon: <User className="h-3 w-3 mr-1" />,
        };
      case "auditor":
        return {
          color: "text-teal-500 boder border-teal-500",
          label: "Auditor",
          icon: <ShieldCheck className="h-3 w-3 mr-1" />,
        };
      case "client":
        return {
          color: "text-rose-500 boder border-rose-500",
          label: "Client",
          icon: <Building className="h-3 w-3 mr-1" />,
        };
      default:
        return {
          color: "text-gray-500",
          label: "Guest",
          icon: <User className="h-3 w-3 mr-1" />,
        };
    }
  };

  const roleBadge = getRoleBadge();

  // Define navigation items based on user role
  const getNavItems = () => {
    const navItems: {
      navMain: { title: string; url: string; icon: Icon }[];
      documents: { name: string; url: string; icon: Icon }[];
    } = {
      navMain: [],
      documents: [],
    };

    // Main navigation (Dashboard)
    if (userRole === "surveyor") {
      navItems.navMain.push({
        title: "Dashboard",
        url: "/dashboard",
        icon: IconLayoutDashboard,
      });
      navItems.documents.push({
        name: "Drive",
        url: "/drive",
        icon: IconFolderShare,
      });
    }

    // Only surveyor and client roles have access to Upload
    if (userRole === "client") {
      navItems.documents.push({
        name: "Drive",
        url: "/drive",
        icon: IconFolderShare,
      });
      // navItems.documents.push({
      //   name: "Upload",
      //   url: "/upload",
      //   icon: IconCloudUpload,
      // });
    }

    // Only surveyor and client roles have access to Upload
    if (userRole === "auditor") {
      navItems.documents.push({
        name: "Drive",
        url: "/drive",
        icon: IconFolderShare,
      });
    }

    return navItems;
  };

  const navItems = getNavItems();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="flex items-center gap-2">
                <img
                  src="/images/tsi-logo.png"
                  alt="TSI Logo"
                  className="h-8 w-auto"
                />
                <span className="text-base font-semibold">
                  Audit Document Share
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center mt-4">
            {session?.user && (
              <Badge
                className={`${roleBadge.color} flex items-center h-8 px-2 mr-2 w-full`}
                variant="outline"
              >
                {roleBadge.icon}
                {roleBadge.label}
              </Badge>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navItems.navMain.length > 0 && <NavMain items={navItems.navMain} />}
        {navItems.documents.length > 0 && (
          <NavDocuments items={navItems.documents} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
