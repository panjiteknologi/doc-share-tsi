"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RETENTION_DAY_OPTIONS } from "@/lib/cron";

interface RetentionDaysToggleProps {
  value?: number;
  onChange: (days: number) => void;
  disabled?: boolean;
}

export function RetentionDaysToggle({
  value,
  onChange,
  disabled,
}: RetentionDaysToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value?.toString() ?? ""}
      onValueChange={(value) => {
        if (value) onChange(Number(value));
      }}
      disabled={disabled}
      className="flex flex-wrap gap-1.5"
    >
      {RETENTION_DAY_OPTIONS.map((days) => (
        <ToggleGroupItem
          key={days}
          value={days.toString()}
          className="min-w-[52px] flex-none cursor-pointer rounded-md border data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {days}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
