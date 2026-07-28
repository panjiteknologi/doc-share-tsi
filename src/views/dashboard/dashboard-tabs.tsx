import { ShieldCheck, Building2, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TableClients } from "./tables/table-clients";
import { TableAuditors } from "./tables/table-auditors";
import { TableFolders } from "./tables/table-folders";
import { TableDocuments } from "./tables/table-documents";

const tabTriggerClassName = cn(
  "cursor-pointer gap-1.5 rounded-lg px-4",
  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
  "dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent"
);

export function DashboardTabs() {
  return (
    <Tabs
      defaultValue="auditors"
      className="flex w-full flex-col justify-start mt-10"
    >
      <TabsList className="h-11 w-fit gap-1 rounded-xl bg-muted/70 p-1">
        <TabsTrigger value="auditors" className={tabTriggerClassName}>
          <ShieldCheck className="h-4 w-4" />
          Auditors
        </TabsTrigger>
        <TabsTrigger value="clients" className={tabTriggerClassName}>
          <Building2 className="h-4 w-4" />
          Clients
        </TabsTrigger>
        <TabsTrigger value="folders" className={tabTriggerClassName}>
          <FolderOpen className="h-4 w-4" />
          Folders
        </TabsTrigger>
        {/* <TabsTrigger value="documents">Documents</TabsTrigger> */}
      </TabsList>
      <TabsContent value="auditors" className="mt-4">
        <TableAuditors />
      </TabsContent>
      <TabsContent value="clients" className="mt-4">
        <TableClients />
      </TabsContent>
      <TabsContent value="folders" className="mt-4">
        <TableFolders />
      </TabsContent>
      {/* <TabsContent value="documents">
        <TableDocuments />
      </TabsContent> */}
    </Tabs>
  );
}
