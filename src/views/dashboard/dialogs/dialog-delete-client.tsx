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

interface DialogDeleteClientProps {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  selectedClientId: string | null;
  deleteFormRef: React.RefObject<HTMLFormElement | null>;
  handleDeleteClient: (event: React.FormEvent<HTMLFormElement>) => void;
}

const DialogDeleteClient = ({
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  selectedClientId,
  deleteFormRef,
  handleDeleteClient,
}: DialogDeleteClientProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    try {
      await handleDeleteClient(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this client? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <form ref={deleteFormRef} onSubmit={onSubmit}>
          <input type="hidden" name="id" value={selectedClientId || ""} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
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
                "Delete Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DialogDeleteClient;
