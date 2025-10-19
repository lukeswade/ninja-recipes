import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipes table
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  prepTime: text("prep_time").notNull(),
  servings: integer("servings").notNull(),
  directions: text("directions").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  amount: text("amount").notNull(),
  measurement: text("measurement").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  link: text("link"),
  order: integer("order").notNull().default(0),
});

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shared recipes table - for private recipe sharing
export const sharedRecipes = pgTable("shared_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  sharedWithEmail: text("shared_with_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipe photos table
export const recipePhotos = pgTable("recipe_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Auth schema for signup
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSharedRecipeSchema = createInsertSchema(sharedRecipes).omit({
  id: true,
  createdAt: true,
});

export const insertRecipePhotoSchema = createInsertSchema(recipePhotos).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertSharedRecipe = z.infer<typeof insertSharedRecipeSchema>;
export type SharedRecipe = typeof sharedRecipes.$inferSelect;

export type InsertRecipePhoto = z.infer<typeof insertRecipePhotoSchema>;
export type RecipePhoto = typeof recipePhotos.$inferSelect;

// Extended recipe type with relations
export type RecipeWithDetails = Recipe & {
  ingredients: Ingredient[];
  photos: RecipePhoto[];
  author: User;
  favoriteCount: number;
  isFavorited: boolean;
};
