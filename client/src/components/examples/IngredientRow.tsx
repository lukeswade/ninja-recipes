import { useState } from 'react';
import { IngredientRow, type Ingredient } from '../IngredientRow';

export default function IngredientRowExample() {
  const [ingredient, setIngredient] = useState<Ingredient>({
    id: '1',
    amount: '2',
    measurement: 'cup',
    name: 'Frozen strawberries',
    description: 'Fresh or frozen work great',
    link: '',
  });

  return (
    <div className="p-6 bg-background">
      <IngredientRow
        ingredient={ingredient}
        onChange={setIngredient}
        onRemove={() => console.log('Remove clicked')}
      />
    </div>
  );
}
