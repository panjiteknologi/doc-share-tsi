"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { IconFolderPlus } from "@tabler/icons-react";

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
import { Folder } from "@/hooks/use-folders";
import { updateFolder } from "@/action/folder";

// Form validation schema
const formSchema = z
  .object({
    id: z.string(),
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

type FormData = z.infer<typeof formSchema>;

interface DialogEditFolderProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  onSuccess?: () => void;
}

export default function DialogEditFolder({
  isOpen,
  onClose,
  folder,
  onSuccess,
}: DialogEditFolderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: folder
      ? {
          id: folder.id,
          name: folder.name,
          startDate: new Date(folder.startDate).toISOString().split("T")[0],
          endDate: new Date(folder.endDate).toISOString().split("T")[0],
        }
      : undefined,
  });

  // Reset form when folder changes
  useEffect(() => {
    if (folder) {
      reset({
        id: folder.id,
        name: folder.name,
        startDate: new Date(folder.startDate).toISOString().split("T")[0],
        endDate: new Date(folder.endDate).toISOString().split("T")[0],
      });
    }
  }, [folder, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("name", data.name);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate);

      const result = await updateFolder(formData);

      if (result.success) {
        toast.success("Folder updated successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to update folder");
      }
    } catch (error) {
      console.error("Error updating folder:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  if (!folder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <IconFolderPlus className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Edit Folder</DialogTitle>
            </div>
            <DialogDescription>
              Update folder information. Fill in the fields below.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" {...register("id")} />

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
                disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
