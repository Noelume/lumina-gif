import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Download, Loader2, Image as ImageIcon, Sun, Scissors, Droplets } from 'lucide-react';
import { cn } from '../lib/utils';
import { OneLastKissOptions, applyOneLastKissFilter } from '../lib/imageProcessor';
import { CONVOLUTES } from '../lib/oneLastKiss';

interface ImageEditorPreviewProps {
  imageFile: File;
  options: OneLastKissOptions;
}

export function ImageEditorPreview({ imageFile, options }: ImageEditorPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!imageFile) return;

    const timer = setTimeout(async () => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = async () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        const previewWidth = 800;
        const height = (img.height / img.width) * previewWidth;
        canvas.width = previewWidth; canvas.height = height;
        ctx.drawImage(img, 0, 0, previewWidth, height);

        const [pencilTexture, watermarkImage] = await Promise.all([
          loadImage('/assets/pencil-texture.jpg'),
          loadImage('/assets/one-last-image-logo2.png')
        ]);
        
        applyOneLastKissFilter(canvas, ctx, {
          ...options,
          pencilTexture,
          watermarkImage
        });
        setPreviewUrl(canvas.toDataURL());
      };
      img.src = url;
    }, 100);

    return () => clearTimeout(timer);
  }, [imageFile, options]);

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  return (
    <div className="relative w-full aspect-square max-w-xl bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center group">
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
      ) : imageUrl && (
        <img src={imageUrl} alt="Source" className="max-w-full max-h-full object-contain opacity-20 blur-sm" />
      )}
      <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 shadow-sm">
        <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">工作室画布</span>
      </div>
    </div>
  );
}

interface ImageEditorControlsProps {
  options: OneLastKissOptions;
  onGenerate: (width: number, options: OneLastKissOptions) => void;
  onOptionsChange: (options: OneLastKissOptions) => void;
  isGenerating: boolean;
}

export function ImageEditorControls({ options, onGenerate, onOptionsChange, isGenerating }: ImageEditorControlsProps) {
  const [width, setWidth] = useState<number>(1080);

  const updateOption = (key: keyof OneLastKissOptions, val: any) => {
    onOptionsChange({ ...options, [key]: val });
  };

  const SliderControl = ({ label, value, min, max, step, onChange, icon: Icon }: any) => {
    const [localValue, setLocalValue] = useState(value);
    useEffect(() => setLocalValue(value), [value]);

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />} {label}
          </label>
          <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{localValue}</span>
        </div>
        <div className="px-1">
          <Slider
            min={min} max={max} step={step} value={localValue}
            onChange={(v) => setLocalValue(v as number)}
            onChangeComplete={(v) => onChange(v as number)}
            trackStyle={[{ backgroundColor: '#3b82f6', height: 4 }]}
            handleStyle={[{ borderColor: '#3b82f6', backgroundColor: '#fff', width: 16, height: 16, marginTop: -6, opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }]}
            railStyle={{ backgroundColor: '#e5e7eb', height: 4 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 gap-6">
          <SliderControl label="深色切割" value={options.darkCut} min={80} max={126} step={1} onChange={(v: number) => updateOption('darkCut', v)} icon={Scissors} />
          <SliderControl label="阴影阈值" value={options.shadeLimit} min={20} max={200} step={1} onChange={(v: number) => updateOption('shadeLimit', v)} icon={Sun} />
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-gray-400" /> 线条粗细
          </label>
          <div className="grid grid-cols-4 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
            {Object.keys(CONVOLUTES).map((name) => (
              <button
                key={name}
                onClick={() => updateOption('convoluteName', name)}
                className={cn(
                  "py-2 rounded-lg text-[10px] font-bold transition-all duration-200",
                  options.convoluteName === name ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => updateOption('kuma', !options.kuma)} className={cn("py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all", options.kuma ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-gray-100 text-gray-400")}>Kuma 渐变</button>
          <button onClick={() => updateOption('denoise', !options.denoise)} className={cn("py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all", options.denoise ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-gray-100 text-gray-400")}>去噪处理</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => updateOption('watermark', !options.watermark)} className={cn("py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all", options.watermark ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-gray-100 text-gray-400")}>显示水印</button>
          <button onClick={() => updateOption('hajimei', !options.hajimei)} disabled={!options.watermark} className={cn("py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all", options.hajimei ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-gray-100 text-gray-400", !options.watermark && "opacity-30 cursor-not-allowed grayscale")}>初版限定</button>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">输出分辨率</label>
        <div className="flex gap-2">
          {[1080, 1920, 2560].map((v) => (
            <button key={v} onClick={() => setWidth(v)} className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all duration-200", width === v ? "bg-gray-800 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300")}>{v === 2560 ? '2K+' : v === 1920 ? '全高清' : '高清'}</button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onGenerate(width, options)}
        disabled={isGenerating}
        className="w-full py-6 rounded-2xl bg-blue-600 text-white text-[11px] uppercase tracking-[0.2em] font-black hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
      >
        {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> 正在合成</> : <><Download className="w-4 h-4" /> 开始渲染作品</>}
      </button>
    </div>
  );
}
