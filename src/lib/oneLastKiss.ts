/**
 * @author itorr<https://github.com/itorr>
 * @date 2022-06-01
 * @Description One Last Image (Ported to TypeScript for Lumina GIF Studio)
 * */

export interface OneLastKissConfig {
  zoom: number;
  light: number;
  shadeLimit: number;
  shadeLight: number;
  shade: boolean;
  kuma: boolean;
  hajimei: boolean;
  watermark: boolean;
  convoluteName: string;
  convolute1Diff: boolean;
  convoluteName2: string | null;
  lightCut: number;
  darkCut: number;
  denoise: boolean;
  pencilTexture?: HTMLImageElement | HTMLCanvasElement;
  watermarkImage?: HTMLImageElement | HTMLCanvasElement;
}

const createConvoluteAverage = (w: number) => new Array(w * w).fill(1 / (w * w));

export const CONVOLUTES: Record<string, number[] | null> = {
  '线稿': createConvoluteAverage(3),
  '精细': createConvoluteAverage(5),
  '一般': createConvoluteAverage(7),
  '稍粗': createConvoluteAverage(9),
  '超粗': createConvoluteAverage(11),
  '极粗': createConvoluteAverage(13),
  '浮雕': [-2, -1, 0, -1, 1, 1, 0, 1, 2],
};

function applyConvolution(pixels: ImageData, weights: number[], ctx: CanvasRenderingContext2D): ImageData {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = pixels.data;
  const w = pixels.width;
  const h = pixels.height;
  const output = ctx.createImageData(w, h);
  const dst = output.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const offset = (y * w + x) * 4;
      let r = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const sy = Math.min(h - 1, Math.max(0, y + cy - halfSide));
          const sx = Math.min(w - 1, Math.max(0, x + cx - halfSide));
          r += src[(sy * w + sx) * 4] * weights[cy * side + cx];
        }
      }
      dst[offset] = dst[offset+1] = dst[offset+2] = Math.min(255, Math.max(0, r));
      dst[offset+3] = 255;
    }
  }
  return output;
}

