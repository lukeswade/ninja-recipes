var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
var vite_config_exports = {};
__export(vite_config_exports, {
  default: () => vite_config_default
});
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
var vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react()
        // no replit-specific plugins
      ],
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets")
        }
      },
      root: path.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/index.ts
import express2 from "express";
import session from "express-session";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import admin2 from "firebase-admin";

// server/firebaseAdmin.ts
import admin from "firebase-admin";
var initialized = false;
function initFirebaseAdminFromEnv() {
  if (initialized) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(svc),
        projectId: svc.project_id || process.env.FIREBASE_PROJECT_ID
      });
      initialized = true;
      console.log("Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp();
      initialized = true;
      console.log("Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS");
    } catch (e) {
      console.error("Failed to initialize firebase-admin:", e);
    }
  }
}
async function verifyIdToken(idToken) {
  initFirebaseAdminFromEnv();
  if (!initialized) {
    throw new Error("Firebase Admin not initialized");
  }
  return admin.auth().verifyIdToken(idToken);
}

// server/db.ts
var _db = null;
function ensureDb() {
  if (_db) return _db;
  try {
    initFirebaseAdminFromEnv();
    _db = admin2.firestore();
    return _db;
  } catch (err) {
    return null;
  }
}
var db = new Proxy({}, {
  get(_target, prop) {
    const real = ensureDb();
    if (!real) {
      throw new Error("Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.");
    }
    const val = real[prop];
    if (typeof val === "function") return val.bind(real);
    return val;
  }
});

// server/storage.ts
var FirestoreStorage = class {
  // Users
  async getUser(id) {
    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists) return void 0;
    return { id: doc.id, ...doc.data() };
  }
  async getUserByEmail(email) {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) return void 0;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  async createUser(user) {
    const id = crypto.randomUUID();
    await db.collection("users").doc(id).set(user);
    return { id, ...user };
  }
  // Recipes
  async getRecipe(id, userId) {
    const recipeDoc = await db.collection("recipes").doc(id).get();
    if (!recipeDoc.exists) return void 0;
    const recipe = { id: recipeDoc.id, ...recipeDoc.data() };
    const ingredientsSnapshot = await db.collection("ingredients").where("recipeId", "==", id).orderBy("order").get();
    const ingredients2 = ingredientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const photosSnapshot = await db.collection("recipePhotos").where("recipeId", "==", id).get();
    const photos = photosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const authorDoc = await db.collection("users").doc(recipe.userId).get();
    const author = authorDoc.exists ? { id: authorDoc.id, displayName: authorDoc.data()?.displayName, photoURL: authorDoc.data()?.photoURL } : void 0;
    const favoriteCount = await this.getFavoriteCount(id);
    let isFavorited = false;
    if (userId) {
      const favoriteSnapshot = await db.collection("favorites").where("userId", "==", userId).where("recipeId", "==", id).get();
      isFavorited = !favoriteSnapshot.empty;
    }
    return {
      ...recipe,
      ingredients: ingredients2,
      photos,
      author,
      favoriteCount,
      isFavorited
    };
  }
  async getRecipesByUser(userId) {
    const snapshot = await db.collection("recipes").where("userId", "==", userId).orderBy("createdAt", "desc").get();
    const recipeIds = snapshot.docs.map((doc) => doc.id);
    const results = await Promise.all(recipeIds.map((id) => this.getRecipe(id, userId)));
    return results.filter((r) => r !== void 0);
  }
  async getPublicRecipes(userId) {
    const snapshot = await db.collection("recipes").where("isPrivate", "==", false).orderBy("createdAt", "desc").get();
    const recipeIds = snapshot.docs.map((doc) => doc.id);
    const results = await Promise.all(recipeIds.map((id) => this.getRecipe(id, userId)));
    return results.filter((r) => r !== void 0);
  }
  async getFavoritedRecipes(userId) {
    const snapshot = await db.collection("favorites").where("userId", "==", userId).get();
    const recipeIds = snapshot.docs.map((doc) => doc.data().recipeId);
    const results = await Promise.all(recipeIds.map((id) => this.getRecipe(id, userId)));
    return results.filter((r) => r !== void 0);
  }
  async getSharedRecipes(email) {
    const snapshot = await db.collection("sharedRecipes").where("sharedWithEmail", "==", email).get();
    const recipeIds = snapshot.docs.map((doc) => doc.data().recipeId);
    const results = await Promise.all(recipeIds.map((id) => this.getRecipe(id)));
    return results.filter((r) => r !== void 0);
  }
  async createRecipe(recipe) {
    const id = crypto.randomUUID();
    await db.collection("recipes").doc(id).set(recipe);
    return { id, ...recipe };
  }
  async updateRecipe(id, recipe) {
    await db.collection("recipes").doc(id).update({ ...recipe, updatedAt: /* @__PURE__ */ new Date() });
    const doc = await db.collection("recipes").doc(id).get();
    return { id: doc.id, ...doc.data() };
  }
  async updateRecipeImage(id, imageUrl) {
    await db.collection("recipes").doc(id).update({ imageUrl, updatedAt: /* @__PURE__ */ new Date() });
  }
  async deleteRecipe(id) {
    await db.collection("recipes").doc(id).delete();
  }
  // Ingredients
  async createIngredient(ingredient) {
    const id = crypto.randomUUID();
    await db.collection("ingredients").doc(id).set(ingredient);
    return { id, ...ingredient };
  }
  async updateIngredient(id, ingredient) {
    await db.collection("ingredients").doc(id).update(ingredient);
    const doc = await db.collection("ingredients").doc(id).get();
    return { id: doc.id, ...doc.data() };
  }
  async deleteIngredient(id) {
    await db.collection("ingredients").doc(id).delete();
  }
  async deleteIngredientsByRecipe(recipeId) {
    const snapshot = await db.collection("ingredients").where("recipeId", "==", recipeId).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  // Favorites
  async toggleFavorite(userId, recipeId) {
    const snapshot = await db.collection("favorites").where("userId", "==", userId).where("recipeId", "==", recipeId).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.delete();
      return { isFavorited: false };
    } else {
      const id = crypto.randomUUID();
      await db.collection("favorites").doc(id).set({ userId, recipeId });
      return { isFavorited: true };
    }
  }
  async getFavoriteCount(recipeId) {
    const snapshot = await db.collection("favorites").where("recipeId", "==", recipeId).get();
    return snapshot.size;
  }
  // Sharing
  async shareRecipe(recipeId, email) {
    const id = crypto.randomUUID();
    await db.collection("sharedRecipes").doc(id).set({ recipeId, sharedWithEmail: email });
    return { id, recipeId, sharedWithEmail: email };
  }
  // Photos
  async createRecipePhoto(photo) {
    const id = crypto.randomUUID();
    await db.collection("recipePhotos").doc(id).set(photo);
    return { id, ...photo };
  }
  async deleteRecipePhoto(id) {
    await db.collection("recipePhotos").doc(id).delete();
  }
};
var storage = new FirestoreStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  prepTime: text("prep_time").notNull(),
  servings: integer("servings").notNull(),
  directions: text("directions").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(),
  measurement: text("measurement").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  link: text("link"),
  order: integer("order").notNull().default(0)
});
var favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var sharedRecipes = pgTable("shared_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  sharedWithEmail: text("shared_with_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var recipePhotos = pgTable("recipe_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional()
});
var insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var insertSharedRecipeSchema = createInsertSchema(sharedRecipes).omit({
  id: true,
  createdAt: true
});
var insertRecipePhotoSchema = createInsertSchema(recipePhotos).omit({
  id: true,
  createdAt: true
});

