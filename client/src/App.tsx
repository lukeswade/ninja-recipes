import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { SortBar } from "@/components/SortBar";
import { RecipeCard } from "@/components/RecipeCard";
import { AddRecipeModal } from "@/components/AddRecipeModal";
import { RecipeDetailModal } from "@/components/RecipeDetailModal";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { useRecipes, useToggleFavorite } from "@/lib/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRef } from "react";
import type { RecipeWithDetails } from "@shared/schema";

function MainApp() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  
  // Debug: Show when new code loads
  console.log("MainApp rendering - NEW CODE LOADED!");
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [addRecipeOpen, setAddRecipeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const queryType = activeTab === 'home' ? 'my-recipes' : activeTab === 'favorites' ? 'favorites' : 'public';
  const { data: recipes = [], isLoading } = useRecipes(queryType);
  const toggleFavorite = useToggleFavorite();

  const handleFavoriteToggle = (id: string) => {
    toggleFavorite.mutate(id);
  };

  const filteredAndSortedRecipes = recipes
    .filter(recipe => {
      // Apply search filter
      const query = debouncedSearchQuery.toLowerCase();
      if (query) {
        const titleMatch = recipe.title.toLowerCase().includes(query);
        const ingredientsMatch = recipe.ingredients?.some(ing => 
          ing.name.toLowerCase().includes(query) || 
          ing.description?.toLowerCase().includes(query)
        ) ?? false;
        const directionsMatch = recipe.directions?.toLowerCase().includes(query) ?? false;

        if (!titleMatch && !ingredientsMatch && !directionsMatch) {
          return false;
        }
      }

      // Apply community filter (for community tab)
      if (activeTab === 'community' && activeFilter !== 'all') {
        // Map filter selections to sorting equivalents until tags/collections are added to schema
        switch (activeFilter) {
          case 'popular':
            // Will be shown via sorting, no filtering needed
            return true;
          case 'recent':
            // Will be shown via sorting, no filtering needed  
            return true;
          case 'following':
            // Would require a follows table in schema - not yet implemented
            return true;
          default:
            return true;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'popular':
          return b.favoriteCount - a.favoriteCount;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'prep-time': {
          // Extract total minutes from prep time strings (handles "1 hr 30 min", "45 min", etc.)
          const extractMinutes = (time: string) => {
            if (!time) return 999;
            
            let totalMinutes = 0;
            
            // Extract hours
            const hourMatch = time.match(/(\d+)\s*(?:hr|hour)/i);
            if (hourMatch) {
              totalMinutes += parseInt(hourMatch[1]) * 60;
            }
            
            // Extract minutes
            const minMatch = time.match(/(\d+)\s*(?:min|minute)/i);
            if (minMatch) {
              totalMinutes += parseInt(minMatch[1]);
            }
            
            // If no hours or minutes found, try to extract any number
            if (totalMinutes === 0) {
              const numMatch = time.match(/(\d+)/);
              if (numMatch) {
                totalMinutes = parseInt(numMatch[1]);
              } else {
                totalMinutes = 999; // Default for unparseable times
              }
            }
            
            return totalMinutes;
          };
          return extractMinutes(a.prepTime) - extractMinutes(b.prepTime);
        }
        default:
          return 0;
      }
    });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      action: () => {
        searchInputRef.current?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'n',
      action: () => {
        if (!addRecipeOpen && !selectedRecipe) {
          setAddRecipeOpen(true);
        }
      },
      description: 'New recipe',
    },
    {
      key: 'Escape',
      action: () => {
        if (selectedRecipe) {
          setSelectedRecipe(null);
        } else if (addRecipeOpen) {
          setAddRecipeOpen(false);
        }
      },
      description: 'Close modals',
    },
  ]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddRecipe={() => setAddRecipeOpen(true)}
        />
        
        <div className="flex flex-col flex-1 min-h-screen bg-background pb-20 md:pb-0">
          <Header 
            onAddRecipe={() => setAddRecipeOpen(true)}
            onProfileClick={signOut}
          />
          
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-8 md:px-12 py-12 space-y-16">
        <div className="space-y-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} ref={searchInputRef} />
          
          <div className="flex flex-wrap items-center gap-4">
            <SortBar value={sortBy} onChange={setSortBy} />
            
            {activeTab === 'community' && (
              <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            )}
          </div>
        </div>

        <div>
          {activeTab === 'home' && (
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-light tracking-tight mb-12">Your Collection</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredAndSortedRecipes.length === 0 ? (
                <EmptyState 
                  type={debouncedSearchQuery ? "search" : "my-recipes"} 
                  onAction={debouncedSearchQuery ? () => setSearchQuery('') : () => setAddRecipeOpen(true)} 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {filteredAndSortedRecipes.map((recipe, index) => (
                    <div 
                      key={recipe.id} 
                      className={`animate-fade-in-up opacity-0 stagger-${(index % 6) + 1}`}
                    >
                      <RecipeCard
                        id={recipe.id}
                        title={recipe.title}
                        imageUrl={recipe.imageUrl || ''}
                        prepTime={recipe.prepTime}
                        servings={recipe.servings}
                        favoriteCount={recipe.favoriteCount}
                        isPrivate={recipe.isPrivate}
                        isFavorited={recipe.isFavorited}
                        onClick={() => setSelectedRecipe(recipe)}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'community' && (
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-light tracking-tight mb-12">Community Cookbook</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredAndSortedRecipes.length === 0 ? (
                <EmptyState 
                  type={debouncedSearchQuery ? "search" : "community"} 
                  onAction={debouncedSearchQuery ? () => setSearchQuery('') : () => setAddRecipeOpen(true)} 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {filteredAndSortedRecipes.map((recipe, index) => (
                    <div 
                      key={recipe.id} 
                      className={`animate-fade-in-up opacity-0 stagger-${(index % 6) + 1}`}
                    >
                      <RecipeCard
                        id={recipe.id}
                        title={recipe.title}
                        imageUrl={recipe.imageUrl || ''}
                        prepTime={recipe.prepTime}
                        servings={recipe.servings}
                        favoriteCount={recipe.favoriteCount}
                        isPrivate={recipe.isPrivate}
                        isFavorited={recipe.isFavorited}
                        onClick={() => setSelectedRecipe(recipe)}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-light tracking-tight mb-12">Favorites</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredAndSortedRecipes.length === 0 ? (
                <EmptyState 
                  type={debouncedSearchQuery ? "search" : "favorites"} 
                  onAction={debouncedSearchQuery ? () => setSearchQuery('') : undefined} 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {filteredAndSortedRecipes.map((recipe, index) => (
                    <div 
                      key={recipe.id} 
                      className={`animate-fade-in-up opacity-0 stagger-${(index % 6) + 1}`}
                    >
                      <RecipeCard
                        id={recipe.id}
                        title={recipe.title}
                        imageUrl={recipe.imageUrl || ''}
                        prepTime={recipe.prepTime}
                        servings={recipe.servings}
                        favoriteCount={recipe.favoriteCount}
                        isPrivate={recipe.isPrivate}
                        isFavorited={recipe.isFavorited}
                        onClick={() => setSelectedRecipe(recipe)}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="font-serif text-2xl font-bold mb-6">Profile & Settings</h2>
              <div className="max-w-2xl space-y-6">
                <div className="p-6 border rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email || 'dev@example.com'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Display Name</p>
                      <p className="font-medium">{user?.displayName || 'Dev User'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-mono text-sm">{user?.id || 'dev-user-123'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold">Settings</h3>
                  <div className="space-y-3">
                    <button
                      onClick={signOut}
                      className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                      data-testid="button-sign-out"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
            </div>
          </main>

          <MobileNav 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            onAddRecipe={() => setAddRecipeOpen(true)}
          />

          <AddRecipeModal
            open={addRecipeOpen}
            onClose={() => setAddRecipeOpen(false)}
          />

          {selectedRecipe && (
            <RecipeDetailModal
              open={!!selectedRecipe}
              onClose={() => setSelectedRecipe(null)}
              recipe={selectedRecipe}
              onFavoriteToggle={() => handleFavoriteToggle(selectedRecipe.id)}
              onShare={() => console.log('Share recipe')}
              onEdit={() => console.log('Edit recipe')}
            />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <MainApp />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
