"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CalendarIcon, FolderPlus, Loader2 } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { createFolder } from "@/action/folder";
import { useState } from "react";

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
    isSustain: z.boolean(),
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

interface DialogCreateSubfolderProps {
  isOpen: boolean;
  onClose: () => void;
  parentFolderId: string;
  /** userId (client) that owns the parent folder — subfolders inherit it. */
  parentUserId: string;
  onSuccess?: () => void;
}

export default function DialogCreateSubfolder({
  isOpen,
  onClose,
  parentFolderId,
  parentUserId,
  onSuccess,
}: DialogCreateSubfolderProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      startDate: today,
      endDate: thirtyDaysLater,
      isSustain: false,
    },
  });

  const isSustain = watch("isSustain");

  const onSubmit = async (data: FormData) => {
    if (!userId) {
      toast.error("Authentication required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createFolder({
        name: data.name,
        userId: parentUserId,
        createdById: userId,
        isRoot: false,
        isSustain: data.isSustain,
        parentId: parentFolderId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });

      if (result.success) {
        toast.success("Subfolder created successfully");
        reset();
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to create subfolder");
      }
    } catch (error) {
      console.error("Error creating subfolder:", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <FolderPlus className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>New Subfolder</DialogTitle>
            </div>
            <DialogDescription>
              Create a subfolder inside this folder to further organize
              documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subfolder-name">
                Folder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subfolder-name"
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

            <div className="flex items-start gap-2">
              <Checkbox
                id="subfolder-isSustain"
                checked={isSustain}
                onCheckedChange={(checked) =>
                  setValue("isSustain", checked === true)
                }
                disabled={isLoading}
              />
              <div className="grid gap-1 leading-none">
                <Label
                  htmlFor="subfolder-isSustain"
                  className="cursor-pointer"
                >
                  Sustain Folder
                </Label>
                <p className="text-sm text-muted-foreground">
                  Files in this folder will be auto-deleted after 180 days.
                  Regular folders auto-delete after 60 days.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 grid gap-2">
                <Label htmlFor="subfolder-startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="subfolder-startDate"
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
                <Label htmlFor="subfolder-endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="subfolder-endDate"
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
                  Creating...
                </>
              ) : (
                "Create Subfolder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
