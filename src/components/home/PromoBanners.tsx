import Link from "next/link";
import { ProductWithImages } from "@/lib/products";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { RevealImage } from "@/components/motion/RevealImage";
import { FallbackImage } from "@/components/ui/FallbackImage";

export interface BannerItem {
  id: string;
  badge?: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  priceTag?: string;
  highlightTag?: string;
}

export type FeaturedProductBannerData = ProductWithImages & {
  categoryRel?: { id: string; name: string; slug: string } | null;
};

interface PromoBannersProps {
  featuredProduct?: FeaturedProductBannerData | null;
  bannerProducts?: (FeaturedProductBannerData | ProductWithImages)[] | null;
  customBanners?: BannerItem[];
}

export function PromoBanners({ featuredProduct, bannerProducts, customBanners }: PromoBannersProps) {
  const p1 = bannerProducts && bannerProducts.length > 0 ? bannerProducts[0] : null;
  const p2 =
    bannerProducts && bannerProducts.length > 1
      ? bannerProducts[1]
      : featuredProduct && (!p1 || featuredProduct.id !== p1.id)
      ? featuredProduct
      : null;

  // Banner 1: New Arrivals editorial with real active product image when available
  const banner1: BannerItem = {
    id: p1 ? `editorial-arrival-${p1.id}` : "new-arrivals-editorial",
    badge: "NEW ARRIVALS",
    title: "Crafted For Daily Movement",
    description: "Ergonomic comfort, breathable construction, and timeless silhouettes made for everyday life.",
    ctaText: "Explore New Arrivals",
    href: "/search?sort=Newest",
    imageSrc: p1?.images[0]?.imageUrl || "",
    imageAlt: p1?.name || "KNOOS Handcrafted Footwear",
    highlightTag: "New Season",
  };

  // Banner 2: Featured spotlight product with another distinct real product image
  const banner2: BannerItem = p2
    ? {
        id: `product-spotlight-${p2.id}`,
        badge:
          (p2 as any).categoryRel?.name?.toUpperCase() ||
          (p2.gender === "MEN" ? "MEN'S SPOTLIGHT" : "WOMEN'S SPOTLIGHT"),
        title: p2.name,
        description:
          p2.description ||
          "Timeless design meets exceptional comfort and deliberate craftsmanship.",
        ctaText: "View Product",
        href: `/product/${p2.slug}`,
        imageSrc: p2.images[0]?.imageUrl || "",
        imageAlt: p2.name,
        priceTag: p2.salePrice
          ? `₹${p2.salePrice.toLocaleString("en-IN")}`
          : `₹${p2.price.toLocaleString("en-IN")}`,
        highlightTag: "Featured Shoe",
      }
    : {
        id: "curated-editorial",
        badge: "SIGNATURE SERIES",
        title: "The Signature Collection",
        description: "From relaxed everyday slip-ons to refined lace-ups, constructed for enduring style.",
        ctaText: "Shop Collection",
        href: "/search",
        imageSrc: "",
        imageAlt: "KNOOS Curated Collection",
        highlightTag: "Curated",
      };

  const defaultBanners: BannerItem[] = [banner1, banner2];
  const banners = customBanners && customBanners.length > 0 ? customBanners : defaultBanners;

  return (
    <section className="py-16 md:py-20 lg:py-24 px-6 md:px-12 lg:px-24 bg-brand-sky/20 border-y border-brand-sky-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <Reveal>
              <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-brand-blue font-semibold mb-3">
                EDITORIAL
              </p>
            </Reveal>
            <RevealText
              as="h2"
              text="Featured Highlights"
              className="font-serif text-3xl md:text-4xl text-brand-dark"
            />
          </div>
          <Reveal delay={0.15}>
            <Link
              href="/search"
              className="group font-mono text-xs uppercase tracking-widest text-brand-navy hover:text-brand-blue transition-colors inline-flex items-center gap-2 pb-1 border-b border-transparent hover:border-brand-blue"
            >
              <span>View All Collections</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {banners.map((banner, index) => (
            <RevealImage
              key={banner.id}
              delay={index * 0.12}
              scaleFrom={1.03}
              className="h-full"
            >
              <Link
                href={banner.href}
                className="group relative flex flex-col justify-end min-h-[380px] sm:min-h-[440px] md:min-h-[480px] rounded-2xl overflow-hidden bg-brand-navy border border-brand-navy-light/40 shadow-md hover:shadow-2xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              >
                {/* Responsive Next/Image with fallback */}
                <FallbackImage
                  src={banner.imageSrc}
                  alt={banner.imageAlt}
                  fill
                  fallbackType="banner"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-90"
                />

                {/* Rich Multi-stop Gradient for Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-95" />

                {/* Top Badges */}
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none">
                  {banner.badge && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-navy/80 backdrop-blur-md border border-white/20 text-brand-gold text-[11px] font-mono uppercase tracking-wider">
                      {banner.badge}
                    </span>
                  )}
                  {banner.priceTag && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-brand-dark text-xs font-mono font-bold shadow-md">
                      {banner.priceTag}
                    </span>
                  )}
                  {!banner.priceTag && banner.highlightTag && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-mono uppercase tracking-wider">
                      {banner.highlightTag}
                    </span>
                  )}
                </div>

                {/* Bottom Content Container */}
                <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col items-start transition-transform duration-500 ease-out group-hover:-translate-y-1">
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white mb-3 tracking-tight drop-shadow-sm">
                    {banner.title}
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-sans font-light max-w-lg line-clamp-2">
                    {banner.description}
                  </p>
                  <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white text-brand-dark font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-lg">
                    <span>{banner.ctaText}</span>
                    <span
                      className="text-brand-blue group-hover:text-white transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </span>
                </div>
              </Link>
            </RevealImage>
          ))}
        </div>
      </div>
    </section>
  );
}