// server/middleware/auth.ts
async function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// server/routes.ts
import { z as z2 } from "zod";
import bcrypt from "bcrypt";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
var logger = {
  info: (...args) => console.info(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  debug: (...args) => console.debug ? console.debug(...args) : console.log(...args)
};
var storage2 = null;
var DEFAULT_BUCKET = process.env.STORAGE_BUCKET || "creamininja.appspot.com";
var ObjectNotFoundError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ObjectNotFoundError";
  }
};
function getStorage() {
  if (storage2) {
    return storage2;
  }
  storage2 = new Storage();
  logger.info("Using default Google Cloud Storage client");
  return storage2;
}
function getBucketName() {
  return DEFAULT_BUCKET;
}
async function generateV4ReadSignedUrl(objectName) {
  const bucketName = getBucketName();
  const client = getStorage();
  const options = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1e3
    // 15 minutes
  };
  try {
    const [url] = await client.bucket(bucketName).file(objectName).getSignedUrl(options);
    return url;
  } catch (err) {
    logger.error(`Failed to generate signed URL for object: ${objectName}`, err);
    throw err;
  }
}
var ObjectStorageService = {
  generateV4ReadSignedUrl
};

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app2.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app2.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: "read" /* READ */
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
  app2.post("/api/objects/upload", requireAuth, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });
  app2.put("/api/recipes/:id/image", requireAuth, async (req, res) => {
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
          visibility: "public"
        }
      );
      await storage.updateRecipeImage(req.params.id, objectPath);
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting recipe image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/signup", async (req, res, next) => {
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
        passwordHash
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
  app2.post("/api/auth/signin", async (req, res, next) => {
    try {
      const { email, password } = z2.object({
        email: z2.string().email(),
        password: z2.string()
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
  app2.post("/api/auth/signout", async (req, res, next) => {
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
  app2.get("/api/auth/session", async (req, res, next) => {
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
  app2.post("/api/users", requireAuth, async (req, res, next) => {
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
  app2.get("/api/users/:id", async (req, res, next) => {
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
  app2.get("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const { type, userId } = req.query;
      let recipes2;
      if (type === "my-recipes" && userId) {
        recipes2 = await storage.getRecipesByUser(userId);
      } else if (type === "favorites" && userId) {
        recipes2 = await storage.getFavoritedRecipes(userId);
      } else if (type === "shared" && req.query.email) {
        recipes2 = await storage.getSharedRecipes(req.query.email);
      } else {
        recipes2 = await storage.getPublicRecipes(userId);
      }
      res.json(recipes2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = req.query.userId;
      const recipe = await storage.getRecipe(req.params.id, userId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const { ingredients: ingredients2, photos, ...recipeData } = req.body;
      const validatedRecipe = insertRecipeSchema.parse(recipeData);
      const recipe = await storage.createRecipe(validatedRecipe);
      if (ingredients2 && Array.isArray(ingredients2)) {
        for (let i = 0; i < ingredients2.length; i++) {
          const ingredient = ingredients2[i];
          await storage.createIngredient({
            ...ingredient,
            recipeId: recipe.id,
            order: i
          });
        }
      }
      if (photos && Array.isArray(photos)) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          await storage.createRecipePhoto({
            recipeId: recipe.id,
            imageUrl: photo,
            order: i
          });
        }
      }
      const fullRecipe = await storage.getRecipe(recipe.id, recipeData.userId);
      res.json(fullRecipe);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const { ingredients: ingredients2, photos, ...recipeData } = req.body;
      const recipe = await storage.updateRecipe(req.params.id, recipeData);
      if (ingredients2 && Array.isArray(ingredients2)) {
        await storage.deleteIngredientsByRecipe(recipe.id);
        for (let i = 0; i < ingredients2.length; i++) {
          const ingredient = ingredients2[i];
          await storage.createIngredient({
            ...ingredient,
            recipeId: recipe.id,
            order: i
          });
        }
      }
      const fullRecipe = await storage.getRecipe(recipe.id, recipeData.userId);
      res.json(fullRecipe);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteRecipe(req.params.id);
      res.json({ message: "Recipe deleted" });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/recipes/:id/favorite", requireAuth, async (req, res, next) => {
    try {
      const { userId } = req.body;
      const result = await storage.toggleFavorite(userId, req.params.id);
      const count = await storage.getFavoriteCount(req.params.id);
      res.json({ ...result, favoriteCount: count });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/recipes/:id/share", requireAuth, async (req, res, next) => {
    try {
      const { email } = req.body;
      const shared = await storage.shareRecipe(req.params.id, email);
      res.json(shared);
    } catch (error) {
      next(error);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { nanoid } from "nanoid";
var viteLogger = null;
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const [{ createServer: createViteServer, createLogger }, viteConfig] = await Promise.all([
    import("vite"),
    Promise.resolve().then(() => (init_vite_config(), vite_config_exports))
  ]);
  viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...viteConfig && viteConfig.default || viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/middleware/verifyFirebaseToken.ts
async function verifyFirebaseToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return next();
  const token = auth.split(" ")[1];
  try {
    const decoded = await verifyIdToken(token);
    req.firebaseUser = decoded;
    if (!req.session.userId && decoded.uid) {
      req.session.userId = decoded.uid;
    }
    return next();
  } catch (err) {
    console.warn("Failed to verify firebase token (ignoring and continuing):", err);
    return next();
  }
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(
  session({
    secret: "your-secret-key",
    // Change this to a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
    // Set to true in production with HTTPS
  })
);
app.use(verifyFirebaseToken);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app.get("/clear-cache", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Clearing Cache</title></head>
    <body>
      <h1>Clearing all caches...</h1>
      <script>
        async function clearEverything() {
          // Unregister all service workers
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
              console.log('Unregistering:', reg);
              await reg.unregister();
            }
          }
          
          // Delete all caches
          if ('caches' in window) {
            const keys = await caches.keys();
            for (const key of keys) {
              console.log('Deleting cache:', key);
              await caches.delete(key);
            }
          }
          
          alert('Cache cleared! Redirecting to home...');
          window.location.href = '/';
        }
        clearEverything();
      </script>
    </body>
    </html>
  `);
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
