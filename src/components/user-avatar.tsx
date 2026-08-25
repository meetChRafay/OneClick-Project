import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "bg-chart-1/15 text-chart-1",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/15 text-chart-3",
  "bg-chart-4/15 text-chart-4",
  "bg-chart-5/15 text-chart-5",
];

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function UserAvatar({
  name,
  id,
  avatarUrl,
  className,
  size = "default",
}: {
  name: string;
  id?: string;
  avatarUrl?: string | null;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizeClass = size === "sm" ? "size-6 text-[10px]" : size === "lg" ? "size-10 text-sm" : "size-8 text-xs";
  return (
    <Avatar className={cn(sizeClass, className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback className={cn("font-medium", colorFor(id ?? name))}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
