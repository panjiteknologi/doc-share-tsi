"use client";

import { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { connectUserWithProject } from "@/action/user-project";
import { useClients } from "@/hooks/use-clients";
import { useFolders } from "@/hooks/use-folders";
import { useAuditor, useAuditors } from "@/hooks/use-auditors";

interface DialogConnectProjectProps {
  auditorId: string;
  auditorName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DialogConnectProject({
  auditorId,
  auditorName,
  isOpen,
  onClose,
  onSuccess,
}: DialogConnectProjectProps) {
  const [clientId, setClientId] = useState<string>("");
  const [folderId, setFolderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { auditor } = useAuditor(auditorId);
  const { mutate } = useAuditors({ page: 1, limit: 100 });
  const projectFolderIds =
    auditor?.projects?.map((project) => project.folderId) || [];

  const { clients } = useClients({ page: 1, limit: 100 });

  const { folders } = useFolders({
    userId: clientId || undefined,
    limit: 100,
  });

  const availableFolders = folders.filter(
    (folder) => !folder.isRoot && !projectFolderIds.includes(folder.id)
  );

  const getProject = (folderId: string) => {
    return folders.find((folder) => folder.id === folderId);
  };

  const handleConnect = async () => {
    if (!folderId || !auditorId) return;

    setIsLoading(true);

    try {
      const project = getProject(folderId);

      if (!project?.id) {
        toast.error("Project not found for the selected folder");
        setIsLoading(false);
        return;
      }

      const result = await connectUserWithProject({
        id: auditorId,
        projectId: project.id,
      });

      if (result.success) {
        toast.success("Auditor connected to project successfully");
        mutate();

        if (onSuccess) onSuccess();
        handleClose();
      } else {
        toast.error(result.error || "Failed to connect auditor to project");
      }
    } catch (error) {
      console.error("Error connecting auditor to project:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClientId("");
    setFolderId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Auditor to Project</DialogTitle>
          <DialogDescription>
            Connect {auditorName || "this auditor"} to a client's project
            folder.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Select Client</Label>
            <Select
              value={clientId}
              onValueChange={setClientId}
              disabled={isLoading}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.length ? (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    No clients available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="folder">Select Project Folder</Label>
            <Select
              value={folderId}
              onValueChange={setFolderId}
              disabled={isLoading || !clientId}
            >
              <SelectTrigger id="folder">
                <SelectValue placeholder="Select a project folder" />
              </SelectTrigger>
              <SelectContent>
                {!clientId ? (
                  <SelectItem value="select-client" disabled>
                    Select a client first
                  </SelectItem>
                ) : availableFolders.length === 0 ? (
                  <SelectItem value="no-folders" disabled>
                    No available project folders
                  </SelectItem>
                ) : (
                  availableFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleConnect}
            disabled={isLoading || !clientId || !folderId}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
