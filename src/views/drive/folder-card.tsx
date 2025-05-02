import React from "react";
import { Folder, MoreHorizontal, FileText, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Folder as FolderType } from "@/hooks/use-folders";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface FolderCardProps {
  folder: FolderType;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  // Format dates for display
  const startDate = new Date(folder.startDate);
  const endDate = new Date(folder.endDate);
  const createdAt = new Date(folder.createdAt);

  const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  const createdTimeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="px-4 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-md">
            <Folder className="h-5 w-5 text-primary" />
          </div>
          <div className="truncate">
            <Link
              href={`/drive/${folder.id}`}
              className="font-medium text-base hover:underline truncate inline-block max-w-[180px]"
            >
              {folder.name}
            </Link>
            {folder.isRoot && (
              <Badge variant="outline" className="ml-2">
                Root
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="h-4 w-4 mr-2" />
            <span>
              {folder.documents.length}{" "}
              {folder.documents.length <= 1 ? "document" : "documents"}
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="truncate" title={dateRange}>
              {dateRange}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-0 flex items-center text-xs text-muted-foreground">
        <User className="h-3 w-3 mr-1" />
        <span className="truncate max-w-[125px]">{folder.user.name}</span>
        <span className="ml-auto">{createdTimeAgo}</span>
      </CardFooter>
    </Card>
  );
};

export default FolderCard;
