"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
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
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RETENTION_DAY_OPTIONS,
  formatRetentionMonths,
  retentionDateRange,
} from "@/lib/cron";

export type FolderTreeRole = "surveyor" | "client" | "auditor";

// Shared column widths so the tree stays aligned across every depth level
const COL = {
  type: "hidden sm:flex w-[150px] shrink-0 items-center gap-2",
  period: "hidden lg:flex w-[220px] shrink-0 items-center gap-1",
  client: "hidden lg:flex w-[130px] shrink-0",
  createdBy: "hidden xl:flex w-[130px] shrink-0",
  actions: "flex w-[104px] shrink-0 justify-end gap-1",
};

export interface TreeFolder {
  id: string;
  name: string;
  isRoot: boolean;
  retentionDays: number;
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
    retentionDays: folder.retentionDays,
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

// Includes the time of day (in the viewer's own local timezone, via the
// browser's default toLocaleString behavior) so the exact auto-delete
// moment is unambiguous — not just the date.
function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(name: string) {
  return (name || "").trim().charAt(0).toUpperCase() || "?";
}

function getFileTypeCode(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return "PDF";
    case "word":
      return "DOC";
    case "excel":
      return "XLS";
    case "image":
      return "IMG";
    default:
      return type.slice(0, 3).toUpperCase();
  }
}

// Exact hex from the approved prototype (light / dark) — kept local to this
// file rather than folded into the shadcn theme, since only this table needs
// the prototype's palette.
const FILE_TYPE_DOT_CLASS: Record<string, string> = {
  pdf: "bg-[#d64545]",
  word: "bg-[#3566d6]",
  excel: "bg-[#1e9e5a]",
  image: "bg-[#8452d6]",
};

function getFileTypeDotClass(type: string) {
  return FILE_TYPE_DOT_CLASS[type.toLowerCase()] ?? "bg-white/40";
}

function FileTypeChip({ type }: { type: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] font-semibold text-white/50">
      <span className={`h-2 w-2 shrink-0 rounded-[2px] ${getFileTypeDotClass(type)}`} />
      {getFileTypeCode(type)}
    </span>
  );
}

type Severity = "good" | "warn" | "danger";

// Mirrors the day thresholds in getExpiryStatusColor() from @/lib/cron, but
// as a severity level so it can drive a status dot instead of a solid badge.
function getExpirySeverity(expiryDate: Date): Severity {
  const diffDays = Math.floor(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 3) return "danger";
  if (diffDays <= 7) return "warn";
  return "good";
}

// Bright, saturated tones chosen to read clearly against the table's fixed
// navy background (not theme-dependent — this table is navy in both modes).
const DOT_TONE_CLASS: Record<Severity, string> = {
  good: "bg-[#3ecb92]",
  warn: "bg-[#e2a552]",
  danger: "bg-[#ee6b6b]",
};

const DOT_RING_CLASS: Record<Severity, string> = {
  good: "shadow-[0_0_0_3px_rgba(62,203,146,0.18)]",
  warn: "shadow-[0_0_0_3px_rgba(226,165,82,0.18)]",
  danger: "shadow-[0_0_0_3px_rgba(238,107,107,0.18)]",
};

const TEXT_TONE_CLASS: Record<Severity, string> = {
  good: "text-[#3ecb92]",
  warn: "text-[#e2a552]",
  danger: "text-[#ee6b6b]",
};

function StatusDot({
  tone,
  title,
  children,
}: {
  tone: Severity;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-[family-name:var(--font-geist-mono)] text-[11.5px] font-medium ${TEXT_TONE_CLASS[tone]}`}
      title={title}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE_CLASS[tone]} ${DOT_RING_CLASS[tone]}`}
      />
      {children}
    </span>
  );
}

// Solid folder glyph matching the prototype exactly (lucide's Folder/
// FolderOpen icons use a different, more detailed path).
function FolderGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 6a2 2 0 0 1 2-2h4.2a2 2 0 0 1 1.6.8L12 6h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
    </svg>
  );
}

// Draws the tree hierarchy rules: one blank/continuing slot per ancestor
// level, plus this row's own elbow (stops at mid-height when it's the last
// sibling, otherwise runs the full row height so it joins the next row).
function TreeGutter({
  ancestorLines,
  isLast,
}: {
  ancestorLines: boolean[];
  isLast: boolean;
}) {
  return (
    <span aria-hidden className="flex shrink-0 self-stretch">
      {ancestorLines.map((continues, i) => (
        <span key={i} className="relative w-6 shrink-0">
          {continues && (
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/20" />
          )}
        </span>
      ))}
      <span className="relative w-6 shrink-0">
        <span
          className={`absolute left-1/2 top-0 w-px -translate-x-1/2 bg-white/20 ${
            isLast ? "h-1/2" : "h-full"
          }`}
        />
        <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-y-1/2 bg-white/20" />
      </span>
    </span>
  );
}

