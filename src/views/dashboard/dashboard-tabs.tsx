import { ShieldCheck, Building2, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TableClients } from "./tables/table-clients";
import { TableAuditors } from "./tables/table-auditors";
import { TableFolders } from "./tables/table-folders";
import { TableDocuments } from "./tables/table-documents";

const baseTabClassName = cn(
  "gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground",
  "transition-all duration-300 hover:cursor-pointer hover:text-foreground",
  "data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.03]"
);

const auditorsTabClassName = cn(
  baseTabClassName,
  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0a1f44] data-[state=active]:to-blue-600"
);
const clientsTabClassName = cn(
  baseTabClassName,
  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500"
);
const foldersTabClassName = cn(
  baseTabClassName,
  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600"
);

export function DashboardTabs() {
  return (
    <Tabs
      defaultValue="auditors"
      className="flex w-full flex-col justify-start mt-10"
    >
      <TabsList className="h-12 w-fit gap-1.5 rounded-2xl bg-muted/60 p-1.5 shadow-inner">
        <TabsTrigger value="auditors" className={auditorsTabClassName}>
          <ShieldCheck className="h-4 w-4" />
          Auditors
        </TabsTrigger>
        <TabsTrigger value="clients" className={clientsTabClassName}>
          <Building2 className="h-4 w-4" />
          Clients
        </TabsTrigger>
        <TabsTrigger value="folders" className={foldersTabClassName}>
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
