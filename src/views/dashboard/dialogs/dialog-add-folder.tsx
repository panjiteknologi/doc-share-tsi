"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";

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
import { createFolder } from "@/action/folder";
import { useDashboardDialog } from "@/store/store-dashboard-dialog";
import { IconFolderPlus } from "@tabler/icons-react";
import { useFolders } from "@/hooks/use-folders";

// Form validation schema
const FormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Folder name is required")
      .max(100, "Folder name must be less than 100 characters")
      .refine((val) => /^[a-zA-Z0-9\s\-_]+$/.test(val), {
        message:
          "Folder name can only contain letters, numbers, spaces, hyphens, and underscores",
      }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date format",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date format",
    }),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type FormData = z.infer<typeof FormSchema>;

interface AddFolderDialogProps {
  onSuccess?: () => void;
}

export function DialogAddFolder({ onSuccess }: AddFolderDialogProps) {
  const { data: session } = useSession();
  const { isOpen, dialogType, closeDialog, isLoading, setLoading } =
    useDashboardDialog();
  const isDialogOpen = isOpen && dialogType === "folder";

  const { mutate } = useFolders({ page: 1, limit: 10 });

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      startDate: today,
      endDate: thirtyDaysLater,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    setLoading(true);

    try {
      const result = await createFolder({
        name: data.name,
        userId: session.user.id,
        isRoot: false,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });

      if (result.success) {
        toast.success("Folder created successfully");
        reset();
        mutate();
        closeDialog();
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      closeDialog();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <IconFolderPlus className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Add New Folder</DialogTitle>
            </div>
            <DialogDescription>
              Create a new folder to organize your documents. Fill in the fields
              below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Folder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter folder name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 grid gap-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    className="pl-10"
                    aria-invalid={!!errors.startDate}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="col-span-6 grid gap-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    {...register("endDate")}
                    className="pl-10"
                    aria-invalid={!!errors.endDate}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
