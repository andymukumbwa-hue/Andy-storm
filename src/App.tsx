/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Sparkles, Download, RefreshCw, AlertCircle, Palette, Pencil, Zap, PencilLine, LayoutGrid, Shirt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { transformToArtisticStyle, swapOutfit, type ArtisticStyle } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STYLES: { id: ArtisticStyle; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'watercolor', label: 'Watercolor', icon: Sparkles, description: 'Soft splashes and vibrant drips' },
  { id: 'oil', label: 'Oil Painting', icon: Palette, description: 'Thick strokes and rich textures' },
  { id: 'charcoal', label: 'Charcoal', icon: Pencil, description: 'Rough, dramatic hand-drawn lines' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: Zap, description: 'Neon glows and futuristic vibes' },
  { id: 'pencil', label: 'Pencil', icon: PencilLine, description: 'Classic graphite sketch' },
  { id: 'popart', label: 'Pop Art', icon: LayoutGrid, description: 'Bold colors and comic patterns' },
];

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ArtisticStyle>('watercolor');
  const [outfitDescription, setOutfitDescription] = useState<string>('');
  const [mode, setMode] = useState<'style' | 'outfit'>('style');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setTransformedImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleTransform = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const [mimeInfo, base64Data] = originalImage.split(',');
      const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || 'image/png';
      
      let result: string | null = null;
      if (mode === 'style') {
        result = await transformToArtisticStyle(base64Data, mimeType, selectedStyle);
      } else {
        if (!outfitDescription.trim()) {
          setError("Please provide an outfit description.");
          setIsProcessing(false);
          return;
        }
        result = await swapOutfit(base64Data, mimeType, outfitDescription);
      }

      if (result) {
        setTransformedImage(result);
      } else {
        setError(`Failed to generate the ${mode === 'style' ? selectedStyle : 'outfit swap'}. Please try again.`);
      }
    } catch (err) {
      setError("An error occurred while processing the image. Please check your connection and try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!transformedImage) return;
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = 'watercolor-sketch.png';
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setTransformedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Artistic Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => { setMode('style'); setTransformedImage(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  mode === 'style' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Artistic Styles
              </button>
              <button
                onClick={() => { setMode('outfit'); setTransformedImage(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  mode === 'outfit' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Outfit Swap
              </button>
            </div>
            {originalImage && (
              <button 
                onClick={reset}
                className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold tracking-tight mb-4">
                  {mode === 'style' ? (
                    <>Turn your photos into <span className="text-emerald-500">art</span>.</>
                  ) : (
                    <>Swap your <span className="text-emerald-500">outfit</span> instantly.</>
                  )}
                </h2>
                <p className="text-gray-500 text-lg">
                  {mode === 'style' 
                    ? "Upload an image and choose an artistic style to transform it."
                    : "Upload a photo of yourself and describe the new outfit you want to wear."}
                </p>
              </div>

              {mode === 'style' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 group",
                        selectedStyle === style.id
                          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedStyle === style.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 group-hover:text-emerald-500"
                      )}>
                        <style.icon size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{style.label}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">{style.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Describe the new outfit</label>
                  <textarea
                    value={outfitDescription}
                    onChange={(e) => setOutfitDescription(e.target.value)}
                    placeholder="e.g., A formal black tuxedo with a red bow tie, or a casual summer dress with floral patterns"
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none h-32"
                  />
                </div>
              )}

              <div
                {...getRootProps()}
                className={cn(
                  "relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 aspect-video flex flex-col items-center justify-center gap-4",
                  isDragActive 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-gray-400 group-hover:text-emerald-500 transition-colors" size={24} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Click or drag image here</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG or WEBP up to 10MB</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Controls */}
              <div className="lg:col-span-4 space-y-6">
                {mode === 'style' ? (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <LayoutGrid size={14} /> Choose Style
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setSelectedStyle(style.id);
                            setTransformedImage(null);
                          }}
                          className={cn(
                            "p-3 rounded-xl border transition-all text-left flex flex-col gap-1 group",
                            selectedStyle === style.id
                              ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                              : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            selectedStyle === style.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 group-hover:text-emerald-500"
                          )}>
                            <style.icon size={16} />
                          </div>
                          <p className="font-semibold text-xs">{style.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Shirt size={14} /> Outfit Description
                    </span>
                    <textarea
                      value={outfitDescription}
                      onChange={(e) => {
                        setOutfitDescription(e.target.value);
                        setTransformedImage(null);
                      }}
                      placeholder="Describe the new outfit..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none h-40 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <ImageIcon size={14} /> Original Photo
                  </span>
                  <div className="rounded-2xl overflow-hidden bg-gray-100 border border-black/5 aspect-square relative">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Result */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    {mode === 'style' ? (
                      <>
                        {React.createElement(STYLES.find(s => s.id === selectedStyle)?.icon || Sparkles, { size: 14, className: "text-emerald-500" })} 
                        {STYLES.find(s => s.id === selectedStyle)?.label} Effect
                      </>
                    ) : (
                      <>
                        <Shirt size={14} className="text-emerald-500" /> Outfit Swap
                      </>
                    )}
                  </span>
                </div>
                
                <div className="rounded-3xl overflow-hidden bg-gray-100 border border-black/5 aspect-video md:aspect-square lg:aspect-video relative flex items-center justify-center">
                  {transformedImage ? (
                    <motion.img 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={transformedImage} 
                      alt="Transformed" 
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      {isProcessing ? (
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="animate-spin text-emerald-500" size={32} />
                          <p className="text-gray-500 font-medium">
                            {mode === 'style' ? `Creating your ${selectedStyle} art...` : "Swapping your outfit..."}
                          </p>
                        </div>
                      ) : error ? (
                        <div className="flex flex-col items-center gap-4 text-red-500">
                          <AlertCircle size={32} />
                          <p className="font-medium">{error}</p>
                          <button 
                            onClick={handleTransform}
                            className="text-sm font-semibold underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                            {mode === 'style' 
                              ? React.createElement(STYLES.find(s => s.id === selectedStyle)?.icon || Sparkles, { size: 40 })
                              : <Shirt size={40} />
                            }
                          </div>
                          <p className="text-gray-500">
                            {mode === 'style' 
                              ? `Ready to transform your photo into ${selectedStyle}?`
                              : "Ready to swap your outfit?"
                            }
                          </p>
                          <button
                            onClick={handleTransform}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            {mode === 'style' ? `Apply ${STYLES.find(s => s.id === selectedStyle)?.label} Effect` : "Swap Outfit"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {transformedImage && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-black text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
                    >
                      <Download size={18} /> Download Masterpiece
                    </button>
                    <button
                      onClick={handleTransform}
                      disabled={isProcessing}
                      className="flex-1 bg-white border border-black/10 text-black px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} /> Regenerate
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5 mt-12 text-center">
        <p className="text-sm text-gray-400">
          Powered by Gemini AI • Created for artistic expression
        </p>
      </footer>
    </div>
  );
}
