import { Hero } from "@/components/hero/Hero";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = {
  title: "KNOOS - Premium Footwear",
  description: "KNOOS - Premium footwear for men and women.",
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <section className="py-24 px-6 md:px-12 lg:px-24">
        <Reveal className="max-w-7xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <a href="/men" className="group block relative aspect-[4/5] bg-brand-gray-100 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-2xl tracking-wide transition-opacity duration-500">
                  Men
                </span>
              </div>
            </a>
            <a href="/women" className="group block relative aspect-[4/5] bg-brand-gray-100 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-2xl tracking-wide transition-opacity duration-500">
                  Women
                </span>
              </div>
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
