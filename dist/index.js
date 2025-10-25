// server/index.ts
import "dotenv/config";
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
initFirebaseAdminFromEnv();
var db = admin2.firestore();

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
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var logger = {
  info: (...args) => console.info(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  debug: (...args) => console.debug ? console.debug(...args) : console.log(...args)
};
var DEFAULT_BUCKET = process.env.GCLOUD_STORAGE_BUCKET ?? "ninja-recipes";
var storage2 = null;
function getStorage() {
  if (storage2) return storage2;
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svcJson) {
    try {
      const svc = JSON.parse(svcJson);
      storage2 = new Storage({ projectId: svc.project_id, credentials: svc });
      logger.info("Initialized Google Cloud Storage with service account credentials");
      return storage2;
    } catch (err) {
      logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back to default client", err);
    }
  }
  storage2 = new Storage();
  logger.info("Using default Google Cloud Storage client");
  return storage2;
}
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = getStorage().bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = getStorage().bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.startsWith("/")) {
      objectEntityDir = `/${objectEntityDir}`;
    }
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svcJson) {
    try {
      const storage3 = getStorage();
      const bucket = storage3.bucket(bucketName);
      const file = bucket.file(objectName);
      const action = method === "GET" ? "read" : method === "PUT" ? "write" : "delete";
      const [url] = await file.getSignedUrl({
        version: "v4",
        action,
        expires: Date.now() + ttlSec * 1e3
      });
      return url;
    } catch (err) {
      logger.error("Failed to generate GCS signed URL, falling back to sidecar", err);
    }
  }
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT not set or signing failed. Set FIREBASE_SERVICE_ACCOUNT to a service account JSON to enable GCS signed URLs."
  );
}

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
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
var vite_config_default = defineConfig({
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

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
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
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
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
