import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, Heart, Share2, Lock, Globe, Edit, ChefHat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ShareModal } from "./ShareModal";
import { useState } from "react";

interface RecipeDetailModalProps {
  open: boolean;
  onClose: () => void;
  recipe: {
    id: string;
    title: string;
    imageUrl: string | null;
    prepTime: string;
    servings: number;
    favoriteCount: number;
    isPrivate: boolean;
    isFavorited?: boolean;
    author: {
      displayName: string | null;
    };
    ingredients: Array<{
      amount: string;
      measurement: string;
      name: string;
      description?: string | null;
    }>;
    directions: string;
    photos?: Array<{ imageUrl: string }>;
  };
  onFavoriteToggle?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
}

export function RecipeDetailModal({
  open,
  onClose,
  recipe,
  onFavoriteToggle,
  onShare,
  onEdit,
}: RecipeDetailModalProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [cookingMode, setCookingMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const steps = recipe.directions.split('\n').filter(step => step.trim());
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {recipe.imageUrl && (
          <div className="relative">
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-4 right-4">
              <Badge variant={recipe.isPrivate ? "secondary" : "default"} className="gap-1">
                {recipe.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {recipe.isPrivate ? "Private" : "Public"}
              </Badge>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2" data-testid="text-recipe-title">
              {recipe.title}
            </h2>
            <p className="text-sm text-muted-foreground">By {recipe.author.displayName || 'Anonymous'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {recipe.prepTime}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {recipe.servings} servings
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onFavoriteToggle}
                data-testid="button-favorite"
              >
                <Heart
                  className={`h-4 w-4 ${recipe.isFavorited ? 'fill-current text-red-500' : ''}`}
                />
                {recipe.favoriteCount}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShareModalOpen(true)} 
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="ingredients" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="ingredients" data-testid="tab-ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="directions" data-testid="tab-directions">Directions</TabsTrigger>
              <TabsTrigger value="photos" data-testid="tab-photos">Photos</TabsTrigger>
            </TabsList>
            <TabsContent value="ingredients" className="mt-4 space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md hover-elevate"
                  data-testid={`ingredient-item-${index}`}
                >
                  <Checkbox 
                    className="mt-0.5"
                    checked={checkedIngredients.has(index)}
                    onCheckedChange={() => toggleIngredient(index)}
                    data-testid={`checkbox-ingredient-${index}`}
                  />
                  <div className="flex-1">
                    <p className={`transition-opacity ${checkedIngredients.has(index) ? 'opacity-40 line-through' : ''}`}>
                      <span className="font-medium">
                        {ingredient.amount} {ingredient.measurement}
                      </span>{" "}
                      {ingredient.name}
                    </p>
                    {ingredient.description && (
                      <p className={`text-sm text-muted-foreground mt-1 transition-opacity ${checkedIngredients.has(index) ? 'opacity-40' : ''}`}>
                        {ingredient.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="directions" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant={cookingMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCookingMode(!cookingMode)}
                  className="gap-2"
                  data-testid="button-cooking-mode"
                >
                  <ChefHat className="h-4 w-4" />
                  {cookingMode ? "Exit Cooking Mode" : "Cooking Mode"}
                </Button>
              </div>

              {cookingMode ? (
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div 
                      key={index} 
                      className="p-6 rounded-lg bg-muted/30 border-l-4 border-accent"
                      data-testid={`step-${index}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-lg font-serif font-semibold text-accent">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-lg leading-relaxed pt-1.5">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none" data-testid="text-directions">
                  <p className="whitespace-pre-wrap">{recipe.directions}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="photos" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recipe.photos?.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.imageUrl}
                    alt={`Recipe photo ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-md"
                    data-testid={`photo-${index}`}
                  />
                ))}
                {(!recipe.photos || recipe.photos.length === 0) && (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No additional photos
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        recipe={{
          id: recipe.id,
          title: recipe.title,
          imageUrl: recipe.imageUrl || undefined,
        }}
      />
    </Dialog>
  );
}
