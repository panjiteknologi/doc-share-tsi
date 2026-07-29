"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  FolderOpen,
  FolderPlus,
  FileText,
  FileUp,
  MoreHorizontal,
  Calendar,
  ChevronRight,
  HardDriveDownload,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { useFolder, SubfolderSummary } from "@/hooks/use-folders";
import { Document as DocumentType } from "@/hooks/use-documents";
import { useDirectUpload } from "@/hooks/use-direct-upload";
import { createFolder } from "@/action/folder";
import DialogEditFolder from "@/views/dashboard/dialogs/dialog-edit-folder";
import DialogDeleteFolder from "@/views/dashboard/dialogs/dialog-delete-folder";
import DialogDeleteDocument from "@/views/dashboard/dialogs/dialog-delete-document";
import DocumentDrawerViewer from "@/components/document-drawer-viewer";
import {
  calculateExpiryDate,
  formatTimeRemaining,
  getExpiryStatusColor,
} from "@/lib/cron";

export type FolderTreeRole = "surveyor" | "client" | "auditor";

// Shared column widths so the tree stays aligned across every depth level
const COL = {
  type: "hidden sm:flex w-[150px] shrink-0 items-center gap-1",
  period: "hidden lg:flex w-[220px] shrink-0 items-center gap-1",
  client: "hidden lg:flex w-[130px] shrink-0",
  createdBy: "hidden xl:flex w-[130px] shrink-0",
  actions: "flex w-[104px] shrink-0 justify-end gap-1",
};

export interface TreeFolder {
  id: string;
  name: string;
  isRoot: boolean;
  isSustain: boolean;
  hasProject: boolean;
  documentCount: number;
  childrenCount: number;
  startDate: string;
  endDate: string;
  ownerName: string;
  createdByName: string;
  createdById: string | null;
  userId: string;
  // The folder this one is nested under, so its cache can be refreshed after
  // an edit/delete; null for top-level (root) folders.
  parentId: string | null;
}

function subfolderToTreeFolder(
  folder: SubfolderSummary,
  parentId: string
): TreeFolder {
  return {
    id: folder.id,
    name: folder.name,
    isRoot: folder.isRoot,
    isSustain: folder.isSustain,
    hasProject: folder.hasProject,
    documentCount: folder.documents.length,
    childrenCount: folder.childrenCount ?? 0,
    startDate: folder.startDate,
    endDate: folder.endDate,
    ownerName: folder.user?.name || "",
    createdByName: folder.createdBy?.name || "-",
    createdById: folder.createdById,
    userId: folder.userId,
    parentId,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDocumentIcon(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />;
    case "word":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />;
    case "excel":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />;
    case "image":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />;
    default:
      return <FileText className="h-3.5 w-3.5 shrink-0 text-gray-600 dark:text-gray-400" />;
  }
}

function getDocumentChipClass(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return "bg-red-100 dark:bg-red-900/30";
    case "word":
      return "bg-blue-100 dark:bg-blue-900/30";
    case "excel":
      return "bg-green-100 dark:bg-green-900/30";
    case "image":
      return "bg-purple-100 dark:bg-purple-900/30";
    default:
      return "bg-gray-100 dark:bg-gray-800/50";
  }
}

