"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDashboardDialog } from "@/store/store-dashboard-dialog";
import { addClient, UserFormData } from "@/action/user";
import { toast } from "sonner";
import { IconBuildingStore } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useClients } from "@/hooks/use-clients";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          "Password must include uppercase, lowercase, number, and special character.",
      }
    ),
});

export function DialogAddClient() {
  const { isOpen, dialogType, closeDialog, isLoading, setLoading } =
    useDashboardDialog();
  const isDialogOpen = isOpen && dialogType === "client";

  const { mutate } = useClients({ page: 1, limit: 10 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);

    try {
      const result = await addClient(data);

      if (result.success) {
        toast.success("Client added successfully", {
          description: `${data.name} has been registered as a client.`,
          duration: 4000,
        });
        reset();
        mutate();
        closeDialog();
      } else {
        toast.error("Failed to add client", {
          description:
            result.error || "An error occurred while adding the client.",
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
        duration: 4000,
      });
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
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-md">
              <IconBuildingStore className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Add New Client</DialogTitle>
          </div>
          <DialogDescription>
            Enter client details to create a new client account in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Client Name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="client@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must include uppercase, lowercase, number, and special
                character.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
