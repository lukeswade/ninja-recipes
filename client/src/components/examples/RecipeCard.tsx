import { RecipeCard } from '../RecipeCard';
import acaiImage from '@assets/generated_images/Ninja_Creami_acai_bowl_4964662d.png';

export default function RecipeCardExample() {
  return (
    <div className="p-6 bg-background">
      <RecipeCard
        id="1"
        title="Purple Acai Protein Bowl"
        imageUrl={acaiImage}
        prepTime="10 min"
        servings={2}
        favoriteCount={24}
        isPrivate={false}
        isFavorited={false}
        onClick={() => console.log('Recipe clicked')}
        onFavoriteToggle={(id) => console.log('Favorite toggled:', id)}
      />
    </div>
  );
}
