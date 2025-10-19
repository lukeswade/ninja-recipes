import { Button } from "@/components/ui/button";
import { Plus, Heart, Users, ChefHat } from "lucide-react";

interface EmptyStateProps {
  type: "my-recipes" | "favorites" | "community" | "search";
  onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = {
    "my-recipes": {
      icon: ChefHat,
      title: "No Recipes Yet",
      description: "Start building your collection by creating your first delicious recipe.",
      actionLabel: "Create Recipe",
      showAction: true,
    },
    favorites: {
      icon: Heart,
      title: "No Favorites Yet",
      description: "Recipes you favorite will appear here for quick access.",
      actionLabel: "Explore Community",
      showAction: false,
    },
    community: {
      icon: Users,
      title: "No Public Recipes",
      description: "Be the first to share a recipe with the community!",
      actionLabel: "Share a Recipe",
      showAction: true,
    },
    search: {
      icon: ChefHat,
      title: "No Results Found",
      description: "Try adjusting your search terms or browse all recipes.",
      actionLabel: "Clear Search",
      showAction: true,
    },
  };

  const { icon: Icon, title, description, actionLabel, showAction } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative bg-gradient-to-br from-muted/30 to-muted/50 p-8 rounded-full">
          <Icon className="h-16 w-16 text-accent" strokeWidth={1.5} />
        </div>
      </div>
      
      <h3 className="font-serif text-3xl font-light tracking-tight mb-3">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {showAction && onAction && (
        <Button onClick={onAction} className="gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
