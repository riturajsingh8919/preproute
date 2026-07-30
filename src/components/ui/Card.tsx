import { cn } from "@/lib/utils";

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
};
