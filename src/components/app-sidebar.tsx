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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = session?.user?.roleCode || "";

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
      navItems.documents.push({
        name: "Upload",
        url: "/upload",
        icon: IconCloudUpload,
      });
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
