"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-brand-gray-50 flex items-center justify-center">
        <span className="font-mono text-sm text-brand-gray-400">No Image Available</span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-24 flex-shrink-0">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-[4/5] w-20 md:w-full flex-shrink-0 border transition-all duration-300 ${
                activeIndex === index
                  ? "border-brand-black opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.imageUrl}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="(max-width: 768px) 80px, 96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="relative aspect-[4/5] w-full bg-brand-gray-50 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage.imageUrl}
              alt={productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

