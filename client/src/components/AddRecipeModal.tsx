import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IngredientRow, type Ingredient } from "./IngredientRow";
import { Plus, Upload, X } from "lucide-react";
import { useCreateRecipe } from "@/lib/useRecipes";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { apiRequest } from "@/lib/queryClient";

interface AddRecipeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddRecipeModal({ open, onClose }: AddRecipeModalProps) {
  const [title, setTitle] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [directions, setDirections] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", amount: "", measurement: "cup", name: "", description: "", link: "" },
  ]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const createRecipe = useCreateRecipe();
  const { toast } = useToast();

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: Date.now().toString(),
        amount: "",
        measurement: "cup",
        name: "",
        description: "",
        link: "",
      },
    ]);
  };

  const updateIngredient = (id: string, updated: Ingredient) => {
    setIngredients(ingredients.map((i) => (i.id === id ? updated : i)));
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const getUploadParameters = async () => {
    const response = await apiRequest<{ uploadURL: string }>('/api/objects/upload', {
      method: 'POST',
    });
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const uploadedUrl = result.successful[0]?.uploadURL;
    if (!uploadedUrl) return;
    
    setUploadedImageUrl(uploadedUrl);
    toast({
      title: "Image uploaded",
      description: "Your recipe image has been uploaded successfully.",
    });
  };

  const removeImage = () => {
    setUploadedImageUrl(null);
  };

  const resetForm = () => {
    setTitle("");
    setPrepTime("");
    setServings("");
    setDirections("");
    setIsPrivate(false);
    setIngredients([{ id: "1", amount: "", measurement: "cup", name: "", description: "", link: "" }]);
    setUploadedImageUrl(null);
  };

  const handleSave = async () => {
    if (!title || !prepTime || !servings || !directions || ingredients.some(i => !i.name)) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const recipeData: any = {
        title,
        prepTime,
        servings: parseInt(servings),
        directions,
        isPrivate,
        ingredients: ingredients.map(({ id, ...rest }) => rest),
      };

      const recipe = await createRecipe.mutateAsync(recipeData);

      if (uploadedImageUrl) {
        await apiRequest(`/api/recipes/${recipe.id}/image`, {
          method: 'PUT',
          body: JSON.stringify({ imageURL: uploadedImageUrl }),
        });
      }

      toast({
        title: "Recipe created!",
        description: "Your recipe has been saved successfully.",
      });

      resetForm();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create recipe",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add New Recipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chocolate Protein Ice Cream"
              data-testid="input-recipe-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep-time">Prep Time</Label>
              <Input
                id="prep-time"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g., 10 min"
                data-testid="input-prep-time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="e.g., 2"
                data-testid="input-servings"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ingredients</Label>
            {ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                onChange={(updated) => updateIngredient(ingredient.id, updated)}
                onRemove={() => removeIngredient(ingredient.id)}
              />
            ))}
            <Button
              variant="outline"
              onClick={addIngredient}
              className="w-full gap-2"
              data-testid="button-add-ingredient"
            >
              <Plus className="h-4 w-4" />
              Add Ingredient
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="directions">Directions</Label>
            <Textarea
              id="directions"
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              placeholder="Step-by-step instructions..."
              rows={6}
              data-testid="input-directions"
            />
          </div>

          <div className="space-y-3">
            <Label>Photos</Label>
            {uploadedImageUrl ? (
              <div className="relative">
                <img src={uploadedImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-8 text-center" data-testid="button-upload-photo">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a photo for your recipe
                </p>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={getUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonVariant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </ObjectUploader>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-md border bg-card">
            <div>
              <Label htmlFor="privacy" className="cursor-pointer">
                Make recipe private
              </Label>
              <p className="text-sm text-muted-foreground">
                Only you can see private recipes
              </p>
            </div>
            <Switch
              id="privacy"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              data-testid="switch-privacy"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1" 
              disabled={createRecipe.isPending}
              data-testid="button-save-recipe"
            >
              {createRecipe.isPending ? "Saving..." : "Save Recipe"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
