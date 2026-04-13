import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (<div className={cn("skeleton animate-pulse rounded-md background_color", className)} {...props} />);
}

export { Skeleton }
