// Preset retention periods (in days) offered when creating a folder.
export const RETENTION_DAY_OPTIONS = [
  1, 7, 15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360,
] as const;

export const DEFAULT_RETENTION_DAYS = 60;

// Rough days-to-months label for display next to a day count (e.g. "~7 months").
// Periods under 30 days aren't worth converting, so those return null.
// Derives a start/end date pair (as yyyy-mm-dd strings) from today plus a
// retention period, so folder forms can prefill the date range from the
// chosen auto-delete period instead of requiring separate manual entry.
export function retentionDateRange(days: number): {
  startDate: string;
  endDate: string;
} {
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function formatRetentionMonths(days: number): string | null {
  if (days < 30) return null;
  const months = Math.round(days / 30);
  return `~${months} month${months > 1 ? "s" : ""}`;
}

export function calculateExpiryDate(
  createdAt: string | Date,
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Date {
  const created = new Date(createdAt);
  const expiryDate = new Date(created);
  expiryDate.setDate(expiryDate.getDate() + retentionDays);
  return expiryDate;
}

export function formatTimeRemaining(expiryDate: Date): string {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();

  // Calculate days, hours, minutes
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays <= 0 && diffHours <= 0) {
    return "Expiring soon";
  } else if (diffDays === 0) {
    return `${diffHours}h left`;
  } else if (diffDays === 1) {
    return "1 day left";
  } else {
    return `${diffDays} days left`;
  }
}

export function getExpiryStatusColor(expiryDate: Date): string {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return "text-destructive bg-destructive/10"; // Red for 3 or fewer days
  } else if (diffDays <= 7) {
    return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500"; // Amber for 7 or fewer days
  } else {
    return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-500"; // Green for more than 7 days
  }
}