export function applyOneLastKissFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: OneLastKissConfig
) {
  const _width = width;
  const _height = height;

  const sourcePixel = ctx.getImageData(0, 0, _width, _height);
  const grayPixel = ctx.createImageData(_width, _height);
  for (let i = 0; i < sourcePixel.data.length; i += 4) {
    const y = Math.floor(sourcePixel.data[i] * 0.299 + sourcePixel.data[i+1] * 0.587 + sourcePixel.data[i+2] * 0.114);
    grayPixel.data[i] = grayPixel.data[i+1] = grayPixel.data[i+2] = y;
    grayPixel.data[i+3] = 255;
  }

  let working = grayPixel;
  
  if (config.denoise) {
    working = applyConvolution(working, [1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9], ctx);
  }

  const matrix = CONVOLUTES[config.convoluteName];
  if (matrix && config.convolute1Diff) {
    const blurred = applyConvolution(working, matrix, ctx);
    const diff = ctx.createImageData(_width, _height);
    for (let i = 0; i < working.data.length; i += 4) {
      // Line art difference: 128 + original - blur
      const v = 128 + working.data[i] - blurred.data[i];
      diff.data[i] = diff.data[i+1] = diff.data[i+2] = v;
      diff.data[i+3] = 255;
    }
    working = diff;
  } else if (matrix) {
    working = applyConvolution(working, matrix, ctx);
  }

  if (config.lightCut || config.darkCut) {
    const cutSum = config.lightCut + config.darkCut;
    const scale = cutSum >= 255 ? 255 : 255 / (255 - cutSum);
    const cut = ctx.createImageData(_width, _height);
    for (let i = 0; i < working.data.length; i += 4) {
      const v = Math.min(255, Math.max(0, (working.data[i] - config.darkCut) * scale));
      cut.data[i] = cut.data[i+1] = cut.data[i+2] = v;
      cut.data[i+3] = 255;
    }
    working = cut;
  }

  let shadeMap: ImageData | null = null;
  if (config.shade && config.pencilTexture) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = _width; pCanvas.height = _height;
    const pCtx = pCanvas.getContext('2d')!;
    const pSize = Math.max(_width, _height);
    pCtx.drawImage(config.pencilTexture, 0, 0, 1200, 1200, 0, 0, pSize, pSize);
    const pPix = pCtx.getImageData(0, 0, _width, _height);

    const sCanvas = document.createElement('canvas');
    const sCtx = sCanvas.getContext('2d')!;
    sCanvas.width = _width; sCanvas.height = _height;
    const sPix = ctx.createImageData(_width, _height);
    for (let i = 0; i < grayPixel.data.length; i += 4) {
      sPix.data[i] = grayPixel.data[i] > config.shadeLimit ? 0 : 255;
      sPix.data[i+1] = sPix.data[i+2] = 128;
      sPix.data[i+3] = Math.floor(Math.random() * 255);
    }
    sCtx.putImageData(sPix, 0, 0);

    const sMin = document.createElement('canvas');
    sMin.width = Math.floor(_width/4); sMin.height = Math.floor(_height/4);
    sMin.getContext('2d')!.drawImage(sCanvas, 0, 0, sMin.width, sMin.height);
    sCtx.clearRect(0,0,_width,_height);
    sCtx.drawImage(sMin, 0, 0, _width, _height);
    shadeMap = sCtx.getImageData(0, 0, _width, _height);

    for (let i = 0; i < shadeMap.data.length; i += 4) {
      shadeMap.data[i] = Math.round((255 - pPix.data[i]) / 255 * shadeMap.data[i] / 255 * config.shadeLight);
    }
  }

  if (config.kuma) {
    const kCanvas = document.createElement('canvas');
    kCanvas.width = _width; kCanvas.height = _height;
    const kCtx = kCanvas.getContext('2d')!;
    const grad = kCtx.createLinearGradient(0, 0, _width, _height);
    grad.addColorStop(0, '#fbba30'); grad.addColorStop(0.4, '#fc7235');
    grad.addColorStop(0.6, '#fc354e'); grad.addColorStop(0.7, '#cf36df');
    grad.addColorStop(0.8, '#37b5d9'); grad.addColorStop(1, '#3eb6da');
    kCtx.fillStyle = grad; kCtx.fillRect(0,0,_width,_height);
    const kPix = kCtx.getImageData(0, 0, _width, _height);

    const isEmboss = config.convoluteName === '浮雕';
    const kumaFinal = ctx.createImageData(_width, _height);
    for (let i = 0; i < working.data.length; i += 4) {
      let a = 255 - working.data[i];
      if (shadeMap) a = Math.max(a, shadeMap.data[i]);
      
      if (isEmboss) {
        // Black background mode (Fix for JPEG/Opaque environments)
        const alpha = a / 255;
        kumaFinal.data[i] = Math.round(kPix.data[i] * alpha);
        kumaFinal.data[i+1] = Math.round(kPix.data[i+1] * alpha);
        kumaFinal.data[i+2] = Math.round(kPix.data[i+2] * alpha);
        kumaFinal.data[i+3] = 255;
      } else {
        // Original transparent mode
        kumaFinal.data[i] = kPix.data[i];
        kumaFinal.data[i+1] = kPix.data[i+1];
        kumaFinal.data[i+2] = kPix.data[i+2];
        kumaFinal.data[i+3] = a;
      }
    }
    working = kumaFinal;
  }

  ctx.clearRect(0, 0, _width, _height);
  ctx.putImageData(working, 0, 0);

  if (config.watermark && config.watermarkImage) {
    const wm = config.watermarkImage as any;
    const wmW = wm.naturalWidth || wm.width;
    const wmH = (wm.naturalHeight || wm.height) / 2;
    let sW = _width * 0.3; let sH = sW / wmW * wmH;
    if (_width / _height > 1.1) { sH = _height * 0.15; sW = sH / wmH * wmW; }
    ctx.drawImage(wm, 0, config.hajimei ? wmH : 0, wmW, wmH, _width - sW - sH*0.2, _height - sH - sH*0.16, sW, sH);
  }
}
