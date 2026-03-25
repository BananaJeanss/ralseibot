import express, { Request, Response } from "express";
import path from "node:path";
import { ExpressRequestTime } from "../metrics";

const app = express();
const PORT = Bun.env.EXPRESS_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "static", "public")));
// prometheus
app.use((req, res, next) => {
  const end = ExpressRequestTime.startTimer({
    method: req.method,
    route: req.path,
  });
  res.on("finish", () => {
    end({ status_code: res.statusCode });
  });
  next();
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "static", "public", "index.html"));
});

// TOS route
app.get("/terms", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "static", "public", "terms.html"));
});

// Privacy Policy route
app.get("/privacy", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "static", "public", "privacy.html"));
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export function startServer() {
  return new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      console.log(`🌐 Express server running on http://localhost:${PORT}`);
      resolve();
    });
  });
}

export { app };