const SubfolderRowSchema = z
  .object({
    name: z
      .string()
      .min(1, "Required")
      .max(100, "Max 100 characters")
      .refine((val) => /^[a-zA-Z0-9\s\-_]+$/.test(val), {
        message: "Letters, numbers, spaces, hyphens, underscores only",
      }),
    isSustain: z.boolean(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date",
    }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

const AddSubfolderSchema = z.object({
  rows: z.array(SubfolderRowSchema).min(1, "Add at least one folder"),
});

type AddSubfolderFormData = z.infer<typeof AddSubfolderSchema>;

function makeEmptySubfolderRow() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return { name: "", isSustain: false, startDate: today, endDate: thirtyDaysLater };
}

export type SubfolderParent = Pick<TreeFolder, "id" | "name" | "userId">;

export function DialogAddSubfolder({
  parentFolder,
  isOpen,
  onClose,
  onSuccess,
}: {
  parentFolder: SubfolderParent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const userId = session?.user.id as string;
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddSubfolderFormData>({
    resolver: zodResolver(AddSubfolderSchema),
    defaultValues: { rows: [makeEmptySubfolderRow()] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rows" });

  const handleClose = () => {
    if (!isLoading) {
      reset({ rows: [makeEmptySubfolderRow()] });
      onClose();
    }
  };

  const onSubmit = async (data: AddSubfolderFormData) => {
    if (!parentFolder) return;

    setIsLoading(true);
    try {
      const results = await Promise.all(
        data.rows.map((row) =>
          createFolder({
            name: row.name,
            userId: parentFolder.userId,
            createdById: userId,
            isRoot: false,
            isSustain: row.isSustain,
            parentId: parentFolder.id,
            startDate: new Date(row.startDate),
            endDate: new Date(row.endDate),
          })
        )
      );

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(
          `${succeeded} subfolder${succeeded > 1 ? "s" : ""} created successfully`
        );
        onSuccess?.();
      }
      if (failed > 0) {
        const firstError = results.find((r) => !r.success)?.error;
        toast.error(
          `${failed} subfolder${failed > 1 ? "s" : ""} failed to create${
            firstError ? `: ${firstError}` : ""
          }`
        );
      }

      if (failed === 0) {
        reset({ rows: [makeEmptySubfolderRow()] });
        onClose();
      }
    } catch (error) {
      console.error("Error creating subfolders:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[900px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#0a1f44] p-2.5">
                <FolderPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Add Subfolders</DialogTitle>
                <DialogDescription>
                  Create one or more subfolders inside &quot;
                  {parentFolder?.name || "this folder"}&quot;.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 overflow-hidden rounded-lg border">
            <div className="flex items-center gap-2 bg-[#0a1f44] py-2 pl-4 pr-3 text-xs font-medium text-white">
              <div className="w-6 shrink-0" />
              <div className="min-w-[180px] flex-1">
                Folder Name <span className="text-red-300">*</span>
              </div>
              <div className="w-[140px] shrink-0">
                Start Date <span className="text-red-300">*</span>
              </div>
              <div className="w-[140px] shrink-0">
                End Date <span className="text-red-300">*</span>
              </div>
              <div className="w-[110px] shrink-0">Sustain</div>
              <div className="w-9 shrink-0" />
            </div>

            <div className="max-h-[360px] divide-y overflow-y-auto bg-background">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-wrap items-start gap-2 py-3 pl-4 pr-3 odd:bg-muted/30"
                >
                  <div className="flex h-9 w-6 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </div>

                  <div className="min-w-[180px] flex-1 grid gap-1">
                    <Input
                      id={`rows.${index}.name`}
                      placeholder="Folder name"
                      {...register(`rows.${index}.name` as const)}
                      aria-invalid={!!errors.rows?.[index]?.name}
                    />
                    {errors.rows?.[index]?.name && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.rows[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-[140px] shrink-0 grid gap-1">
                    <Input
                      id={`rows.${index}.startDate`}
                      type="date"
                      {...register(`rows.${index}.startDate` as const)}
                      aria-invalid={!!errors.rows?.[index]?.startDate}
                    />
                  </div>

                  <div className="w-[140px] shrink-0 grid gap-1">
                    <Input
                      id={`rows.${index}.endDate`}
                      type="date"
                      {...register(`rows.${index}.endDate` as const)}
                      aria-invalid={!!errors.rows?.[index]?.endDate}
                    />
                    {errors.rows?.[index]?.endDate && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.rows[index]?.endDate?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex h-9 w-[110px] shrink-0 items-center gap-2 rounded-md border bg-background px-3">
                    <Checkbox
                      id={`rows.${index}.isSustain`}
                      className="h-5 w-5 cursor-pointer"
                      checked={watch(`rows.${index}.isSustain`)}
                      onCheckedChange={(checked) =>
                        setValue(`rows.${index}.isSustain`, checked === true)
                      }
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`rows.${index}.isSustain`}
                      className="cursor-pointer whitespace-nowrap text-xs"
                    >
                      Sustain
                    </Label>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:cursor-pointer hover:bg-destructive/10"
                      disabled={fields.length === 1 || isLoading}
                      onClick={() => remove(index)}
                      title="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove row</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full border-dashed hover:cursor-pointer"
            onClick={() => append(makeEmptySubfolderRow())}
            disabled={isLoading}
            title="Add another folder row"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Row
          </Button>

          <DialogFooter className="mt-4 items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {fields.length} folder{fields.length > 1 ? "s" : ""} ready to
              create
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:cursor-pointer"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="hover:cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : fields.length > 1 ? (
                  `Create ${fields.length} Folders`
                ) : (
                  "Create Folder"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogUploadToFolder({
  folder,
  isOpen,
  onClose,
  onSuccess,
}: {
  folder: TreeFolder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { uploadFile } = useDirectUpload({
    onProgress: (p) => setProgress(p),
  });

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setProgress(0);
      onClose();
    }
  };

  const handleFileChange = (newFiles: File[] | null) => {
    setFiles(newFiles || []);
  };

  const handleRemoveFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file));
  };

  const handleUpload = async () => {
    if (!folder || files.length === 0) return;

    setIsUploading(true);
    let succeeded = 0;
    let failed = 0;

    for (const file of files) {
      try {
        await uploadFile(file, folder.id);
        succeeded++;
      } catch (error) {
        failed++;
      }
    }

    setIsUploading(false);

    if (succeeded > 0) {
      toast.success(
        `${succeeded} file${succeeded > 1 ? "s" : ""} uploaded successfully`
      );
      onSuccess?.();
    }
    if (failed > 0) {
      toast.error(`${failed} file${failed > 1 ? "s" : ""} failed to upload`);
    }

    if (failed === 0) {
      setFiles([]);
      setProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#0a1f44] p-2.5">
              <FileUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Upload one or more files into &quot;
                {folder?.name || "this folder"}&quot;.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <FileUpload
            onChange={handleFileChange}
            value={files}
            accept={{ "application/pdf": [".pdf"] }}
            multiple
            disabled={isUploading}
            progress={isUploading ? progress : null}
            handleRemoveFile={handleRemoveFile}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            onClick={handleClose}
            disabled={isUploading}
            title="Cancel upload"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="hover:cursor-pointer"
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            title="Upload selected files"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload {files.length > 1 ? `${files.length} Files` : "File"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TreeHeader({ showActions }: { showActions: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-[#0a1f44] to-[#16326e] py-3.5 pl-4 pr-4 text-xs font-semibold uppercase tracking-wider text-white/90">
      <div className="min-w-0 flex-1">Folder Name</div>
      <div className={COL.type}>Type</div>
      <div className={COL.period}>Period</div>
      <div className={COL.client}>Client</div>
      <div className={COL.createdBy}>Created By</div>
      {showActions && <div className={COL.actions}>Actions</div>}
    </div>
  );
}

function FolderRow({
  folder,
  depth,
  expanded,
  onToggle,
  canEdit,
  canDelete,
  canAddSubfolder,
  canUploadFile,
  showActionsColumn,
  onEdit,
  onDelete,
  onAddSubfolder,
  onUploadFile,
}: {
  folder: TreeFolder;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canAddSubfolder: boolean;
  canUploadFile: boolean;
  showActionsColumn: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubfolder: () => void;
  onUploadFile: () => void;
}) {
  const hasContent = folder.childrenCount > 0 || folder.documentCount > 0;

  return (
    <div
      className={`group flex items-start gap-2 border-b border-border/60 py-4 pr-4 transition-colors duration-150 hover:bg-blue-50/70 dark:hover:bg-blue-950/20 ${
        hasContent ? "cursor-pointer" : ""
      }`}
      onClick={() => hasContent && onToggle()}
    >
      <div
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1"
        style={{ paddingLeft: depth * 24 + 14 }}
      >
        {hasContent ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-300">
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </span>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100 transition-colors dark:bg-blue-900/40">
          <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        </span>
        <span
          className="min-w-[120px] flex-1 break-words text-base font-medium"
          title={folder.name}
        >
          {folder.name}
        </span>
        {folder.childrenCount > 0 && (
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-orange-500/30 bg-orange-500/10 text-xs text-orange-600"
            title={`${folder.childrenCount} subfolder${
              folder.childrenCount > 1 ? "s" : ""
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {folder.childrenCount}
          </Badge>
        )}
        {folder.documentCount > 0 && (
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-blue-500/30 bg-blue-500/10 text-xs text-blue-600"
            title={`${folder.documentCount} document${
              folder.documentCount > 1 ? "s" : ""
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {folder.documentCount}
          </Badge>
        )}
      </div>
      <div className={COL.type}>
        <Badge variant={folder.isRoot ? "default" : "secondary"} className="text-xs">
          {folder.isRoot ? "Root" : folder.hasProject ? "Project" : "Standard"}
        </Badge>
        {folder.isSustain && (
          <Badge variant="success" className="text-xs">
            Sustain
          </Badge>
        )}
      </div>
      <div className={`${COL.period} text-sm text-muted-foreground`}>
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span>
          {formatDate(folder.startDate)} - {formatDate(folder.endDate)}
        </span>
      </div>
      <div className={`${COL.client} truncate text-sm`} title={folder.ownerName}>
        {folder.ownerName}
      </div>
      <div
        className={`${COL.createdBy} truncate text-sm`}
        title={folder.createdByName}
      >
        {folder.createdByName}
      </div>
      {showActionsColumn && (
        <div className={COL.actions} onClick={(e) => e.stopPropagation()}>
          {canAddSubfolder && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:cursor-pointer hover:bg-orange-500/10 hover:text-orange-600"
              onClick={onAddSubfolder}
              title="Add subfolder"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="sr-only">Add subfolder</span>
            </Button>
          )}
          {canUploadFile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:cursor-pointer hover:bg-blue-500/10 hover:text-blue-600"
              onClick={onUploadFile}
              title="Upload file"
            >
              <FileUp className="h-4 w-4" />
              <span className="sr-only">Upload file</span>
            </Button>
          )}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:cursor-pointer"
                  title="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({
  document,
  depth,
  isSustain,
  canDownload,
  canDelete,
  showActionsColumn,
  onView,
  onDownload,
  onDelete,
}: {
  document: DocumentType;
  depth: number;
  isSustain: boolean;
  canDownload: boolean;
  canDelete: boolean;
  showActionsColumn: boolean;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const expiryDate = calculateExpiryDate(document.createdAt, isSustain);
  const timeRemaining = formatTimeRemaining(expiryDate);
  const expiryStatusClass = getExpiryStatusColor(expiryDate);

  return (
    <div
      className="flex cursor-pointer items-center gap-2 border-b border-border/60 py-3 pr-4 transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
      onClick={onView}
    >
      <div
        className="flex min-w-0 flex-1 items-center gap-3"
        style={{ paddingLeft: depth * 24 + 14 + 24 }}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${getDocumentChipClass(
            document.fileType
          )}`}
        >
          {getDocumentIcon(document.fileType)}
        </span>
        <span className="truncate text-sm" title={document.fileName}>
          {document.fileName}
        </span>
      </div>
      <div className={COL.type}>
        <Badge variant="outline" className="text-xs">
          {document.fileType}
        </Badge>
      </div>
      <div className={`${COL.period} text-sm text-muted-foreground`}>
        {formatDate(document.createdAt)}
      </div>
      <div
        className={`${COL.client} truncate text-sm`}
        title={document.uploadedBy}
      >
        {document.uploadedBy}
      </div>
      <div className={COL.createdBy}>
        <Badge
          className={`${expiryStatusClass} gap-1 text-xs`}
          title="Time remaining until auto-delete"
        >
          <Clock className="h-3.5 w-3.5" />
          {timeRemaining}
        </Badge>
      </div>
      {showActionsColumn && (
        <div className={COL.actions} onClick={(e) => e.stopPropagation()}>
          {canDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:cursor-pointer"
              onClick={onDownload}
              title="Download file"
            >
              <HardDriveDownload className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:cursor-pointer hover:bg-destructive/10"
              onClick={onDelete}
              title="Delete file"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface RolePermissions {
  canAddSubfolder: boolean;
  canUploadFile: boolean;
}

function getRolePermissions(role: FolderTreeRole): RolePermissions {
  switch (role) {
    case "surveyor":
      return { canAddSubfolder: true, canUploadFile: true };
    case "client":
      return { canAddSubfolder: true, canUploadFile: true };
    case "auditor":
      return { canAddSubfolder: false, canUploadFile: false };
  }
}

// Surveyors can download/delete anything; clients only what they uploaded themselves; auditors never
function canManageDocument(
  role: FolderTreeRole,
  document: DocumentType,
  userId: string
): boolean {
  if (role === "surveyor") return true;
  if (role === "client") return document.uploadedById === userId;
  return false;
}

interface FolderNodeProps {
  folder: TreeFolder;
  depth: number;
  userId: string;
  role: FolderTreeRole;
  permissions: RolePermissions;
  expandedIds: Set<string>;
  onToggle: (folderId: string) => void;
  onEdit: (folder: TreeFolder) => void;
  onDelete: (folder: TreeFolder) => void;
  onViewDocument: (document: DocumentType) => void;
  onDownloadDocument: (document: DocumentType) => void;
  onDeleteDocument: (document: DocumentType, folderId: string) => void;
  onAddSubfolder: (folder: TreeFolder) => void;
  onUploadFile: (folder: TreeFolder) => void;
}

function FolderNode({
  folder,
  depth,
  userId,
  role,
  permissions,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onAddSubfolder,
  onUploadFile,
}: FolderNodeProps) {
  const isExpanded = expandedIds.has(folder.id);
  const isOwnCreation = folder.createdById === userId;
  const canEdit = role === "surveyor" && isOwnCreation;
  const canDelete = (role === "surveyor" || role === "client") && isOwnCreation;

  return (
    <>
      <FolderRow
        folder={folder}
        depth={depth}
        expanded={isExpanded}
        onToggle={() => onToggle(folder.id)}
        canEdit={canEdit}
        canDelete={canDelete}
        canAddSubfolder={permissions.canAddSubfolder}
        canUploadFile={permissions.canUploadFile}
        showActionsColumn={role !== "auditor"}
        onEdit={() => onEdit(folder)}
        onDelete={() => onDelete(folder)}
        onAddSubfolder={() => onAddSubfolder(folder)}
        onUploadFile={() => onUploadFile(folder)}
      />
      {isExpanded && (
        <FolderNodeChildren
          folderId={folder.id}
          depth={depth + 1}
          userId={userId}
          role={role}
          permissions={permissions}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDocument={onViewDocument}
          onDownloadDocument={onDownloadDocument}
          onDeleteDocument={onDeleteDocument}
          onAddSubfolder={onAddSubfolder}
          onUploadFile={onUploadFile}
        />
      )}
    </>
  );
}

function FolderNodeChildren({
  folderId,
  depth,
  userId,
  role,
  permissions,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onAddSubfolder,
  onUploadFile,
}: {
  folderId: string;
  depth: number;
  userId: string;
  role: FolderTreeRole;
  permissions: RolePermissions;
  expandedIds: Set<string>;
  onToggle: (folderId: string) => void;
  onEdit: (folder: TreeFolder) => void;
  onDelete: (folder: TreeFolder) => void;
  onViewDocument: (document: DocumentType) => void;
  onDownloadDocument: (document: DocumentType) => void;
  onDeleteDocument: (document: DocumentType, folderId: string) => void;
  onAddSubfolder: (folder: TreeFolder) => void;
  onUploadFile: (folder: TreeFolder) => void;
}) {
  const { folder, isLoading } = useFolder(folderId);
  const [fileSearch, setFileSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-1 py-3 pr-4" style={{ paddingLeft: depth * 24 + 14 }}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!folder || (folder.children.length === 0 && folder.documents.length === 0)) {
    return (
      <div
        className="border-b py-3 pr-4 text-sm text-muted-foreground"
        style={{ paddingLeft: depth * 24 + 14 }}
      >
        Folder kosong — tidak ada subfolder atau file.
      </div>
    );
  }

  const filteredDocuments = fileSearch.trim()
    ? folder.documents.filter((doc) =>
        doc.fileName.toLowerCase().includes(fileSearch.trim().toLowerCase())
      )
    : folder.documents;

  return (
    <>
      {folder.documents.length > 0 && (
        <div
          className="border-b bg-gradient-to-r from-blue-50 to-transparent py-2 pl-3 pr-3 dark:from-blue-950/30"
          style={{ paddingLeft: depth * 24 + 14 + 24 }}
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-500/70 dark:text-blue-300/70" />
            <Input
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder={`Search file in "${folder.name}"...`}
              className="h-9 w-full rounded-full border-blue-200 bg-white pl-9 text-xs shadow-sm transition-colors focus-visible:border-blue-400 focus-visible:ring-blue-400/30 dark:border-blue-900 dark:bg-blue-950/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      {folder.children.map((child) => (
        <FolderNode
          key={child.id}
          folder={subfolderToTreeFolder(child, folderId)}
          depth={depth}
          userId={userId}
          role={role}
          permissions={permissions}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDocument={onViewDocument}
          onDownloadDocument={onDownloadDocument}
          onDeleteDocument={onDeleteDocument}
          onAddSubfolder={onAddSubfolder}
          onUploadFile={onUploadFile}
        />
      ))}
      {filteredDocuments.map((doc) => (
        <FileRow
          key={doc.id}
          document={doc}
          depth={depth}
          isSustain={folder.isSustain}
          canDownload={canManageDocument(role, doc, userId)}
          canDelete={canManageDocument(role, doc, userId)}
          showActionsColumn={role !== "auditor"}
          onView={() => onViewDocument(doc)}
          onDownload={() => onDownloadDocument(doc)}
          onDelete={() => onDeleteDocument(doc, folderId)}
        />
      ))}
      {folder.documents.length > 0 && filteredDocuments.length === 0 && (
        <div
          className="border-b py-2 pr-3 text-xs text-muted-foreground"
          style={{ paddingLeft: depth * 24 + 14 + 24 }}
        >
          No files match &quot;{fileSearch}&quot;.
        </div>
      )}
    </>
  );
}

export interface FolderTreeBrowserProps {
  folders: TreeFolder[];
  isLoading?: boolean;
  role: FolderTreeRole;
  onMutateTopLevel?: () => void;
  emptyMessage?: string;
}

export function FolderTreeBrowser({
  folders,
  isLoading = false,
  role,
  onMutateTopLevel,
  emptyMessage = "No folders found.",
}: FolderTreeBrowserProps) {
  const { data: session } = useSession();
  const userId = session?.user.id as string;
  const permissions = getRolePermissions(role);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<TreeFolder | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(
    null
  );
  const [addSubfolderOpen, setAddSubfolderOpen] = useState(false);
  const [addSubfolderParent, setAddSubfolderParent] =
    useState<TreeFolder | null>(null);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [uploadFileFolder, setUploadFileFolder] = useState<TreeFolder | null>(
    null
  );
  const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentType | null>(
    null
  );
  const [documentToDeleteFolderId, setDocumentToDeleteFolderId] = useState<
    string | null
  >(null);

  const { mutate: globalMutate } = useSWRConfig();

  const toggleExpanded = (folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleOpenEditDialog = (folder: TreeFolder) => {
    setSelectedFolder(folder);
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (folder: TreeFolder) => {
    setSelectedFolder(folder);
    setDeleteDialogOpen(true);
  };

  const handleOpenAddSubfolder = (folder: TreeFolder) => {
    setAddSubfolderParent(folder);
    setAddSubfolderOpen(true);
  };

  const handleAddSubfolderSuccess = () => {
    if (addSubfolderParent) {
      // Refresh this folder's children wherever it's rendered and auto-expand it
      globalMutate(`/api/folders/${addSubfolderParent.id}`);
      setExpandedIds((prev) => new Set(prev).add(addSubfolderParent.id));
      onMutateTopLevel?.();
    }
  };

  const handleOpenUploadFile = (folder: TreeFolder) => {
    setUploadFileFolder(folder);
    setUploadFileOpen(true);
  };

  const handleUploadFileSuccess = () => {
    if (uploadFileFolder) {
      // Refresh this folder's documents wherever it's rendered and auto-expand it
      globalMutate(`/api/folders/${uploadFileFolder.id}`);
      setExpandedIds((prev) => new Set(prev).add(uploadFileFolder.id));
      onMutateTopLevel?.();
    }
  };

  const handleViewDocument = (document: DocumentType) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  const handleDownloadDocument = (document: DocumentType) => {
    const downloadUrl = `/api/documents/${document.id}/download?operation=download`;
    const link = window.document.createElement("a");
    link.href = downloadUrl;
    link.target = "_blank";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleOpenDeleteDocument = (document: DocumentType, folderId: string) => {
    setDocumentToDelete(document);
    setDocumentToDeleteFolderId(folderId);
    setDeleteDocumentOpen(true);
  };

  const handleDeleteDocumentSuccess = () => {
    if (documentToDeleteFolderId) {
      // Refresh this folder's documents wherever it's rendered
      globalMutate(`/api/folders/${documentToDeleteFolderId}`);
    }
    onMutateTopLevel?.();
  };

  const handleSuccess = () => {
    // Refresh the parent's children cache so an edited/deleted subfolder
    // updates immediately without needing a full page reload
    if (selectedFolder?.parentId) {
      globalMutate(`/api/folders/${selectedFolder.parentId}`);
    }
    onMutateTopLevel?.();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <TreeHeader showActions={role !== "auditor"} />

        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : folders.length > 0 ? (
          folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              userId={userId}
              role={role}
              permissions={permissions}
              expandedIds={expandedIds}
              onToggle={toggleExpanded}
              onEdit={handleOpenEditDialog}
              onDelete={handleOpenDeleteDialog}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleOpenDeleteDocument}
              onAddSubfolder={handleOpenAddSubfolder}
              onUploadFile={handleOpenUploadFile}
            />
          ))
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Edit Folder Dialog */}
      <DialogEditFolder
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        folder={selectedFolder as any}
        onSuccess={handleSuccess}
      />

      {/* Delete Folder Dialog */}
      <DialogDeleteFolder
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        folderId={selectedFolder?.id || null}
        folderName={selectedFolder?.name}
        documentCount={selectedFolder?.documentCount || 0}
        onSuccess={handleSuccess}
      />

      {/* View Document Drawer */}
      <DocumentDrawerViewer
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        document={selectedDocument}
      />

      {/* Add Subfolder Dialog */}
      <DialogAddSubfolder
        parentFolder={addSubfolderParent}
        isOpen={addSubfolderOpen}
        onClose={() => setAddSubfolderOpen(false)}
        onSuccess={handleAddSubfolderSuccess}
      />

      {/* Upload File Dialog */}
      <DialogUploadToFolder
        folder={uploadFileFolder}
        isOpen={uploadFileOpen}
        onClose={() => setUploadFileOpen(false)}
        onSuccess={handleUploadFileSuccess}
      />

      {/* Delete Document Dialog */}
      <DialogDeleteDocument
        isOpen={deleteDocumentOpen}
        onClose={() => setDeleteDocumentOpen(false)}
        document={documentToDelete}
        onSuccess={handleDeleteDocumentSuccess}
      />
    </div>
  );
}
