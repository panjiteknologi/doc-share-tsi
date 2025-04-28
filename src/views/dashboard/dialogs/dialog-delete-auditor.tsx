import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteAuditor } from "@/action/auditor";
import { AlertTriangle } from "lucide-react";

interface DialogDeleteAuditorProps {
  isOpen: boolean;
  onClose: () => void;
  auditorId: string | null;
  auditorName?: string;
  onSuccess?: () => void;
}

export default function DialogDeleteAuditor({
  isOpen,
  onClose,
  auditorId,
  auditorName,
  onSuccess,
}: DialogDeleteAuditorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auditorId) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", auditorId);

      const result = await deleteAuditor(formData);

      if (result.success) {
        toast.success("Auditor deleted successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete auditor");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting auditor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Auditor</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete{" "}
            {auditorName ? `"${auditorName}"` : "this auditor"}? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete}>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Auditor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
