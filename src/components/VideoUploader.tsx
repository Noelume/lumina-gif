import React, { useCallback, useState } from 'react';
import { UploadCloud, FileVideo, FileImage } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  activeFeature: 'gif' | 'cover' | 'mirage';
  isSecondFile?: boolean;
}

export function VideoUploader({ onFileSelect, activeFeature, isSecondFile }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('video/') || file.type.startsWith('image/'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && (file.type.startsWith('video/') || file.type.startsWith('image/'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg aspect-square relative group"
    >
      <div className={cn(
        "absolute inset-0 rounded-[40px] border-2 border-dashed transition-all duration-500 ease-in-out",
        isDragging 
          ? "border-blue-400 bg-blue-50/50 scale-102" 
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30 shadow-sm"
      )} />
      
      <input
        type="file"
        accept="video/*,image/*"
        onChange={handleChange}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 pointer-events-none">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: isDragging ? 1.1 : 1,
              y: isDragging ? -10 : 0
            }}
            className="w-24 h-24 rounded-3xl border border-gray-100 flex items-center justify-center bg-white shadow-xl group-hover:shadow-blue-100 transition-all duration-500"
          >
            <UploadCloud className={cn("w-10 h-10 transition-colors duration-500", isDragging ? "text-blue-500" : "text-gray-300 group-hover:text-gray-400")} strokeWidth={1.5} />
          </motion.div>
          
          <div className="absolute -top-3 -right-3 flex flex-col gap-2">
            {activeFeature === 'gif' && (
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                <FileVideo className="w-4 h-4 text-blue-500" />
              </div>
            )}
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
              <FileImage className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold tracking-tight text-gray-700">
            {activeFeature === 'mirage' 
              ? (isSecondFile ? '上传隐藏层图片' : '上传表层图片')
              : '将媒体文件拖拽至此'
            }
          </h3>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold max-w-[200px] leading-relaxed">
            {activeFeature === 'mirage'
              ? (isSecondFile ? '在黑色背景下显示' : '在白色背景下显示')
              : '支持视频与图像素材'
            }
          </p>
        </div>

        <div className="pt-4 flex gap-3 text-[10px] font-bold tracking-widest text-gray-300">
          {activeFeature === 'gif' ? (
            <span className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 uppercase">MP4 / MOV / AVI / WEBM</span>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 uppercase">JPG / PNG / WEBP / AVIF</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
