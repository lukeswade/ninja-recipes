import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Heart, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "./ImagePlaceholder";

export interface RecipeCardProps {
  id: string;
  title: string;
  imageUrl: string;
  prepTime: string;
  servings: number;
  favoriteCount: number;
  isPrivate: boolean;
  isFavorited?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: (id: string) => void;
}

export function RecipeCard({
  id,
  title,
  imageUrl,
  prepTime,
  servings,
  favoriteCount,
  isPrivate,
  isFavorited = false,
  onClick,
  onFavoriteToggle,
}: RecipeCardProps) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group" 
      onClick={onClick} 
      data-testid={`card-recipe-${id}`}
    >
      {/* Tall Image Container */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <ImagePlaceholder className="w-full h-full" />
        )}
        {/* Privacy Badge - top right with backdrop blur */}
        <div className="absolute top-4 right-4">
          <div className="backdrop-blur-md bg-background/80 rounded-full px-3 py-1.5 flex items-center gap-1.5" data-testid={`badge-privacy-${id}`}>
            {isPrivate ? (
              <Lock className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Globe className="h-3 w-3 text-accent" />
            )}
          </div>
        </div>
      </div>

      {/* Content Below Image */}
      <div className="p-6">
        {/* Title - Large Serif */}
        <h3 className="font-serif text-2xl font-light mb-4 leading-tight" data-testid={`text-recipe-title-${id}`}>
          {title}
        </h3>

        {/* Champagne Gold Separator */}
        <div className="w-12 h-[1px] bg-accent mb-4"></div>

        {/* Meta Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium tracking-widest uppercase text-muted-foreground">
            <div className="flex items-center gap-1.5" data-testid={`text-prep-time-${id}`}>
              <Clock className="h-3.5 w-3.5" />
              {prepTime}
            </div>
            <div className="flex items-center gap-1.5" data-testid={`text-servings-${id}`}>
              <Users className="h-3.5 w-3.5" />
              {servings}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.(id);
            }}
            data-testid={`button-favorite-${id}`}
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium">{favoriteCount}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
