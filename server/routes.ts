import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema, insertIngredientSchema, insertUserSchema, signupSchema } from "@shared/schema";
import { requireAuth } from "./middleware/auth";
import { z } from "zod";
import bcrypt from "bcrypt";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Cloud Run and deployment platforms
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Object Storage routes
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/recipes/:id/image", requireAuth, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }
    const userId = req.session.userId;
    if (!userId) {
      return res.sendStatus(401);
    }
    try {
      const recipe = await storage.getRecipe(req.params.id, userId);
      if (!recipe) {
        return res.sendStatus(404);
      }
      if (recipe.userId !== userId) {
        return res.sendStatus(403);
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        },
      );
      await storage.updateRecipeImage(req.params.id, objectPath);
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting recipe image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const { email, password, displayName } = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ 
        email, 
        displayName,
        photoURL: null,
        passwordHash,
      });
      
      req.session.userId = user.id;
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName 
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/signin", async (req, res, next) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName 
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/signout", async (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to sign out" });
        }
        res.json({ message: "Signed out successfully" });
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/session", async (req, res, next) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName 
      });
    } catch (error) {
      next(error);
    }
  });

  // User routes
  app.post("/api/users", requireAuth, async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  // Recipe routes
  app.get("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const { type, userId } = req.query;
      
      let recipes;
      if (type === 'my-recipes' && userId) {
        recipes = await storage.getRecipesByUser(userId as string);
      } else if (type === 'favorites' && userId) {
        recipes = await storage.getFavoritedRecipes(userId as string);
      } else if (type === 'shared' && req.query.email) {
        recipes = await storage.getSharedRecipes(req.query.email as string);
      } else {
        recipes = await storage.getPublicRecipes(userId as string);
      }
      
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = req.query.userId as string | undefined;
      const recipe = await storage.getRecipe(req.params.id, userId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const { ingredients, photos, ...recipeData } = req.body;
      
      const validatedRecipe = insertRecipeSchema.parse(recipeData);
      const recipe = await storage.createRecipe(validatedRecipe);

      // Create ingredients
      if (ingredients && Array.isArray(ingredients)) {
        for (let i = 0; i < ingredients.length; i++) {
          const ingredient = ingredients[i];
          await storage.createIngredient({
            ...ingredient,
            recipeId: recipe.id,
            order: i,
          });
        }
      }

      // Create photos
      if (photos && Array.isArray(photos)) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          await storage.createRecipePhoto({
            recipeId: recipe.id,
            imageUrl: photo,
            order: i,
          });
        }
      }

      const fullRecipe = await storage.getRecipe(recipe.id, recipeData.userId);
      res.json(fullRecipe);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const { ingredients, photos, ...recipeData } = req.body;
      
      const recipe = await storage.updateRecipe(req.params.id, recipeData);

      // Update ingredients if provided
      if (ingredients && Array.isArray(ingredients)) {
        await storage.deleteIngredientsByRecipe(recipe.id);
        for (let i = 0; i < ingredients.length; i++) {
          const ingredient = ingredients[i];
          await storage.createIngredient({
            ...ingredient,
            recipeId: recipe.id,
            order: i,
          });
        }
      }

      const fullRecipe = await storage.getRecipe(recipe.id, recipeData.userId);
      res.json(fullRecipe);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteRecipe(req.params.id);
      res.json({ message: "Recipe deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Favorite routes
  app.post("/api/recipes/:id/favorite", requireAuth, async (req, res, next) => {
    try {
      const { userId } = req.body;
      const result = await storage.toggleFavorite(userId, req.params.id);
      const count = await storage.getFavoriteCount(req.params.id);
      res.json({ ...result, favoriteCount: count });
    } catch (error) {
      next(error);
    }
  });

  // Share route
  app.post("/api/recipes/:id/share", requireAuth, async (req, res, next) => {
    try {
      const { email } = req.body;
      const shared = await storage.shareRecipe(req.params.id, email);
      res.json(shared);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
