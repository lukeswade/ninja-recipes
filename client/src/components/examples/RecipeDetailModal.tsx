import { useState } from 'react';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { Button } from '@/components/ui/button';
import strawberryImage from '@assets/generated_images/Strawberry_Ninja_Creami_ice_cream_e5011bce.png';

export default function RecipeDetailModalExample() {
  const [open, setOpen] = useState(false);

  const mockRecipe = {
    id: '1',
    title: 'Strawberry Dream Ice Cream',
    imageUrl: strawberryImage,
    prepTime: '15 min',
    servings: 4,
    favoriteCount: 42,
    isPrivate: false,
    isFavorited: true,
    author: 'Chef Sarah',
    ingredients: [
      { amount: '2', measurement: 'cups', name: 'Frozen strawberries', description: 'Halved if large' },
      { amount: '1', measurement: 'cup', name: 'Greek yogurt', description: 'Full fat works best' },
      { amount: '1/4', measurement: 'cup', name: 'Honey or maple syrup' },
      { amount: '1', measurement: 'tsp', name: 'Vanilla extract' },
    ],
    directions: 'Add all ingredients to your Ninja Creami pint container.\n\nFreeze for 24 hours until completely solid.\n\nInstall the Creami pint in the outer bowl and process on ICE CREAM setting.\n\nIf needed, re-spin for smoother texture.\n\nEnjoy immediately or freeze for later!',
    photos: [strawberryImage],
  };

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>Open Recipe Detail</Button>
      <RecipeDetailModal
        open={open}
        onClose={() => setOpen(false)}
        recipe={mockRecipe}
        onFavoriteToggle={() => console.log('Favorite toggled')}
        onShare={() => console.log('Share clicked')}
        onEdit={() => console.log('Edit clicked')}
      />
    </div>
  );
}
