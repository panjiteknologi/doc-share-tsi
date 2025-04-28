"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableClients } from "./tables/table-clients";
import { TableAuditors } from "./tables/table-auditors";
import { TableFolders } from "./tables/table-folders";
import { TableDocuments } from "./tables/table-documents";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <Tabs
      defaultValue="clients"
      className="flex w-full flex-col justify-start mt-16"
      onValueChange={setActiveTab}
    >
      {/* <Label htmlFor="view-selector" className="sr-only">
        View
      </Label>
      <Select defaultValue="outline">
        <SelectTrigger
          className="@4xl/main:hidden flex w-fit"
          id="view-selector"
        >
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="clients">Clients</SelectItem>
          <SelectItem value="auditors">Auditors</SelectItem>
          <SelectItem value="folders">Folders</SelectItem>
          <SelectItem value="documents">Documents</SelectItem>
        </SelectContent>
      </Select> */}
      <TabsList className="@4xl/main:flex hidden">
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="auditors">Auditors</TabsTrigger>
        <TabsTrigger value="folders">Folders</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="clients" className="mt-4">
        <TableClients />
      </TabsContent>
      <TabsContent value="auditors" className="mt-4">
        <TableAuditors />
      </TabsContent>
      <TabsContent value="folders" className="mt-4">
        <TableFolders />
      </TabsContent>
      <TabsContent value="documents" className="mt-4">
        <TableDocuments />
      </TabsContent>
    </Tabs>
  );
}
