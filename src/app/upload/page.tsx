import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import LayoutDashboard from "@/layout/LayoutDashboard";
// import UploadPage from "@/views/upload";

export const metadata: Metadata = {
  title: "Upload Documents | TSI Audit Document Share",
  description:
    "Securely upload audit documents with our intuitive interface. Supports various file formats with automatic categorization and metadata extraction.",
  keywords:
    "document upload, file upload, audit documentation, secure upload, TSI",
};

export default async function Upload() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  // return (
  //   <LayoutDashboard>
  //     <UploadPage />
  //   </LayoutDashboard>
  // );
}
