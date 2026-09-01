import sharp from "sharp";

async function offsetImage(buffer: Buffer, size: number): Promise<Buffer> {
  const half = size / 2;
  const source = sharp(buffer);

  const topLeft = await source
    .clone()
    .extract({ left: 0, top: 0, width: half, height: half })
    .toBuffer();
  const topRight = await source
    .clone()
    .extract({ left: half, top: 0, width: half, height: half })
    .toBuffer();
  const bottomLeft = await source
    .clone()
    .extract({ left: 0, top: half, width: half, height: half })
    .toBuffer();
  const bottomRight = await source
    .clone()
    .extract({ left: half, top: half, width: half, height: half })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: bottomRight, left: 0, top: 0 },
      { input: bottomLeft, left: half, top: 0 },
      { input: topRight, left: 0, top: half },
      { input: topLeft, left: half, top: half },
    ])
    .png()
    .toBuffer();
}

function buildSeamMask(size: number, featherPx: number): Buffer {
  const mask = Buffer.alloc(size * size);
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - center);
      const dy = Math.abs(y - center);
      const alphaX = Math.max(0, 1 - dx / featherPx);
      const alphaY = Math.max(0, 1 - dy / featherPx);
      const alpha = Math.max(alphaX, alphaY);
      mask[y * size + x] = Math.round(alpha * 255);
    }
  }

  return mask;
}

export async function makeSeamless(
  base64Image: string,
  size = 512,
  featherPx = 40,
): Promise<string> {
  const inputBuffer = Buffer.from(base64Image, "base64");

  const offset = await offsetImage(inputBuffer, size);

  const blurred = await sharp(offset).blur(12).toBuffer();
  const blurredNoAlpha = await sharp(blurred).removeAlpha().toBuffer();
  const mask = buildSeamMask(size, featherPx);

  const blurredWithMask = await sharp(blurredNoAlpha)
    .joinChannel(mask, { raw: { width: size, height: size, channels: 1 } })
    .png()
    .toBuffer();

  const result = await sharp(offset)
    .composite([{ input: blurredWithMask }])
    .png()
    .toBuffer();

  return result.toString("base64");
}
