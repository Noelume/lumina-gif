import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export async function generateGif(
  videoFile: File,
  startTime: number,
  endTime: number,
  fps: number,
  targetWidth: number,
  onProgress: (progress: number) => void,
  filter?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.load();

    video.onloadedmetadata = async () => {
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      const targetHeight = Math.round((originalHeight / originalWidth) * targetWidth);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const gif = GIFEncoder();
      const delay = Math.round(1000 / fps);
      const totalFrames = Math.ceil((endTime - startTime) * fps);
      let currentFrame = 0;

      const processFrame = async () => {
        if (video.currentTime > endTime || currentFrame >= totalFrames) {
          gif.finish();
          const buffer = gif.bytes();
          const blob = new Blob([buffer], { type: 'image/gif' });
          resolve(URL.createObjectURL(blob));
          return;
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        if (filter) {
          filter(ctx, targetWidth, targetHeight);
        }

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;

        // Yield to main thread to allow UI updates
        await new Promise(r => setTimeout(r, 0));

        // Quantize and apply palette
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);

        gif.writeFrame(index, targetWidth, targetHeight, { palette, delay });

        currentFrame++;
        onProgress(currentFrame / totalFrames);

        // Advance to next frame
        const nextTime = video.currentTime + 1 / fps;
        if (nextTime > video.duration) {
          // Force finish if we exceed video duration
          gif.finish();
          const buffer = gif.bytes();
          const blob = new Blob([buffer], { type: 'image/gif' });
          resolve(URL.createObjectURL(blob));
          return;
        }
        video.currentTime = nextTime;
      };

      video.onseeked = processFrame;

      if (video.currentTime === startTime) {
        processFrame();
      } else {
        video.currentTime = startTime;
      }

      video.onerror = (e) => reject(e);
    };
  });
}
