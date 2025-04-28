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
        <form ref={deleteFormRef} onSubmit={handleDeleteClient}>
          <input type="hidden" name="id" value={selectedClientId || ""} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Delete Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DialogDeleteClient;
