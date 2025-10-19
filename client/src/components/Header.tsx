import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onAddRecipe?: () => void;
  onProfileClick?: () => void;
}

export function Header({ onAddRecipe, onProfileClick }: HeaderProps) {
  const { user } = useAuth();

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
    }
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const initials = getInitials(user?.displayName, user?.email);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-6 md:px-8 gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hidden md:flex" data-testid="button-sidebar-toggle" />
          <h1 className="font-serif text-3xl font-light tracking-tight" data-testid="text-app-title">
            Creami
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="default"
            className="gap-2 hidden md:flex rounded-full"
            onClick={onAddRecipe}
            data-testid="button-add-recipe-desktop"
          >
            <Plus className="h-4 w-4" />
            Add Recipe
          </Button>
          <ThemeToggle />
          <Avatar
            className="h-10 w-10 cursor-pointer hover-elevate border-2 border-border"
            onClick={onProfileClick}
            data-testid="button-profile"
          >
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
