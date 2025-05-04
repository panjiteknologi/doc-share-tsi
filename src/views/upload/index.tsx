"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useFolders } from "@/hooks/use-folders";
import axios from "axios";
import { toast } from "sonner";
import { createDocument } from "@/action/document";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Folder,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileText,
  Info,
  Loader2,
} from "lucide-react";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // States for the multi-step process
  const [step, setStep] = useState(1);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<{
    userId: string;
    folderId: string;
    id: string;
    createdAt: Date;
    url: string;
  } | null>(null);
  const [error, setError] = useState("");

  // Fetch available folders
  const { folders, isLoading: foldersLoading } = useFolders({
    userId,
    limit: 100,
  });

  // Handle folder selection
  const handleFolderChange = (value: string) => {
    setSelectedFolderId(value);
  };

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    // Reset states when file changes
    setUploadProgress(0);
    setError("");
    setUploadedDoc(null);
  };

  // Move to next step
  const goToNextStep = () => {
    setStep(step + 1);
  };

  // Move to previous step
  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Reset the form
  const resetForm = () => {
    setStep(1);
    setSelectedFolderId("");
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadedDoc(null);
    setError("");
  };

  // Handle the upload process
  const handleUpload = async () => {
    if (!selectedFile || !selectedFolderId || !userId) {
      setError(
        "Missing required information. Please select a folder and file."
      );
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folderId", selectedFolderId);

      // Upload file to S3 via API
      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        },
      });

      // Create document record in database
      const documentResponse = await createDocument({
        url: uploadResponse.data.url,
        folderId: selectedFolderId,
        userId: userId,
      });

      if (documentResponse.success) {
        if (documentResponse?.document) {
          setUploadedDoc(documentResponse.document);
        } else {
          throw new Error("Document response is undefined");
        }
        // Show success message
        toast.success("Document uploaded successfully!", {
          description: "Your document has been uploaded and is now available.",
        });
        // Move to success step
        setStep(3);
      } else {
        throw new Error(
          documentResponse.error || "Failed to create document record"
        );
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error?.message || "Failed to upload file. Please try again.");
      toast.error("Upload failed", {
        description: "There was a problem uploading your document.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Extract file type icon
  const getFileTypeIcon = (file: File | null) => {
    if (!file) return null;

    const fileType = file.type;
    if (fileType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  // Get selected folder name
  const getSelectedFolderName = () => {
    if (!selectedFolderId || !folders) return "";
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder ? folder.name : "";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Document Upload
        </h1>
        <p className="text-muted-foreground">
          Upload audit documents securely to your preferred folder
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center rounded-full h-8 w-8 ${
                step >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">Select Folder</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center rounded-full h-8 w-8 ${
                step >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Upload Document</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center rounded-full h-8 w-8 ${
                step >= 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className="ml-2 font-medium">Complete</span>
          </div>
        </div>
        <Progress className="h-2 mt-4" value={(step / 3) * 100} />
      </div>

      {/* Step 1: Folder Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Select Destination Folder
            </CardTitle>
            <CardDescription>
              Choose a folder where you want to upload your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" || foldersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading folders...
                  </p>
                </div>
              </div>
            ) : folders.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No folders found. Please create a folder first before
                  uploading documents.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="folder-select">
                    Folder <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedFolderId}
                    onValueChange={handleFolderChange}
                  >
                    <SelectTrigger id="folder-select" className="w-full">
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            <span>{folder.name}</span>
                            {folder.isRoot && (
                              <Badge variant="outline" className="ml-1">
                                Root
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFolderId && (
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {getSelectedFolderName()}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {folders.find((f) => f.id === selectedFolderId)
                            ?.documentCount || 0}{" "}
                          documents
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={!selectedFolderId || folders.length === 0}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: File Upload */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Selected Folder:{" "}
              <span className="font-medium">{getSelectedFolderName()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FileUpload
                value={selectedFile}
                onChange={handleFileChange}
                accept={{
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc"],
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                }}
                maxSize={10485760} // 10MB
                disabled={isUploading}
                progress={uploadProgress}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {selectedFile && !isUploading && uploadProgress === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ready to upload:{" "}
                    <span className="font-medium">{selectedFile.name}</span> (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={isUploading}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isUploading}
              >
                Reset
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle>Upload Complete!</CardTitle>
            <CardDescription>
              Your document has been successfully uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-md">
                  {getFileTypeIcon(selectedFile)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{selectedFile?.name}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span>{" "}
                      {((selectedFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {selectedFile?.type}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Folder:</span>{" "}
                      {getSelectedFolderName()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetForm}>
              Upload Another Document
            </Button>
            <Button onClick={() => (window.location.href = "/drive")}>
              Go to Drive
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Additional information */}
      <div className="mt-8">
        <Separator className="my-6" />
        <h2 className="text-xl font-semibold mb-4">Upload Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported File Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span>PDF Documents (.pdf)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Word Documents (.doc, .docx)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span>Excel Spreadsheets (Coming soon)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>Images (Coming soon)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Maximum file size: 10MB</span>
                </li>
                <li className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Files must be in supported formats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Folder selection is required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Secure connection required for upload</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
