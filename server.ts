import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // INMET API Proxy Route
  app.get("/api/inmet/*", async (req, res) => {
    try {
      const inmetPath = req.params[0];
      const inmetUrl = `https://apitempo.inmet.gov.br/${inmetPath}`;
      
      const inmetRes = await fetch(inmetUrl);
      if (!inmetRes.ok) {
        return res.status(inmetRes.status).send(await inmetRes.text());
      }
      
      const data = await inmetRes.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error proxying INMET API:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

  // IBGE API Proxy Route
  app.get("/api/ibge/*", async (req, res) => {
    try {
      const ibgePath = req.params[0];
      const ibgeUrl = `https://servicodados.ibge.gov.br/${ibgePath}`;
      
      const ibgeRes = await fetch(ibgeUrl);
      if (!ibgeRes.ok) {
        return res.status(ibgeRes.status).send(await ibgeRes.text());
      }
      
      const data = await ibgeRes.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error proxying IBGE API:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
