import { makeSeamless } from "./makeSeamless.js";

export async function generateTexture(prompt: string): Promise<string> {
  const response = await fetch("http://127.0.0.1:7860/sdapi/v1/txt2img", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${prompt}, seamless texture, tileable`,
      tiling: true,
      steps: 20,
      width: 1024,
      height: 1024,
    }),
  });

  const data = await response.json();
  return makeSeamless(data.images[0], 1024);
}
