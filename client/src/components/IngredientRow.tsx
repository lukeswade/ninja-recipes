import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface Ingredient {
  id: string;
  amount: string;
  measurement: string;
  name: string;
  description: string;
  link: string;
}

interface IngredientRowProps {
  ingredient: Ingredient;
  onChange: (ingredient: Ingredient) => void;
  onRemove: () => void;
}

const MEASUREMENTS = [
  "tsp",
  "tbsp",
  "cup",
  "oz",
  "lb",
  "ml",
  "g",
  "kg",
  "1/4 tsp",
  "1/2 tsp",
  "1/4 tbsp",
  "1/2 tbsp",
  "1/4 cup",
  "1/2 cup",
  "3/4 cup",
];

export function IngredientRow({ ingredient, onChange, onRemove }: IngredientRowProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-md border bg-card" data-testid={`ingredient-row-${ingredient.id}`}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={ingredient.amount}
          onChange={(e) => onChange({ ...ingredient, amount: e.target.value })}
          placeholder="1"
          className="w-20"
          data-testid={`input-amount-${ingredient.id}`}
        />
        <Select
          value={ingredient.measurement}
          onValueChange={(value) => onChange({ ...ingredient, measurement: value })}
        >
          <SelectTrigger className="w-28" data-testid={`select-measurement-${ingredient.id}`}>
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            {MEASUREMENTS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={ingredient.name}
          onChange={(e) => onChange({ ...ingredient, name: e.target.value })}
          placeholder="Ingredient name"
          className="flex-1"
          data-testid={`input-name-${ingredient.id}`}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          data-testid={`button-remove-${ingredient.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Input
        value={ingredient.description}
        onChange={(e) => onChange({ ...ingredient, description: e.target.value })}
        placeholder="Description (optional)"
        data-testid={`input-description-${ingredient.id}`}
      />
      <Input
        value={ingredient.link}
        onChange={(e) => onChange({ ...ingredient, link: e.target.value })}
        placeholder="Link (optional)"
        data-testid={`input-link-${ingredient.id}`}
      />
    </div>
  );
}
