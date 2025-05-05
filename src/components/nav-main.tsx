"use client";

import Link from "next/link";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { Badge } from "./ui/badge";
import { Building, ShieldCheck, User } from "lucide-react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
}) {
  const { data: session } = useSession();
  const userRole = session?.user?.roleCode || "";
  // Get role badge color and icon
  const getRoleBadge = () => {
    switch (userRole) {
      case "surveyor":
        return {
          color: "bg-indigo-500 text-white dark:bg-indigo-600",
          label: "Lembaga Sertifikasi",
          icon: <User className="h-3 w-3 mr-1" />,
        };
      case "auditor":
        return {
          color: "bg-teal-500 text-white dark:bg-teal-600",
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
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
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
        <SidebarMenu>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
