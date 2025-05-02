"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableClients } from "./tables/table-clients";
import { TableAuditors } from "./tables/table-auditors";
import { TableFolders } from "./tables/table-folders";
import { TableDocuments } from "./tables/table-documents";

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <Tabs
      defaultValue="clients"
      className="flex w-full flex-col justify-start mt-10"
      onValueChange={setActiveTab}
    >
      <TabsList>
        <TabsTrigger value="auditors">Auditors</TabsTrigger>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="folders">Folders</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="auditors">
        <TableAuditors />
      </TabsContent>
      <TabsContent value="clients">
        <TableClients />
      </TabsContent>
      <TabsContent value="folders">
        <TableFolders />
      </TabsContent>
      <TabsContent value="documents">
        <TableDocuments />
      </TabsContent>
    </Tabs>
  );
}
