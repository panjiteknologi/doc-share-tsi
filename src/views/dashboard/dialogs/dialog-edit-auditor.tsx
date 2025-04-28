import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Auditor } from "@/hooks/use-auditors";
import { toast } from "sonner";
import { updateAuditor } from "@/action/auditor";

interface DialogEditAuditorProps {
  isOpen: boolean;
  onClose: () => void;
  auditor: Auditor | null;
  onSuccess?: () => void;
}

export default function DialogEditAuditor({
  isOpen,
  onClose,
  auditor,
  onSuccess,
}: DialogEditAuditorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auditor) return;

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateAuditor(formData);

      if (result.success) {
        toast.success("Auditor updated successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to update auditor");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error updating auditor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Auditor</DialogTitle>
          <DialogDescription>
            Update the auditor's information below.
          </DialogDescription>
        </DialogHeader>

        {auditor && (
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={auditor.id} />

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Auditor Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={auditor.name}
                  placeholder="Enter auditor name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={auditor.email}
                  placeholder="Enter auditor email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Auditor"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
