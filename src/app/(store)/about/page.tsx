import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | KNOOS",
  description: "Discover KNOOS by KRIPA KIRAN SHOE COMPANY. Premium footwear designed around comfort, style, and refined aesthetics.",
};

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-24 md:py-32">
      {/* Header section */}
      <div className="max-w-4xl mb-32">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gray-400 block mb-8">
          Our Identity &amp; Philosophy
        </span>
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight mb-10 text-brand-black">
          About KNOOS
        </h1>
        <p className="font-serif italic text-2xl md:text-3xl text-brand-gray-600 leading-relaxed mb-10 tracking-wide">
          &ldquo;Comfort In Every Step&rdquo;
        </p>
        <p className="text-brand-gray-500 text-base md:text-lg leading-relaxed max-w-2xl">
          KNOOS, created by KRIPA KIRAN SHOE COMPANY, is a contemporary footwear brand built on the belief that everyday style should never compromise on comfort.
        </p>
      </div>

      {/* Brand Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
        <div className="border-t border-brand-gray-200 pt-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gray-400 block mb-6">01</span>
          <h2 className="font-serif text-2xl md:text-3xl mb-5 tracking-tight text-brand-black">Dedicated to Comfort</h2>
          <p className="text-sm text-brand-gray-500 leading-relaxed">
            Every silhouette in our collection is curated to support your natural stride, ensuring you feel at ease throughout the day.
          </p>
        </div>

        <div className="border-t border-brand-gray-200 pt-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gray-400 block mb-6">02</span>
          <h2 className="font-serif text-2xl md:text-3xl mb-5 tracking-tight text-brand-black">Timeless Design</h2>
          <p className="text-sm text-brand-gray-500 leading-relaxed">
            We focus on clean lines, balanced proportions, and versatile aesthetics that complement your wardrobe seamlessly across seasons.
          </p>
        </div>

        <div className="border-t border-brand-gray-200 pt-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gray-400 block mb-6">03</span>
          <h2 className="font-serif text-2xl md:text-3xl mb-5 tracking-tight text-brand-black">Quality Presentation</h2>
          <p className="text-sm text-brand-gray-500 leading-relaxed">
            From product inspection to careful packaging, our team strives to deliver a refined and reliable experience from order to doorstep.
          </p>
        </div>
      </div>

      {/* Brand Statement Banner */}
      <div className="bg-brand-gray-50/80 border border-brand-gray-200/60 p-12 md:p-20 mb-32">
        <div className="max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gray-400 block mb-8">
            KRIPA KIRAN SHOE COMPANY
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-snug mb-8 tracking-tight text-brand-black">
            Crafting a seamless footwear journey from Shahganj, Agra to your doorstep.
          </h2>
          <p className="text-brand-gray-500 text-sm md:text-base leading-relaxed mb-10 max-w-xl">
            Operating from Agra, our focus remains on providing attentive customer support, reliable delivery, and footwear designed to elevate your daily routine.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/men"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-black text-white text-xs font-mono uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
            >
              Shop Men&apos;s Collection
            </Link>
            <Link
              href="/women"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-black text-black text-xs font-mono uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Shop Women&apos;s Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Navigation CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-t border-brand-gray-200 pt-10">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-gray-400 block">
            Have questions about our collections?
          </span>
          <p className="text-sm text-brand-gray-500 mt-2">
            Our customer care team is available from 10 AM to 7 PM.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-brand-black hover:underline"
        >
          Contact Customer Care &rarr;
        </Link>
      </div>
    </main>
  );
}
