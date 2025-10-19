import { 
  type User, type InsertUser,
  type Recipe, type InsertRecipe, type RecipeWithDetails,
  type Ingredient, type InsertIngredient,
  type Favorite, type InsertFavorite,
  type SharedRecipe, type InsertSharedRecipe,
  type RecipePhoto, type InsertRecipePhoto
} from "@shared/schema";
import { db } from "./db";
import { users, recipes, ingredients, favorites, sharedRecipes, recipePhotos } from "@shared/schema";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Recipes
  getRecipe(id: string, userId?: string): Promise<RecipeWithDetails | undefined>;
  getRecipesByUser(userId: string): Promise<RecipeWithDetails[]>;
  getPublicRecipes(userId?: string): Promise<RecipeWithDetails[]>;
  getFavoritedRecipes(userId: string): Promise<RecipeWithDetails[]>;
  getSharedRecipes(email: string): Promise<RecipeWithDetails[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe>;
  updateRecipeImage(id: string, imageUrl: string): Promise<void>;
  deleteRecipe(id: string): Promise<void>;

  // Ingredients
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient>;
  deleteIngredient(id: string): Promise<void>;
  deleteIngredientsByRecipe(recipeId: string): Promise<void>;

  // Favorites
  toggleFavorite(userId: string, recipeId: string): Promise<{ isFavorited: boolean }>;
  getFavoriteCount(recipeId: string): Promise<number>;

  // Sharing
  shareRecipe(recipeId: string, email: string): Promise<SharedRecipe>;
  
  // Photos
  createRecipePhoto(photo: InsertRecipePhoto): Promise<RecipePhoto>;
  deleteRecipePhoto(id: string): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Recipes
  async getRecipe(id: string, userId?: string): Promise<RecipeWithDetails | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (!recipe) return undefined;

    const recipeIngredients = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.recipeId, id))
      .orderBy(ingredients.order);

    const recipePhotosData = await db
      .select()
      .from(recipePhotos)
      .where(eq(recipePhotos.recipeId, id));

    const [author] = await db.select().from(users).where(eq(users.id, recipe.userId));
    const favoriteCount = await this.getFavoriteCount(id);

    let isFavorited = false;
    if (userId) {
      const [fav] = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.recipeId, id)));
      isFavorited = !!fav;
    }

    return {
      ...recipe,
      ingredients: recipeIngredients,
      photos: recipePhotosData,
      author: author!,
      favoriteCount,
      isFavorited,
    };
  }

  async getRecipesByUser(userId: string): Promise<RecipeWithDetails[]> {
    const userRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));

    const results = await Promise.all(
      userRecipes.map(r => this.getRecipe(r.id, userId))
    );
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async getPublicRecipes(userId?: string): Promise<RecipeWithDetails[]> {
    const publicRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.isPrivate, false))
      .orderBy(desc(recipes.createdAt));

    const results = await Promise.all(
      publicRecipes.map(r => this.getRecipe(r.id, userId))
    );
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async getFavoritedRecipes(userId: string): Promise<RecipeWithDetails[]> {
    const favs = await db
      .select({ recipeId: favorites.recipeId })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    const results = await Promise.all(
      favs.map(f => this.getRecipe(f.recipeId, userId))
    );
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async getSharedRecipes(email: string): Promise<RecipeWithDetails[]> {
    const shared = await db
      .select({ recipeId: sharedRecipes.recipeId })
      .from(sharedRecipes)
      .where(eq(sharedRecipes.sharedWithEmail, email));

    const results = await Promise.all(
      shared.map(s => this.getRecipe(s.recipeId))
    );
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  async updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe> {
    const [updated] = await db
      .update(recipes)
      .set({ ...recipe, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return updated;
  }

  async updateRecipeImage(id: string, imageUrl: string): Promise<void> {
    await db
      .update(recipes)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(recipes.id, id));
  }

  async deleteRecipe(id: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // Ingredients
  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [newIngredient] = await db.insert(ingredients).values(ingredient).returning();
    return newIngredient;
  }

  async updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient> {
    const [updated] = await db
      .update(ingredients)
      .set(ingredient)
      .where(eq(ingredients.id, id))
      .returning();
    return updated;
  }

  async deleteIngredient(id: string): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  async deleteIngredientsByRecipe(recipeId: string): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
  }

  // Favorites
  async toggleFavorite(userId: string, recipeId: string): Promise<{ isFavorited: boolean }> {
    const [existing] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId)));

    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      return { isFavorited: false };
    } else {
      await db.insert(favorites).values({ userId, recipeId });
      return { isFavorited: true };
    }
  }

  async getFavoriteCount(recipeId: string): Promise<number> {
    const result = await db
      .select({ count: drizzleSql<number>`count(*)::int` })
      .from(favorites)
      .where(eq(favorites.recipeId, recipeId));
    return result[0]?.count || 0;
  }

  // Sharing
  async shareRecipe(recipeId: string, email: string): Promise<SharedRecipe> {
    const [shared] = await db.insert(sharedRecipes).values({ recipeId, sharedWithEmail: email }).returning();
    return shared;
  }

  // Photos
  async createRecipePhoto(photo: InsertRecipePhoto): Promise<RecipePhoto> {
    const [newPhoto] = await db.insert(recipePhotos).values(photo).returning();
    return newPhoto;
  }

  async deleteRecipePhoto(id: string): Promise<void> {
    await db.delete(recipePhotos).where(eq(recipePhotos.id, id));
  }
}

export const storage = new DrizzleStorage();
