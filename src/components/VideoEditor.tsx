import React, { useState, useRef, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Play, Pause, Settings2, Loader2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';

interface VideoEditorPreviewProps {
  videoFile: File;
  fileSize: string | null;
  range: [number, number];
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onMuteChange: (isMuted: boolean) => void;
}

export function VideoEditorPreview({ 
  videoFile, 
  fileSize,
  range, 
  currentTime, 
  isPlaying, 
  isMuted,
  onTimeUpdate, 
  onDurationChange,
  onPlayStateChange,
  onMuteChange
}: VideoEditorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // High-performance loop and time monitoring using rAF (60fps)
  useEffect(() => {
    const checkLoop = () => {
      if (videoRef.current && isPlaying) {
        const time = videoRef.current.currentTime;
        onTimeUpdate(time);
        
        // Accurate loop: restart slightly before absolute end to mask seek latency
        if (time >= range[1] - 0.05) {
          videoRef.current.currentTime = range[0];
        }
      }
      requestRef.current = requestAnimationFrame(checkLoop);
    };

    requestRef.current = requestAnimationFrame(checkLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, range, onTimeUpdate]);

  // Throttled seeking for slider preview to prevent performance lag
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => onPlayStateChange(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, onPlayStateChange]);

  const togglePlay = () => {
    onPlayStateChange(!isPlaying);
  };

  return (
    <div className="relative w-full aspect-video bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 shadow-sm group flex items-center justify-center cursor-pointer" onClick={togglePlay}>
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted={isMuted}
          onLoadedMetadata={() => onDurationChange(videoRef.current?.duration || 0)}
          onEnded={() => onPlayStateChange(false)}
          className="w-full h-full object-contain bg-black"
          playsInline
        />
      )}
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={cn(
          "w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all duration-300 pointer-events-auto shadow-xl",
          isPlaying ? "opacity-0 scale-90" : "opacity-100 scale-100 hover:scale-110 hover:bg-white/30"
        )}>
          {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
        </div>
      </div>

      {/* Top Status Bar with Mute Toggle */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">监视器 - {isPlaying ? '播放' : '暂停'}</span>
            {fileSize && (
              <>
                <div className="w-px h-3 bg-gray-200" />
                <span className="text-[10px] font-bold text-blue-600">{fileSize}</span>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMuteChange(!isMuted);
          }}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all pointer-events-auto active:scale-90"
          title={isMuted ? "取消静音" : "静音预览"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface VideoEditorControlsProps {
  duration: number;
  range: [number, number];
  onRangeChange: (range: [number, number]) => void;
  onSeek?: (time: number) => void;
  onGenerate: (start: number, end: number, fps: number, width: number) => void;
  isGenerating: boolean;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export function VideoEditorControls({ 
  duration, 
  range, 
  onRangeChange, 
  onSeek,
  onGenerate, 
  isGenerating,
  isPlaying,
  onPlayStateChange
}: VideoEditorControlsProps) {
  const [fps, setFps] = useState<number>(15);
  const [width, setWidth] = useState<number>(480);
  const [localRange, setLocalRange] = useState<[number, number]>(range);

  useEffect(() => {
    setLocalRange(range);
  }, [range]);

  const handleRangeChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      const newRange: [number, number] = [value[0], value[1]];
      setLocalRange(newRange);
      
      // Determine which handle is moving to provide better seek preview
      if (newRange[0] !== range[0]) {
        onSeek?.(newRange[0]);
      } else if (newRange[1] !== range[1]) {
        onSeek?.(newRange[1]);
      }
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = (time % 60).toFixed(1);
    return `${min}:${sec.padStart(4, '0')}`;
  };

  return (
    <div className="space-y-10">
      <div className="space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">片段裁剪</label>
            <div className="text-xs font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
              {formatTime(localRange[0])} — {formatTime(localRange[1])}
            </div>
          </div>
          <div className="px-2">
            <Slider
              range
              min={0}
              max={duration || 100}
              step={0.1}
              value={localRange}
              onChange={handleRangeChange}
              onChangeComplete={(v) => onRangeChange(v as [number, number])}
              trackStyle={[{ backgroundColor: '#3b82f6', height: 4 }]}
              handleStyle={[
                { borderColor: '#3b82f6', backgroundColor: '#fff', width: 16, height: 16, marginTop: -6, opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
                { borderColor: '#3b82f6', backgroundColor: '#fff', width: 16, height: 16, marginTop: -6, opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
              ]}
              railStyle={{ backgroundColor: '#e5e7eb', height: 4 }}
            />
          </div>
        </div>

        <button
          onClick={() => onPlayStateChange(!isPlaying)}
          className={cn(
            "w-full py-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            isPlaying ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-green-50 border-green-100 text-green-600"
          )}
        >
          {isPlaying ? (
            <><Pause className="w-3.5 h-3.5" fill="currentColor" /> 暂停预览</>
          ) : (
            <><Play className="w-3.5 h-3.5" fill="currentColor" /> 继续播放</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">帧率</label>
          <div className="flex p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
            {[10, 15, 24].map((val) => (
              <button
                key={val}
                onClick={() => setFps(val)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all duration-200",
                  fps === val ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {val} FPS
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">分辨率</label>
          <div className="flex p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
            {[320, 480, 640].map((val) => (
              <button
                key={val}
                onClick={() => setWidth(val)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all duration-200",
                  width === val ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {val}px
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onGenerate(range[0], range[1], fps, width)}
        disabled={isGenerating}
        className="w-full py-6 rounded-2xl bg-blue-600 text-white text-[11px] uppercase tracking-[0.2em] font-black hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-100"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            正在处理
          </>
        ) : (
          "生成 GIF 制作"
        )}
      </button>
    </div>
  );
}

