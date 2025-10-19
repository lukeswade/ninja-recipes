import { ChefHat } from "lucide-react";

interface ImagePlaceholderProps {
  className?: string;
}

export function ImagePlaceholder({ className = "" }: ImagePlaceholderProps) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <ChefHat className="h-20 w-20 text-accent/40" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
}
