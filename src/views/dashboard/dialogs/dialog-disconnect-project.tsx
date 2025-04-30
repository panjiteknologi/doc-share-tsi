"use client";

import { useState } from "react";
import { Loader2, RefreshCwOff, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { disconnectUserFromProject } from "@/action/user-project";
import { useAuditor, useAuditors } from "@/hooks/use-auditors";

interface DialogDisconnectProjectProps {
  auditorId: string;
  auditorName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DialogDisconnectProject({
  auditorId,
  auditorName,
  isOpen,
  onClose,
  onSuccess,
}: DialogDisconnectProjectProps) {
  const [projectId, setProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { auditor, isLoading: isLoadingAuditor } = useAuditor(auditorId);
  const { mutate } = useAuditors({});

  const auditorProjects = auditor?.projects || [];

  const handleDisconnect = async () => {
    if (!projectId || !auditorId) return;

    setIsLoading(true);

    try {
      const result = await disconnectUserFromProject({
        id: auditorId,
        projectId: projectId,
      });

      if (result.success) {
        toast.success("Auditor disconnected from project successfully");
        mutate();

        if (onSuccess) onSuccess();
        handleClose();
      } else {
        toast.error(
          result.error || "Failed to disconnect auditor from project"
        );
      }
    } catch (error) {
      console.error("Error disconnecting auditor from project:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProjectId("");
    onClose();
  };

  // Find the selected project details
  const selectedProject = auditorProjects.find((p) => p.id === projectId);
  const selectedFolderName = selectedProject?.folder?.name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <RefreshCwOff className="h-5 w-5 text-destructive" />
            <DialogTitle>Disconnect from Project</DialogTitle>
          </div>
          <DialogDescription>
            Disconnect {auditorName || "this auditor"} from a project they're
            currently assigned to.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {auditorProjects.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This auditor is not assigned to any projects.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="project">Select Project to Disconnect</Label>
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                  disabled={isLoading || isLoadingAuditor}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAuditor ? (
                      <SelectItem value="loading" disabled>
                        Loading projects...
                      </SelectItem>
                    ) : auditorProjects.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No projects assigned
                      </SelectItem>
                    ) : (
                      auditorProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.folder?.name || "Unnamed Project"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedFolderName && (
                <Alert
                  variant="default"
                  className="bg-destructive/10 border-destructive/20"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will remove access to "{selectedFolderName}" for this
                    auditor. They will no longer be able to view or interact
                    with documents in this project.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={isLoading || !projectId || auditorProjects.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