// No background chip in the prototype — just a plain colored file icon,
// matching FILE_TYPE_DOT_CLASS's palette.
function getDocumentIcon(type: string) {
  const colorClass = {
    pdf: "text-[#d64545]",
    word: "text-[#3566d6]",
    excel: "text-[#1e9e5a]",
    image: "text-[#8452d6]",
  }[type.toLowerCase()] ?? "text-white/40";

  return <FileText className={`h-4 w-4 shrink-0 ${colorClass}`} strokeWidth={2} />;
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
    retentionDays: z
      .number({ required_error: "Select an auto-delete period" })
      .refine((val) => (RETENTION_DAY_OPTIONS as readonly number[]).includes(val), {
        message: "Select an auto-delete period",
      }),
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
  return {
    name: "",
    retentionDays: undefined as unknown as number,
    startDate: today,
    endDate: thirtyDaysLater,
  };
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
            retentionDays: row.retentionDays,
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
      <DialogContent className="sm:max-w-[1080px]">
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
              <div className="w-[180px] shrink-0">
                Auto Delete Document <span className="text-red-300">*</span>
              </div>
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

                  <div className="w-[180px] shrink-0 grid gap-1">
                    <Select
                      value={watch(`rows.${index}.retentionDays`)?.toString() ?? ""}
                      onValueChange={(value) => {
                        const days = Number(value);
                        setValue(`rows.${index}.retentionDays`, days, {
                          shouldValidate: true,
                        });
                        const { startDate, endDate } = retentionDateRange(days);
                        setValue(`rows.${index}.startDate`, startDate);
                        setValue(`rows.${index}.endDate`, endDate);
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-9 w-full cursor-pointer">
                        <SelectValue placeholder="Days" />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_DAY_OPTIONS.map((days) => (
                          <SelectItem
                            key={days}
                            value={days.toString()}
                            className="cursor-pointer"
                          >
                            {days} days
                            {formatRetentionMonths(days) &&
                              ` (${formatRetentionMonths(days)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.rows?.[index]?.retentionDays && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.rows[index]?.retentionDays?.message}
                      </p>
                    )}
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
                {folder?.name || "this folder"}&quot;. Format yang didukung:
                PDF, JPG, PNG.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <FileUpload
            onChange={handleFileChange}
            value={files}
            accept={{
              "application/pdf": [".pdf"],
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
            }}
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
    <div className="flex items-center gap-2 bg-[#2b3a68] py-[11px] pl-4 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#ffff]/70">
      <div className="min-w-0 flex-1 text-center text-[#ffff]">Folder Name</div>
      <div className={`${COL.type} justify-center`}>Time Remaining</div>
      <div className={`${COL.period} justify-center`}>Period</div>
      <div className={`${COL.client} justify-center`}>Client</div>
      <div className={`${COL.createdBy} justify-center`}>Created By</div>
      {showActions && (
        <div className="flex w-[104px] shrink-0 justify-center gap-1">
          Actions
        </div>
      )}
    </div>
  );
}

function FolderRow({
  folder,
  depth,
  ancestorLines,
  isLast,
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
  ancestorLines: boolean[];
  isLast: boolean;
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
  const folderExpiry = new Date(folder.endDate);
  const folderSeverity = getExpirySeverity(folderExpiry);
  const folderTimeRemaining = formatTimeRemaining(folderExpiry);

  const baseBg = depth === 1 ? "bg-white/[0.04]" : "";
  const hoverBg = depth === 1 ? "hover:bg-white/[0.09]" : "hover:bg-white/[0.05]";

  return (
    <div
      className={`group flex items-stretch border-b border-white/10 pl-4 pr-4 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7095ff]/60 ${baseBg} ${hoverBg} ${
        hasContent ? "cursor-pointer" : ""
      }`}
      onClick={() => hasContent && onToggle()}
      role={hasContent ? "button" : undefined}
      tabIndex={hasContent ? 0 : undefined}
      aria-expanded={hasContent ? expanded : undefined}
      onKeyDown={(e) => {
        if (!hasContent) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {depth > 0 && <TreeGutter ancestorLines={ancestorLines} isLast={isLast} />}
      <div className="flex min-w-0 flex-1 items-center gap-2 py-3">
        {hasContent ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/50 transition-colors group-hover:bg-white/10 group-hover:text-white">
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </span>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <span className="mx-1 flex h-6 w-[30px] shrink-0 items-center justify-center">
          <FolderGlyph
            className={`h-5 w-5 ${depth === 0 ? "text-[#f7cb59]" : "text-[#c9973f]"}`}
          />
        </span>
        <span
          className="min-w-0 break-words text-[14px] font-semibold uppercase leading-snug tracking-[-0.005em] text-white"
          title={folder.name}
        >
          {folder.name}
        </span>
        {(folder.childrenCount > 0 || folder.documentCount > 0) && (
          <span className="flex shrink-0 items-center gap-2.5">
            {folder.childrenCount > 0 && (
              <span
                className="inline-flex items-center gap-1 font-[family-name:var(--font-geist-mono)] text-[11px] text-white/50"
                title={`${folder.childrenCount} subfolder${folder.childrenCount > 1 ? "s" : ""}`}
              >
                <FolderGlyph className="h-3 w-3 text-[#f0b429]" />
                {folder.childrenCount}
              </span>
            )}
            {folder.documentCount > 0 && (
              <span
                className="inline-flex items-center gap-1 font-[family-name:var(--font-geist-mono)] text-[11px] text-white/50"
                title={`${folder.documentCount} document${folder.documentCount > 1 ? "s" : ""}`}
              >
                <FileText className="h-3 w-3 text-[#7095ff]" />
                {folder.documentCount}
              </span>
            )}
          </span>
        )}
      </div>
      <div className={COL.type}>
        <StatusDot
          tone={folderSeverity}
          title={`Akan terhapus otomatis pada ${formatDateTime(folderExpiry)}`}
        >
          {folderTimeRemaining}
        </StatusDot>
      </div>
      <div className={`${COL.period} font-[family-name:var(--font-geist-mono)] text-[12px] text-white/60`}>
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {formatDate(folder.startDate)} – {formatDate(folder.endDate)}
        </span>
      </div>
      <div className={`${COL.client} min-w-0 items-center gap-1.5`} title={folder.ownerName}>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9.5px] font-bold text-[#a9c2f5]">
          {getInitial(folder.ownerName)}
        </span>
        <span className="min-w-0 truncate text-[12.5px] text-white/60">
          {folder.ownerName}
        </span>
      </div>
      <div
        className={`${COL.createdBy} min-w-0 items-center gap-1.5`}
        title={folder.createdByName}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[9.5px] font-bold text-white/50">
          {getInitial(folder.createdByName)}
        </span>
        <span className="min-w-0 truncate text-[12.5px] text-white/60">
          {folder.createdByName}
        </span>
      </div>
      {showActionsColumn && (
        <div className={`${COL.actions} items-center`} onClick={(e) => e.stopPropagation()}>
          {canAddSubfolder && (
            <Button
              variant="ghost"
              size="icon"
              className="h-[26px] w-[26px] text-[#f0b429] hover:cursor-pointer hover:bg-[#f0b429]/15"
              onClick={onAddSubfolder}
              title="Add subfolder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="sr-only">Add subfolder</span>
            </Button>
          )}
          {canUploadFile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-[26px] w-[26px] text-[#7095ff] hover:cursor-pointer hover:bg-[#7095ff]/15"
              onClick={onUploadFile}
              title="Upload file"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span className="sr-only">Upload file</span>
            </Button>
          )}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-[26px] w-[26px] text-white/50 hover:cursor-pointer hover:bg-white/10 hover:text-white"
                  title="More actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
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
  ancestorLines,
  isLast,
  retentionDays,
  canDownload,
  canDelete,
  showActionsColumn,
  onView,
  onDownload,
  onDelete,
}: {
  document: DocumentType;
  ancestorLines: boolean[];
  isLast: boolean;
  retentionDays: number;
  canDownload: boolean;
  canDelete: boolean;
  showActionsColumn: boolean;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const expiryDate = calculateExpiryDate(document.createdAt, retentionDays);
  const timeRemaining = formatTimeRemaining(expiryDate);
  const severity = getExpirySeverity(expiryDate);

  return (
    <div
      className="group flex cursor-pointer items-stretch border-b border-white/10 pl-4 pr-4 outline-none transition-colors duration-150 hover:bg-[#2e5ae0]/25 focus-visible:bg-[#2e5ae0]/25 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7095ff]/60"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
    >
      <TreeGutter ancestorLines={ancestorLines} isLast={isLast} />
      <div className="flex min-w-0 flex-1 items-center gap-2 py-2.5">
        <span className="w-6 shrink-0" />
        <span className="mx-1 flex h-6 w-[30px] shrink-0 items-center justify-center">
          {getDocumentIcon(document.fileType)}
        </span>
        <span
          className="min-w-0 truncate text-[13.5px] font-medium text-white"
          title={document.fileName}
        >
          {document.fileName}
        </span>
      </div>
      <div className={`${COL.type} justify-center`}>
        <FileTypeChip type={document.fileType} />
      </div>
      <div className={`${COL.period} justify-center text-center font-[family-name:var(--font-geist-mono)] text-[12px] text-white/60`}>
        {formatDate(document.createdAt)}
      </div>
      <div className={`${COL.client} items-center justify-center`} title={document.uploadedBy}>
        <span className="min-w-0 truncate text-center text-[12.5px] text-white/60">
          {document.uploadedBy}
        </span>
      </div>
      <div className={`${COL.createdBy} flex-col items-center justify-center gap-0.5`}>
        <StatusDot tone={severity} title="Time remaining until auto-delete">
          {timeRemaining}
        </StatusDot>
        <span className="text-[10px] text-white/40">
          {formatDateTime(expiryDate)}
        </span>
      </div>
      {showActionsColumn && (
        <div className={`${COL.actions} items-center`} onClick={(e) => e.stopPropagation()}>
          {canDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-[26px] w-[26px] text-white/50 hover:cursor-pointer hover:bg-white/10 hover:text-white"
              onClick={onDownload}
              title="Download file"
            >
              <HardDriveDownload className="h-3.5 w-3.5" />
              <span className="sr-only">Download</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-[26px] w-[26px] text-[#ee6b6b] hover:cursor-pointer hover:bg-[#ee6b6b]/20"
              onClick={onDelete}
              title="Delete file"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
  ancestorLines: boolean[];
  isLast: boolean;
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
  ancestorLines,
  isLast,
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
  const canEdit = (role === "surveyor" || role === "client") && isOwnCreation;
  const canDelete = (role === "surveyor" || role === "client") && isOwnCreation;
  // Root nodes (depth 0) don't sit inside any gutter, so their children
  // start a fresh chain rather than inheriting a slot for the root itself.
  const childAncestorLines = depth === 0 ? [] : [...ancestorLines, !isLast];

  return (
    <>
      <FolderRow
        folder={folder}
        depth={depth}
        ancestorLines={ancestorLines}
        isLast={isLast}
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
          ancestorLines={childAncestorLines}
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
  ancestorLines,
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
  ancestorLines: boolean[];
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
      <div
        className="space-y-1.5 border-b border-white/10 py-2 pr-4"
        style={{ paddingLeft: depth * 24 + 16 }}
      >
        <Skeleton className="h-8 w-full bg-white/10" />
        <Skeleton className="h-8 w-full bg-white/10" />
      </div>
    );
  }

  if (!folder || (folder.children.length === 0 && folder.documents.length === 0)) {
    return (
      <div
        className="flex items-center gap-2 border-b border-white/10 py-3 pr-4 text-[13px] text-white/50"
        style={{ paddingLeft: depth * 24 + 16 }}
      >
        <FolderGlyph className="h-4 w-4 shrink-0 text-[#c9973f] opacity-60" />
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
          className="border-b border-white/10 bg-white/[0.04] py-2 pr-3"
          style={{ paddingLeft: depth * 24 + 16 }}
        >
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder={`Search file in "${folder.name}"...`}
              className="h-8 w-full border-transparent bg-white pl-8 text-xs text-[#0b1526] shadow-none placeholder:text-slate-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      {folder.children.map((child, index) => (
        <FolderNode
          key={child.id}
          folder={subfolderToTreeFolder(child, folderId)}
          depth={depth}
          ancestorLines={ancestorLines}
          isLast={
            index === folder.children.length - 1 &&
            filteredDocuments.length === 0
          }
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
      {filteredDocuments.map((doc, index) => (
        <FileRow
          key={doc.id}
          document={doc}
          ancestorLines={ancestorLines}
          isLast={index === filteredDocuments.length - 1}
          retentionDays={folder.retentionDays}
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
          className="border-b border-white/10 py-2 pr-3 text-xs text-white/50"
          style={{ paddingLeft: depth * 24 + 16 }}
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
      {/* Fixed navy surface (same in both app themes), not just the header —
          the header gradient tone continues into the body. */}
      <div className="overflow-hidden rounded-[14px] border border-white/10 bg-[#081530] font-[family-name:var(--font-geist-sans)] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_-16px_rgba(0,0,0,0.6)]">
        <TreeHeader showActions={role !== "auditor"} />

        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-white/10" />
            ))}
          </div>
        ) : folders.length > 0 ? (
          folders.map((folder, index) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              ancestorLines={[]}
              isLast={index === folders.length - 1}
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
          <div className="p-8 text-center text-sm text-white/50">
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
