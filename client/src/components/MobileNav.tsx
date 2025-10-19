import { Home, BookOpen, Plus, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddRecipe?: () => void;
}

export function MobileNav({ activeTab, onTabChange, onAddRecipe }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around h-16">
        <Button
          variant="ghost"
          size="icon"
          className={activeTab === 'home' ? 'text-primary' : 'text-muted-foreground'}
          onClick={() => onTabChange('home')}
          data-testid="button-nav-home"
        >
          <Home className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={activeTab === 'community' ? 'text-primary' : 'text-muted-foreground'}
          onClick={() => onTabChange('community')}
          data-testid="button-nav-community"
        >
          <BookOpen className="h-5 w-5" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full -mt-6"
          onClick={onAddRecipe}
          data-testid="button-add-recipe-mobile"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={activeTab === 'favorites' ? 'text-primary' : 'text-muted-foreground'}
          onClick={() => onTabChange('favorites')}
          data-testid="button-nav-favorites"
        >
          <Heart className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'}
          onClick={() => onTabChange('profile')}
          data-testid="button-nav-profile"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}
