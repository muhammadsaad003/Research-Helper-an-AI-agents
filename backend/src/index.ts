import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { articlesRouter } from "./routes/articles.js";
import { chatRouter } from "./routes/chat.js";
import { ensureDb } from "./storage/db.js";

dotenv.config();
ensureDb();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/articles", articlesRouter);
app.use("/api/chat", chatRouter);

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
