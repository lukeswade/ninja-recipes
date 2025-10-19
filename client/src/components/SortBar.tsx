import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface SortBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortBar({ value, onChange }: SortBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowUpDown className="h-4 w-4" />
        <span className="tracking-wide uppercase font-medium">Sort by:</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]" data-testid="select-sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest" data-testid="option-sort-newest">Newest First</SelectItem>
          <SelectItem value="oldest" data-testid="option-sort-oldest">Oldest First</SelectItem>
          <SelectItem value="popular" data-testid="option-sort-popular">Most Popular</SelectItem>
          <SelectItem value="title-asc" data-testid="option-sort-title-asc">Title (A-Z)</SelectItem>
          <SelectItem value="title-desc" data-testid="option-sort-title-desc">Title (Z-A)</SelectItem>
          <SelectItem value="prep-time" data-testid="option-sort-prep-time">Quick Recipes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
