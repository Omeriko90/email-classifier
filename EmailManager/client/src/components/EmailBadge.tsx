import type { Label } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface EmailBadgeProps {
  label: Label;
  className?: string;
}

export function EmailBadge({ label, className }: EmailBadgeProps) {
  return (
    <Badge
      className={className}
      style={{
        backgroundColor: `hsl(${label.color} / 0.3)`,
        color: `hsl(${label.color})`,
        border: `1px solid hsl(${label.color} / 0.5)`,
      }}
      data-testid={`badge-label-${label.name}`}
    >
      {label.name}
    </Badge>
  );
}
