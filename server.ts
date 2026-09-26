import express from "express";
import path from "path";
import app from "./api/index.ts";

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ahmed Home Decoration server running on port ${PORT}`);
  });
}

// Only launch standalone listener when run directly (not inside Vercel serverless)
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
