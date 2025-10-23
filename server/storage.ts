import { 
  type User, type InsertUser,
  type Recipe, type InsertRecipe, type RecipeWithDetails,
  type Ingredient, type InsertIngredient,
  type Favorite, type InsertFavorite,
  type SharedRecipe, type InsertSharedRecipe,
  type RecipePhoto, type InsertRecipePhoto
} from "@shared/schema";
import { db } from "./db";

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

export class FirestoreStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    await db.collection('users').doc(id).set(user);
    return { id, ...user } as User;
  }

  // Recipes
  async getRecipe(id: string, userId?: string): Promise<RecipeWithDetails | undefined> {
    const recipeDoc = await db.collection('recipes').doc(id).get();
    if (!recipeDoc.exists) return undefined;
    const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;

    const ingredientsSnapshot = await db.collection('ingredients').where('recipeId', '==', id).orderBy('order').get();
    const ingredients = ingredientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ingredient[];

    const photosSnapshot = await db.collection('recipePhotos').where('recipeId', '==', id).get();
    const photos = photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecipePhoto[];

    const authorDoc = await db.collection('users').doc(recipe.userId).get();
    const author = authorDoc.exists ? { id: authorDoc.id, displayName: authorDoc.data()?.displayName, photoURL: authorDoc.data()?.photoURL } : undefined;

    const favoriteCount = await this.getFavoriteCount(id);

    let isFavorited = false;
    if (userId) {
      const favoriteSnapshot = await db.collection('favorites').where('userId', '==', userId).where('recipeId', '==', id).get();
      isFavorited = !favoriteSnapshot.empty;
    }

    return {
      ...recipe,
      ingredients,
      photos,
      author: author!,
      favoriteCount,
      isFavorited,
    };
  }

  async getRecipesByUser(userId: string): Promise<RecipeWithDetails[]> {
    const snapshot = await db.collection('recipes').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    const recipeIds = snapshot.docs.map(doc => doc.id);
    const results = await Promise.all(recipeIds.map(id => this.getRecipe(id, userId)));
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async getPublicRecipes(userId?: string): Promise<RecipeWithDetails[]> {
    const snapshot = await db.collection('recipes').where('isPrivate', '==', false).orderBy('createdAt', 'desc').get();
    const recipeIds = snapshot.docs.map(doc => doc.id);
    const results = await Promise.all(recipeIds.map(id => this.getRecipe(id, userId)));
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async getFavoritedRecipes(userId: string): Promise<RecipeWithDetails[]> {
    const snapshot = await db.collection('favorites').where('userId', '==', userId).get();
    const recipeIds = snapshot.docs.map(doc => doc.data().recipeId);
    const results = await Promise.all(recipeIds.map(id => this.getRecipe(id, userId)));
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async getSharedRecipes(email: string): Promise<RecipeWithDetails[]> {
    const snapshot = await db.collection('sharedRecipes').where('sharedWithEmail', '==', email).get();
    const recipeIds = snapshot.docs.map(doc => doc.data().recipeId);
    const results = await Promise.all(recipeIds.map(id => this.getRecipe(id)));
    return results.filter((r): r is RecipeWithDetails => r !== undefined);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = crypto.randomUUID();
    await db.collection('recipes').doc(id).set(recipe);
    return { id, ...recipe } as Recipe;
  }

  async updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe> {
    await db.collection('recipes').doc(id).update({ ...recipe, updatedAt: new Date() });
    const doc = await db.collection('recipes').doc(id).get();
    return { id: doc.id, ...doc.data() } as Recipe;
  }

  async updateRecipeImage(id: string, imageUrl: string): Promise<void> {
    await db.collection('recipes').doc(id).update({ imageUrl, updatedAt: new Date() });
  }

  async deleteRecipe(id: string): Promise<void> {
    await db.collection('recipes').doc(id).delete();
  }

  // Ingredients
  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const id = crypto.randomUUID();
    await db.collection('ingredients').doc(id).set(ingredient);
    return { id, ...ingredient } as Ingredient;
  }

  async updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient> {
    await db.collection('ingredients').doc(id).update(ingredient);
    const doc = await db.collection('ingredients').doc(id).get();
    return { id: doc.id, ...doc.data() } as Ingredient;
  }

  async deleteIngredient(id: string): Promise<void> {
    await db.collection('ingredients').doc(id).delete();
  }

  async deleteIngredientsByRecipe(recipeId: string): Promise<void> {
    const snapshot = await db.collection('ingredients').where('recipeId', '==', recipeId).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  // Favorites
  async toggleFavorite(userId: string, recipeId: string): Promise<{ isFavorited: boolean }> {
    const snapshot = await db.collection('favorites').where('userId', '==', userId).where('recipeId', '==', recipeId).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.delete();
      return { isFavorited: false };
    } else {
      const id = crypto.randomUUID();
      await db.collection('favorites').doc(id).set({ userId, recipeId });
      return { isFavorited: true };
    }
  }

  async getFavoriteCount(recipeId: string): Promise<number> {
    const snapshot = await db.collection('favorites').where('recipeId', '==', recipeId).get();
    return snapshot.size;
  }

  // Sharing
  async shareRecipe(recipeId: string, email: string): Promise<SharedRecipe> {
    const id = crypto.randomUUID();
    await db.collection('sharedRecipes').doc(id).set({ recipeId, sharedWithEmail: email });
    return { id, recipeId, sharedWithEmail: email } as SharedRecipe;
  }

  // Photos
  async createRecipePhoto(photo: InsertRecipePhoto): Promise<RecipePhoto> {
    const id = crypto.randomUUID();
    await db.collection('recipePhotos').doc(id).set(photo);
    return { id, ...photo } as RecipePhoto;
  }

  async deleteRecipePhoto(id: string): Promise<void> {
    await db.collection('recipePhotos').doc(id).delete();
  }
}

export const storage = new FirestoreStorage();
