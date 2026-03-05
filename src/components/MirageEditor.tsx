import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Sun, Moon, Info, Upload, RefreshCw, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MirageEditorPreviewProps {
  topFile: File | null;
  bottomFile: File | null;
  onFileSelect: (file: File, target: 'top' | 'bottom') => void;
  onClear: (target: 'top' | 'bottom') => void;
}

export function MirageEditorPreview({ topFile, bottomFile, onFileSelect, onClear }: MirageEditorPreviewProps) {
  const [topUrl, setTopUrl] = useState<string | null>(null);
  const [bottomUrl, setBottomUrl] = useState<string | null>(null);

  useEffect(() => {
    let t: string | null = null;
    let b: string | null = null;
    if (topFile) {
      t = URL.createObjectURL(topFile);
      setTopUrl(t);
    } else {
      setTopUrl(null);
    }
    if (bottomFile) {
      b = URL.createObjectURL(bottomFile);
      setBottomUrl(b);
    } else {
      setBottomUrl(null);
    }
    return () => {
      if (t) URL.revokeObjectURL(t);
      if (b) URL.revokeObjectURL(b);
    };
  }, [topFile, bottomFile]);

  const Slot = ({ file, url, target, label, icon: Icon, description }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <Icon className={cn("w-4 h-4", target === 'top' ? "text-amber-500" : "text-blue-500")} /> 
            {label}
          </div>
          {file && (
            <button 
              onClick={() => onClear(target)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border border-transparent hover:border-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex-1 relative rounded-[32px] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden group flex flex-col items-center justify-center p-6 bg-gray-50/30",
            file 
              ? "border-gray-200 bg-white shadow-sm hover:shadow-md" 
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelect(f, target);
            }}
          />
          
          {url ? (
            <div className="absolute inset-4 flex items-center justify-center">
              <img 
                src={url} 
                className={cn(
                  "max-w-full max-h-full w-auto h-auto object-contain transition-all duration-700 rounded-xl shadow-sm",
                  target === 'top' ? "mix-blend-multiply" : "" 
                )} 
                style={target === 'top' ? { backgroundColor: 'white' } : { backgroundColor: '#0a0a0a' }}
                alt="Preview" 
              />
              <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm rounded-xl">
                <RefreshCw className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">更换媒体</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <Upload className="w-6 h-6 text-gray-300" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-600">{description}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">点击上传</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col p-4 lg:p-10 space-y-6 lg:space-y-10 min-h-0">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 min-h-0">
        <Slot 
          file={topFile} 
          url={topUrl} 
          target="top" 
          label="浅色背景显示内容" 
          icon={Sun} 
          description="表层图像"
        />
        <Slot 
          file={bottomFile} 
          url={bottomUrl} 
          target="bottom" 
          label="深色背景显示内容" 
          icon={Moon} 
          description="隐藏图像"
        />
      </div>
      
      <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black flex-shrink-0">
        <div className="w-6 lg:w-10 h-px bg-gray-200" />
        幻影坦克工作台
        <div className="w-6 lg:w-10 h-px bg-gray-200" />
      </div>
    </div>
  );
}

export function MirageEditorControls({ onGenerate, isGenerating, ready }: any) {
  return (
    <div className="space-y-6 lg:space-y-10">
      <div className="space-y-4 lg:space-y-6">
        {/* Synthesis Principle - High visibility refinement */}
        <div className="p-4 lg:p-6 rounded-2xl bg-blue-50 border border-blue-100 space-y-3 lg:space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <Info className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">合成原理</h3>
          </div>
          <p className="text-[11px] lg:text-[12px] text-blue-800 leading-relaxed font-medium">
            在上方上传两张图片。生成的单张 PNG 会根据背景色变化：在白色背景下显示表层图，黑色背景下显示隐藏图。
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">合成模式</div>
          <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-white text-blue-600 shadow-sm border border-gray-200">线性灰度解耦合成</button>
          </div>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !ready}
        className="w-full py-6 rounded-2xl bg-blue-600 text-white text-[11px] uppercase tracking-[0.2em] font-black hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            正在导出 PNG
          </>
        ) : (
          ready ? "生成幻影坦克" : "等待上传图片"
        )}
      </button>
    </div>
  );
}
