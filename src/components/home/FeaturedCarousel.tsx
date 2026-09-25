"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductWithImages } from "@/lib/products";
import { useReducedMotion } from "framer-motion";
import { RevealText } from "@/components/motion/RevealText";
import { Reveal } from "@/components/motion/Reveal";

interface FeaturedCarouselProps {
  products: ProductWithImages[];
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllText?: string;
}

export function FeaturedCarousel({
  products,
  title = "New Arrivals",
  eyebrow = "JUST IN",
  subtitle = "Our latest arrivals, engineered with comfort-first principles and premium finishes.",
  viewAllHref = "/search?sort=Newest",
  viewAllText = "View All",
}: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();

    // Listen to scroll events to update arrow active/disabled states
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, products.length]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    // Scroll by roughly 1 page or 2 items
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 lg:py-24 px-6 md:px-12 lg:px-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div>
            <Reveal>
              <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-brand-blue font-semibold mb-3">
                {eyebrow}
              </p>
            </Reveal>
            <RevealText
              as="h2"
              text={title}
              className="font-serif text-3xl md:text-4xl text-brand-dark"
            />
            {subtitle && (
              <Reveal delay={0.15}>
                <p className="text-brand-gray-500 text-sm md:text-base mt-2 max-w-xl">
                  {subtitle}
                </p>
              </Reveal>
            )}
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="group font-mono text-xs uppercase tracking-widest text-brand-navy hover:text-brand-blue transition-colors flex items-center gap-2 pb-1 border-b border-transparent hover:border-brand-blue mr-2"
              >
                <span>{viewAllText}</span>
                <span
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  &rarr;
                </span>
              </Link>
            )}

            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-2" role="group" aria-label="Carousel navigation">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollPrev}
                aria-label="Previous products"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  canScrollPrev
                    ? "border-brand-dark/20 text-brand-dark hover:border-brand-blue hover:text-brand-blue hover:bg-brand-sky/20 active:scale-95"
                    : "border-brand-gray-200 text-brand-gray-300 cursor-not-allowed opacity-40"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollNext}
                aria-label="Next products"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  canScrollNext
                    ? "border-brand-dark/20 text-brand-dark hover:border-brand-blue hover:text-brand-blue hover:bg-brand-sky/20 active:scale-95"
                    : "border-brand-gray-200 text-brand-gray-300 cursor-not-allowed opacity-40"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label={`${title} carousel`}
          className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-6 pt-2 -mx-6 px-6 md:-mx-12 md:px-12 lg:mx-0 lg:px-0 focus:outline-none focus:ring-1 focus:ring-brand-blue/30 rounded-lg touch-pan-x"
        >
          {products.map((product) => (
            <div
              key={product.id}
              data-carousel-item
              className="flex-none w-[76vw] sm:w-[45vw] md:w-[32vw] lg:w-[calc(25%-1.5rem)] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
