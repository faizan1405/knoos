"use client";

import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import { ProductImage } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, activeIndex]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isLightboxOpen]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-brand-gray-50 flex items-center justify-center">
        <span className="font-mono text-sm text-brand-gray-400">No Image Available</span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMagnifierPos({ x, y });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col-reverse md:flex-row gap-6 md:gap-8"
      >
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-24 lg:w-32 flex-shrink-0 pb-2 md:pb-0">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-[4/5] w-20 md:w-full flex-shrink-0 border transition-all duration-300 bg-brand-gray-50 ${
                  activeIndex === index
                    ? "border-brand-black opacity-100"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 80px, 128px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image Container */}
        <div
          ref={imageContainerRef}
          className="relative w-full aspect-square md:aspect-[4/5] bg-brand-gray-50 overflow-hidden cursor-zoom-in group rounded-md"
          onClick={() => {
            setIsLightboxOpen(true);
            setIsMagnifying(false);
          }}
          onMouseEnter={() => setIsMagnifying(true)}
          onMouseLeave={() => setIsMagnifying(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 p-4 md:p-8"
            >
              <Image
                src={activeImage.imageUrl}
                alt={productName}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>

          {/* Desktop Magnifier */}
          {isMagnifying && (
            <div className="absolute inset-0 pointer-events-none hidden md:block overflow-hidden z-10 bg-brand-gray-50">
              <div
                className="w-full h-full relative"
                style={{
                  transformOrigin: `${magnifierPos.x}% ${magnifierPos.y}%`,
                  transform: "scale(2.2)",
                }}
              >
                <Image
                  src={activeImage.imageUrl}
                  alt={productName}
                  fill
                  sizes="60vw"
                  className="object-contain p-8"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 z-50 p-2 text-white/70 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              aria-label="Close Lightbox"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {images.length > 1 && (
              <button
                className="absolute left-4 md:left-12 z-50 p-4 text-white/50 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous Image"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {images.length > 1 && (
              <button
                className="absolute right-4 md:right-12 z-50 p-4 text-white/50 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next Image"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}

            <div
              className="relative w-full max-w-6xl h-full max-h-[85vh] mx-4 md:mx-24"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeImage.imageUrl}
                    alt={productName}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {images.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto hide-scrollbar pointer-events-none">
                <div className="flex gap-2 pointer-events-auto bg-black/50 p-2 rounded-xl backdrop-blur-md">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex(index);
                      }}
                      className={`relative w-12 h-16 md:w-16 md:h-20 flex-shrink-0 transition-all duration-300 rounded-md overflow-hidden ${
                        activeIndex === index
                          ? "border-2 border-white opacity-100"
                          : "border-2 border-transparent opacity-40 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={image.imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
