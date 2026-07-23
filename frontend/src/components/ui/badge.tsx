import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        danger: "bg-rose-100 text-rose-800",
        critical: "bg-red-100 text-red-800",
        accent: "bg-sky-100 text-sky-800"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

