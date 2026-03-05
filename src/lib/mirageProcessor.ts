/**
 * Phantom Tank (黑白潜行) processing logic.
 * 
 * Algorithm:
 * To create an image that looks like Image A on a white background 
 * and Image B on a black background, we solve for Alpha and Color (Grey) 
 * for each pixel.
 * 
 * Let W be the light background (255), B be the dark background (0).
 * Let C_w be the desired color on White, C_b be the desired color on Black.
 * 
 * Result pixel (P_color, P_alpha):
 * P_alpha = 255 - (C_w - C_b)
 * P_color = C_b / (P_alpha / 255)
 */

export async function processMirageTank(
  topFile: File,
  bottomFile: File,
  width: number = 800
): Promise<string> {
  const [topImg, bottomImg] = await Promise.all([
    loadImage(URL.createObjectURL(topFile)),
    loadImage(URL.createObjectURL(bottomFile))
  ]);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Use dimensions of the top image as base
  const aspectRatio = topImg.height / topImg.width;
  const height = width * aspectRatio;
  canvas.width = width;
  canvas.height = height;

  // Draw and get data for both
  const topData = getImageData(topImg, width, height);
  const bottomData = getImageData(bottomImg, width, height);
  
  const resultData = ctx.createImageData(width, height);
  const data = resultData.data;

  for (let i = 0; i < data.length; i += 4) {
    /**
     * Algorithm Fix for Mirage Tank:
     * To ensure the images are decoupled:
     * - Dark (on black) should be the base color.
     * - Light (on white) should be the result of Dark + Alpha.
     * 
     * Correct linear solve:
     * Alpha = 255 - (Light - Dark)
     * Color = Dark * 255 / Alpha
     * 
     * To avoid "ghosting" (seeing light on dark), we MUST ensure 
     * Light >= Dark for all pixels.
     */
    let light = (topData[i] * 0.299 + topData[i+1] * 0.587 + topData[i+2] * 0.114);
    let dark = (bottomData[i] * 0.299 + bottomData[i+1] * 0.587 + bottomData[i+2] * 0.114);

    // Hard constraint: Light must be brighter than Dark to prevent ghosting
    // We adjust the dynamic range:
    // Dark: [0, 120] - Allows slightly more contrast for hidden content
    // Light: [130, 240] - Lowered the ceiling from 255 to 240 to reduce "too white" feeling
    dark = dark * 0.47; 
    light = 130 + light * 0.43; 

    const alpha = 255 - (light - dark);
    const color = (dark * 255) / alpha;

    data[i] = data[i+1] = data[i+2] = Math.min(255, color);
    data[i+3] = Math.min(255, alpha);
  }

  ctx.putImageData(resultData, 0, 0);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob!));
    }, 'image/png');
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function getImageData(img: HTMLImageElement, width: number, height: number): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height).data;
}
