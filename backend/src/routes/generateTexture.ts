import { Router } from "express";
import { generateTexture } from "../ai-service/generateTexture.js";

export const generateTextureRouter = Router();

generateTextureRouter.post("/generate-texture", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt" });
  }

  const image = await generateTexture(prompt);
  res.json({ image });
});
