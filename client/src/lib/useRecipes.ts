import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { RecipeWithDetails } from "@shared/schema";

export function useRecipes(type: 'my-recipes' | 'public' | 'favorites' | 'shared' = 'public') {
  const { user } = useAuth();

  return useQuery<RecipeWithDetails[]>({
    queryKey: ['/api/recipes', type, user?.uid],
    enabled: type !== 'my-recipes' || !!user,
  });
}

export function useRecipe(id: string) {
  const { user } = useAuth();

  return useQuery<RecipeWithDetails>({
    queryKey: ['/api/recipes', id, user?.uid],
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/recipes', { ...data, userId: user?.uid });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/recipes/${id}`, { ...data, userId: user?.uid });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/recipes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
    },
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const res = await apiRequest('POST', `/api/recipes/${recipeId}/favorite`, { userId: user?.uid });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
    },
  });
}

export function useShareRecipe() {
  return useMutation({
    mutationFn: async ({ recipeId, email }: { recipeId: string; email: string }) => {
      const res = await apiRequest('POST', `/api/recipes/${recipeId}/share`, { email });
      return res.json();
    },
  });
}
