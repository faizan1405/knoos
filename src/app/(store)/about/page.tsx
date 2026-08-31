import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | KNOOS",
  description: "Discover KNOOS by KRIPA KIRAN SHOE COMPANY. Premium footwear designed around comfort, style, and refined aesthetics.",
};

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
      {/* Header section */}
      <div className="max-w-3xl mb-20">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-3">
          Our Identity &amp; Philosophy
        </span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
          About KNOOS
        </h1>
        <p className="font-serif italic text-xl md:text-2xl text-brand-gray-700 leading-relaxed mb-6">
          &ldquo;Comfort In Every Step&rdquo;
        </p>
        <p className="text-brand-gray-600 text-base md:text-lg leading-relaxed">
          KNOOS, created by KRIPA KIRAN SHOE COMPANY, is a contemporary footwear brand built on the belief that everyday style should never compromise on comfort.
        </p>
      </div>

      {/* Brand Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="border-t border-brand-gray-200 pt-8">
          <span className="font-mono text-xs text-brand-gray-400 block mb-3">01</span>
          <h2 className="font-serif text-2xl mb-4">Dedicated to Comfort</h2>
          <p className="text-sm text-brand-gray-600 leading-relaxed">
            Every silhouette in our collection is curated to support your natural stride, ensuring you feel at ease throughout the day.
          </p>
        </div>

        <div className="border-t border-brand-gray-200 pt-8">
          <span className="font-mono text-xs text-brand-gray-400 block mb-3">02</span>
          <h2 className="font-serif text-2xl mb-4">Timeless Design</h2>
          <p className="text-sm text-brand-gray-600 leading-relaxed">
            We focus on clean lines, balanced proportions, and versatile aesthetics that complement your wardrobe seamlessly across seasons.
          </p>
        </div>

        <div className="border-t border-brand-gray-200 pt-8">
          <span className="font-mono text-xs text-brand-gray-400 block mb-3">03</span>
          <h2 className="font-serif text-2xl mb-4">Quality Presentation</h2>
          <p className="text-sm text-brand-gray-600 leading-relaxed">
            From product inspection to careful packaging, our team strives to deliver a refined and reliable experience from order to doorstep.
          </p>
        </div>
      </div>

      {/* Brand Statement Banner */}
      <div className="bg-brand-gray-50 border border-brand-gray-200 p-10 md:p-16 mb-20">
        <div className="max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-4">
            KRIPA KIRAN SHOE COMPANY
          </span>
          <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl leading-snug mb-6">
            Crafting a seamless footwear journey from Shahganj, Agra to your doorstep.
          </h2>
          <p className="text-brand-gray-600 text-sm md:text-base leading-relaxed mb-8">
            Operating from Agra, our focus remains on providing attentive customer support, reliable delivery, and footwear designed to elevate your daily routine.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/men"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-black text-white text-xs font-mono uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
            >
              Shop Men&apos;s Collection
            </Link>
            <Link
              href="/women"
              className="inline-flex items-center justify-center px-6 py-3 border border-black text-black text-xs font-mono uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Shop Women&apos;s Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Navigation CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-brand-gray-200 pt-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block">
            Have questions about our collections?
          </span>
          <p className="text-sm text-brand-gray-600 mt-1">
            Our customer care team is available from 10 AM to 7 PM.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-black hover:underline"
        >
          Contact Customer Care &rarr;
        </Link>
      </div>
    </main>
  );
}
