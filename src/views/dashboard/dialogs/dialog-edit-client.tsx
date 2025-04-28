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
import { Client } from "@/hooks/use-clients";

interface DialogEditClientProps {
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedClient: Client | null | undefined;
  editFormRef: React.RefObject<HTMLFormElement | null>;
  handleEditClient: (event: React.FormEvent<HTMLFormElement>) => void;
}

const DialogEditClient = ({
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedClient,
  editFormRef,
  handleEditClient,
}: DialogEditClientProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    try {
      await handleEditClient(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>Update client information.</DialogDescription>
        </DialogHeader>
        {selectedClient && (
          <form ref={editFormRef} onSubmit={onSubmit}>
            <input type="hidden" name="id" value={selectedClient.id} />
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Client Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Enter client name"
                  defaultValue={selectedClient.name}
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
                  placeholder="Enter client email"
                  defaultValue={selectedClient.email}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
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
                  "Update Client"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DialogEditClient;
