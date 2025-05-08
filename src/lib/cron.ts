export function calculateExpiryDate(createdAt: string | Date): Date {
  const created = new Date(createdAt);
  const expiryDate = new Date(created);
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from creation
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
