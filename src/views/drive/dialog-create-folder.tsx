"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { FolderPlus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFolder } from "@/action/folder";
import { useClients } from "@/hooks/use-clients";

// Define base schema for validation (shared between roles)
const baseSchemaFields = {
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
};

// Define schema refinement (shared between schemas)
const dateRefinement = (data: any) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
};

// Define schema for surveyor role with required userId
const surveyorSchema = z
  .object({
    ...baseSchemaFields,
    userId: z.string().min(1, "Client selection is required"),
  })
  .refine(dateRefinement, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

// Define schema for client role with optional userId
const clientSchema = z
  .object({
    ...baseSchemaFields,
    userId: z.string().optional(),
  })
  .refine(dateRefinement, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

// TypeScript types for form data
type SurveyorFormData = z.infer<typeof surveyorSchema>;
type ClientFormData = z.infer<typeof clientSchema>;
type FormData = SurveyorFormData | ClientFormData;

interface DialogCreateFolderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DialogCreateFolder({
  isOpen,
  onClose,
  onSuccess,
}: DialogCreateFolderProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const userRole = session?.user?.roleCode || "";
  const userId = session?.user?.id;

  // For surveyor role, we need to fetch clients to select
  const { clients, isLoading: isLoadingClients } = useClients({
    page: 1,
    limit: 100, // Load more clients to ensure we get all
  });

  // Get current date and 30 days later for default date range
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Select the appropriate schema based on user role
  const schema = userRole === "surveyor" ? surveyorSchema : clientSchema;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      userId: userRole === "client" ? userId || "" : "",
      startDate: today,
      endDate: thirtyDaysLater,
    },
  });

  const selectedClientId = watch("userId");

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    setIsLoading(true);

    try {
      // If user is client, use their own ID
      const finalUserId = userRole === "client" ? userId : data.userId;

      if (!finalUserId) {
        toast.error("User ID is required");
        setIsLoading(false);
        return;
      }

      const result = await createFolder({
        name: data.name,
        userId: finalUserId,
        isRoot: false,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });

      if (result.success) {
        toast.success("Folder created successfully");
        reset();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <FolderPlus className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Create New Folder</DialogTitle>
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
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Client selection - Only visible for surveyor role */}
            {userRole === "surveyor" && (
              <div className="grid gap-2">
                <Label htmlFor="client">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("userId", value, {
                      shouldValidate: true,
                    })
                  }
                  disabled={isLoading || isLoadingClients}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClients ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : clients?.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No clients available
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.userId && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.userId.message}
                  </p>
                )}
              </div>
            )}

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
            <Button
              type="submit"
              disabled={
                isLoading || (userRole === "surveyor" && !selectedClientId)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
