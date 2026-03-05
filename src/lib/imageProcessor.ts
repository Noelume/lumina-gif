/**
 * Advanced Image processing for Lumina Studio
 * Optimized for "One Last Kiss" aesthetic with vibrant chromatic aberration
 * and cinematic pencil-sketch textures.
 */

import { applyOneLastKissFilter as itorrFilter, OneLastKissConfig } from './oneLastKiss';

export type OneLastKissOptions = OneLastKissConfig;

/**
 * Applies a sophisticated cinematic sketch filter using itorr's logic.
 */
export function applyOneLastKissFilter(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: OneLastKissOptions
) {
  itorrFilter(ctx, canvas.width, canvas.height, options);
}

export async function processImage(
  file: File,
  width: number = 1080,
  options: OneLastKissOptions
): Promise<string> {
  // Load assets first
  const [pencilTexture, watermarkImage] = await Promise.all([
    loadImage('/assets/pencil-texture.jpg'),
    loadImage('/assets/one-last-image-logo2.png')
  ]);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const height = (img.height / img.width) * width;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      applyOneLastKissFilter(canvas, ctx, {
        ...options,
        pencilTexture,
        watermarkImage
      });
      
      canvas.toBlob((blob) => resolve(URL.createObjectURL(blob!)), 'image/png');
    };
    img.src = url;
    img.onerror = reject;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
