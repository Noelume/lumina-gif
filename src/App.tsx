import React, { useState, useEffect } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { VideoEditorPreview, VideoEditorControls } from './components/VideoEditor';
import { ImageEditorPreview, ImageEditorControls } from './components/ImageEditor';
import { MirageEditorPreview, MirageEditorControls } from './components/MirageEditor';
import { generateGif } from './lib/gifGenerator';
import { processImage, OneLastKissOptions } from './lib/imageProcessor';
import { applyOneLastKissFilter } from './lib/oneLastKiss';
import { processMirageTank } from './lib/mirageProcessor';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Video, Image as ImageIcon, ChevronRight, LayoutGrid, Cpu, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';

type Feature = 'gif' | 'cover' | 'mirage';

export default function App() {
  const [activeFeature, setActiveFeature] = useState<Feature>('gif');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);

  const [imageOptions, setImageOptions] = useState<OneLastKissOptions>({
    zoom: 1,
    light: 0,
    shadeLimit: 108,
    shadeLight: 80,
    shade: true,
    kuma: true,
    hajimei: false,
    watermark: true,
    convoluteName: '一般',
    convolute1Diff: true,
    convoluteName2: null,
    lightCut: 128,
    darkCut: 118,
    denoise: true,
  });

  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    setFileSize(formatBytes(file.size));
    if (activeFeature === 'gif' && file.type.startsWith('video/')) {
      setVideoFile(file);
      setImageFile(null);
      setImageFile2(null);
      setDuration(0);
      setRange([0, 0]);
      setCurrentTime(0);
      setIsPlaying(false);
    } else if (activeFeature === 'cover' && file.type.startsWith('image/')) {
      setImageFile(file);
      setVideoFile(null);
      setImageFile2(null);
    } else if (activeFeature === 'mirage' && file.type.startsWith('image/')) {
      if (!imageFile) setImageFile(file); else setImageFile2(file);
      setVideoFile(null);
    } else {
      alert(`Invalid file for the selected mode.`);
      return;
    }
    setResultUrl(null);
    setProgress(0);
  };

  const handleGenerate = async (start: number, end: number, fps: number, width: number) => {
    if (!videoFile) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      const url = await generateGif(
        videoFile, 
        start, 
        end, 
        fps, 
        width, 
        setProgress
      );
      
      // Calculate result size
      const res = await fetch(url);
      const blob = await res.blob();
      setResultSize(formatBytes(blob.size));
      
      setResultUrl(url);
    } catch (error) {
      alert('Failed to generate GIF.');
    } finally {
      setIsGenerating(false);
    }
  };

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  const handleImageGenerate = async (width: number, options: OneLastKissOptions) => {
    if (!imageFile) return;
    setIsGenerating(true);
    setProgress(0.5);
    try {
      const url = await processImage(imageFile, width, options);
      setResultUrl(url);
    } catch (error) {
      alert('Failed to process image.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleMirageGenerate = async () => {
    if (!imageFile || !imageFile2) return;
    setIsGenerating(true);
    setProgress(0.5);
    try {
      const url = await processMirageTank(imageFile, imageFile2);
      setResultUrl(url);
    } catch (error) {
      alert('Failed to process Mirage Tank.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setImageFile(null);
    setImageFile2(null);
    setResultUrl(null);
    setProgress(0);
  };

  const features = [
    { id: 'gif', name: 'GIF Maker', icon: Video },
    { id: 'cover', name: 'Chromatic', icon: ImageIcon },
    { id: 'mirage', name: 'Phantom', icon: Cpu }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-blue-100 flex flex-col items-center p-4 md:p-8 lg:p-12 relative overflow-x-hidden">
      {/* Background Subtle Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.02),transparent)]" />
      </div>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row relative z-10 gap-8 lg:gap-12">
        {/* Left Side: Preview Stage */}
        <section className="flex-1 min-h-[400px] lg:min-h-[600px] flex flex-col justify-center items-center bg-gray-100/30 rounded-[32px] lg:rounded-[64px] border border-gray-200/50 relative shadow-inner-lg overflow-hidden group p-4 lg:p-0">
          <AnimatePresence mode="wait">
            {resultUrl ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center justify-center p-4 lg:p-12"
              >
                <div className="w-full aspect-square max-w-xl rounded-[24px] lg:rounded-[48px] overflow-hidden border border-gray-200 shadow-[0_48px_100px_-24px_rgba(0,0,0,0.12)] bg-white p-3 lg:p-5">
                  <img src={resultUrl} alt="Result" className="w-full h-full object-contain rounded-[16px] lg:rounded-[32px]" />
                </div>
                <button
                  onClick={handleReset}
                  className="mt-6 lg:mt-10 px-6 lg:px-8 py-3 rounded-full bg-white border border-gray-200 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all flex items-center gap-3"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 
                  重置画布
                </button>
              </motion.div>
            ) : (videoFile || imageFile) ? (
              <motion.div
                key="studio-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-center p-4 lg:p-16"
              >
                {activeFeature === 'gif' && videoFile && (
                  <div className="w-full max-w-4xl shadow-[0_64px_128px_-32px_rgba(0,0,0,0.15)] rounded-[24px] lg:rounded-[48px] overflow-hidden bg-black border border-white/5">
                    <VideoEditorPreview 
                      videoFile={videoFile} 
                      fileSize={fileSize}
                      range={range}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      isMuted={isMuted}
                      onTimeUpdate={setCurrentTime}
                      onDurationChange={(dur) => { setDuration(dur); setRange([0, Math.min(dur, 5)]); }}
                      onPlayStateChange={setIsPlaying}
                      onMuteChange={setIsMuted}
                    />
                  </div>
                )}
                {activeFeature === 'cover' && imageFile && (
                  <div className="w-full max-w-3xl flex justify-center drop-shadow-[0_48px_96px_rgba(0,0,0,0.1)]">
                    <ImageEditorPreview imageFile={imageFile} options={imageOptions} />
                  </div>
                )}
                {activeFeature === 'mirage' && (
                  <div className="w-full">
                    <MirageEditorPreview 
                      topFile={imageFile} 
                      bottomFile={imageFile2} 
                      onFileSelect={(f, t) => { if (t === 'top') setImageFile(f); else setImageFile2(f); setResultUrl(null); }}
                      onClear={(t) => t === 'top' ? setImageFile(null) : setImageFile2(null)}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-center p-6 lg:p-12"
              >
                <div className="w-full max-w-lg">
                  <VideoUploader onFileSelect={handleFileSelect} activeFeature={activeFeature} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Side: Sidebar Panel */}
        <section className="w-full lg:w-[440px] flex flex-col relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature + (resultUrl ? '-done' : '-controls')}
              initial={{ opacity: 0, scale: 0.98, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-[32px] lg:rounded-[56px] border border-gray-100 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.1)] p-6 lg:p-10 space-y-8 lg:space-y-10"
            >
              {/* Integrated Switcher */}
              <div className="flex bg-gray-50 rounded-[24px] p-2 border border-gray-100/80 shadow-inner relative">
                {/* Active Indicator Background - For Smooth Sliding */}
                <motion.div 
                  className="absolute bg-white shadow-lg border border-gray-100 rounded-[18px] z-0"
                  initial={false}
                  animate={{ 
                    x: activeFeature === 'gif' ? 0 : activeFeature === 'cover' ? '100%' : '200%',
                    width: '33.333%'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{ top: 8, bottom: 8, left: 8, width: 'calc(33.333% - 11px)' }}
                />
                
                {features.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveFeature(f.id as Feature);
                      handleReset();
                    }}
                    className={cn(
                      "px-3 py-3 rounded-[18px] transition-colors duration-200 flex-1 flex flex-col items-center justify-center gap-1.5 relative z-10",
                      activeFeature === f.id ? "text-blue-600" : "text-gray-300 hover:text-gray-500"
                    )}
                  >
                    <f.icon className={cn("w-4.5 h-4.5 transition-transform duration-200", activeFeature === f.id ? "scale-110" : "scale-100")} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{f.id === 'gif' ? 'GIF制作' : f.id === 'cover' ? 'One Last Kiss' : '幻影坦克'}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1 text-center">
                <div className="text-[11px] font-black tracking-[0.4em] text-blue-500 uppercase opacity-40">Core Logic // Alpha</div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tighter">
                  {activeFeature === 'gif' ? 'GIF 制作' : activeFeature === 'cover' ? 'One Last Kiss 渲染' : '幻影坦克合成'}
                </h2>
              </div>

              <div className="py-2 border-t border-gray-50 overflow-y-auto max-h-[60vh] custom-scrollbar px-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeFeature + (resultUrl ? '-done' : '-controls')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  >
                    {resultUrl ? (
                      <div className="space-y-8 py-6">
                        <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex flex-col items-center text-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-300 text-white">
                            <Sparkles className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-base font-black text-gray-800 uppercase tracking-tight">渲染完成</div>
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest opacity-60">High Fidelity Output</div>
                              {resultSize && (
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{resultSize}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <a
                          href={resultUrl}
                          download={`lumina-${activeFeature}-${Date.now()}.${activeFeature === 'gif' ? 'gif' : 'png'}`}
                          className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-gray-900 text-white rounded-[28px] text-xs font-black uppercase tracking-[0.3em] hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-2xl shadow-gray-400/20"
                        >
                          导出至设备
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </a>
                      </div>
                    ) : activeFeature === 'gif' && videoFile ? (
                      <VideoEditorControls 
                        duration={duration} range={range}
                        onRangeChange={(newRange) => { setRange(newRange); if (newRange[0] !== range[0]) setCurrentTime(newRange[0]); }}
                        onGenerate={handleGenerate} isGenerating={isGenerating}
                        isPlaying={isPlaying}
                        onPlayStateChange={setIsPlaying}
                      />
                ) : activeFeature === 'cover' && imageFile ? (
                  <ImageEditorControls 
                    options={imageOptions}
                    onOptionsChange={setImageOptions} 
                    onGenerate={handleImageGenerate} 
                    isGenerating={isGenerating} 
                  />
                ) : activeFeature === 'mirage' ? (
                      <MirageEditorControls onGenerate={handleMirageGenerate} isGenerating={isGenerating} ready={!!(imageFile && imageFile2)} />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center space-y-8 py-10">
                        <div className="w-24 h-24 rounded-[40px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200 shadow-inner relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent animate-pulse" />
                          <LayoutGrid className="w-10 h-10 relative z-10" />
                        </div>
                        <div className="space-y-3">
                          <div className="text-[12px] font-black text-gray-400 uppercase tracking-[0.4em]">Standby</div>
                          <p className="text-[11px] text-gray-300 font-bold leading-relaxed max-w-[220px]">注入媒体文件以启动核心模块</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Global Processing Mask */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl flex flex-col items-center justify-center p-12"
          >
            <div className="w-full max-w-sm space-y-8 text-center">
              <div className="text-[11px] uppercase tracking-[0.5em] text-blue-600 font-black italic">Synthesizing // {Math.round(progress * 100)}%</div>
              <div className="relative h-2 w-full bg-blue-100 rounded-full overflow-hidden shadow-inner">
                <motion.div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.1 }} />
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Computing complex matrix data...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
