import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { neon } from "@neondatabase/serverless";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { verifyFirebaseToken } from './middleware/verifyFirebaseToken';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session store
app.use(
  session({
    secret: 'your-secret-key', // Change this to a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);

// Accept Firebase ID tokens in Authorization header and populate session when present
app.use(verifyFirebaseToken as any);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Special route to force cache clear
app.get('/clear-cache', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Cloud Run and other deployment platforms provide PORT dynamically
  // Default to 5000 for local development only
  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
