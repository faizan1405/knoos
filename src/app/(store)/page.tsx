import { Hero } from "@/components/hero/Hero";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { RevealImage } from "@/components/motion/RevealImage";
import { StaggerContainer } from "@/components/motion/StaggerContainer";
import { StaggerItem } from "@/components/motion/StaggerItem";
import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata = {
  title: "KNOOS - Premium Footwear",
  description: "KNOOS - Premium footwear for men and women.",
};

export default async function HomePage() {
  const allProducts = await getProducts({});
  
  // Since we don't have actual sales data, we'll use a curated selection (first 4 products) as a fallback for Best Sellers.
  const bestSellers = allProducts.slice(0, 4);

  return (
    <main>
      <Hero />
      
      <section className="py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <RevealText as="h2" text="Shop by Category" className="font-serif text-3xl md:text-4xl mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RevealImage delay={0} scaleFrom={1.04} className="h-full">
              <Link href="/men" className="group block relative h-full aspect-[4/5] bg-brand-gray-100 overflow-hidden">
                <Image 
                  src="/images/men-category.jpg" 
                  alt="Men's Footwear" 
                  fill 
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 flex flex-col items-start transition-transform duration-700 ease-out group-hover:-translate-y-2">
                  <span className="font-serif text-3xl md:text-4xl text-white mb-3 tracking-wide">
                    Men
                  </span>
                  <span className="font-mono text-xs md:text-sm uppercase tracking-widest text-white/90 flex items-center gap-2">
                    Shop Men <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
                  </span>
                </div>
              </Link>
            </RevealImage>
            <RevealImage delay={0.1} scaleFrom={1.04} className="h-full">
              <Link href="/women" className="group block relative h-full aspect-[4/5] bg-brand-gray-100 overflow-hidden">
                <Image 
                  src="/images/women-category.jpg" 
                  alt="Women's Footwear" 
                  fill 
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 flex flex-col items-start transition-transform duration-700 ease-out group-hover:-translate-y-2">
                  <span className="font-serif text-3xl md:text-4xl text-white mb-3 tracking-wide">
                    Women
                  </span>
                  <span className="font-mono text-xs md:text-sm uppercase tracking-widest text-white/90 flex items-center gap-2">
                    Shop Women <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
                  </span>
                </div>
              </Link>
            </RevealImage>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <RevealText as="h2" text="BEST SELLERS" className="font-serif text-3xl md:text-4xl uppercase mb-3" />
                <Reveal delay={0.15}>
                  <p className="text-brand-gray-600 text-sm md:text-base">Our most-loved pairs, chosen for everyday comfort and style.</p>
                </Reveal>
              </div>
              <Reveal delay={0.25}>
                <Link href="/search" className="font-mono text-xs uppercase tracking-widest text-brand-gray-500 hover:text-brand-black transition-colors group flex items-center gap-2 pb-1 border-b border-transparent hover:border-brand-black">
                  View All <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                </Link>
              </Reveal>
            </div>
            <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {bestSellers.map((product) => (
                <StaggerItem key={product.id} yOffset={30}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* SECTION 1 — MADE WITH INTENT */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-brand-gray-50">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="font-mono text-sm uppercase tracking-widest text-brand-gray-500 mb-4">WHY KNOOS</p>
          </Reveal>
          <RevealText as="h2" text="MADE WITH INTENT" delay={0.1} className="font-serif text-3xl md:text-4xl mb-16 uppercase" />
          
          <StaggerContainer staggerDelay={0.08} delayChildren={0.2} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <StaggerItem yOffset={25} className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v4l3 3" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Comfort</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Cushioned footbeds and considered fit for long days on your feet.</p>
            </StaggerItem>
            <StaggerItem yOffset={25} className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7-7m7 7a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Craftsmanship</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Clean lines, careful stitching and a finish you can feel.</p>
            </StaggerItem>
            <StaggerItem yOffset={25} className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Everyday Style</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Silhouettes that move easily from work to weekend.</p>
            </StaggerItem>
            <StaggerItem yOffset={25} className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-4z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Quality Materials</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Selected leathers, knits and durable rubber outsoles.</p>
            </StaggerItem>
            <StaggerItem yOffset={25} className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Built To Move</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Flexible construction designed around natural movement.</p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* SECTION 2 — OUR QUALITY PROCESS */}
      <section className="py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <RevealImage scaleFrom={1.05} className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-brand-gray-100 rounded-3xl overflow-hidden">
              <Image src="/images/process-footwear.jpg" alt="Craftsmanship Process" fill className="object-cover" />
            </RevealImage>
            <div>
              <RevealText as="p" text="PROCESS" className="font-mono text-sm uppercase tracking-widest text-brand-gray-500 mb-4" />
              <RevealText as="h2" text="Finished with care." delay={0.1} className="font-serif text-3xl md:text-4xl mb-12" />
              <StaggerContainer delayChildren={0.2} staggerDelay={0.1} className="space-y-8">
                {[
                  "Material selection and inspection",
                  "Cutting and stitched construction",
                  "Comfort-focused footbed assembly",
                  "Finishing, cleaning and quality control"
                ].map((step, idx) => (
                  <StaggerItem key={idx} yOffset={20} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <p className="text-lg text-black font-light">{step}</p>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — DELIVERY */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-brand-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <RevealText as="p" text="DELIVERY" className="font-mono text-sm uppercase tracking-widest text-brand-gray-500 mb-4" />
            <RevealText as="h2" text="CHOOSE YOUR PACE" delay={0.1} className="font-serif text-3xl md:text-4xl mb-6 uppercase" />
            <Reveal delay={0.2}>
              <p className="text-brand-gray-600">Two ways to receive your pair. Charges are shown at checkout and kept up to date by our team.</p>
            </Reveal>
          </div>
          
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <StaggerItem yOffset={30} className="bg-white rounded-3xl p-8 md:p-12 border-2 border-black relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 bg-black text-white text-xs font-mono px-4 py-1 tracking-widest uppercase rounded-bl-xl">
                Primary
              </div>
              <h3 className="font-mono text-sm tracking-widest uppercase mb-4 text-brand-gray-500">FAST DELIVERY</h3>
              <p className="font-serif text-4xl mb-2">₹199</p>
              <p className="text-blue-600 font-medium mb-6">1–2 business days</p>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Priority dispatch with express courier handling and live tracking.
              </p>
            </StaggerItem>
            
            <StaggerItem yOffset={30} className="bg-white rounded-3xl p-8 md:p-12 border border-brand-gray-200 hover:border-brand-gray-300 transition-colors">
              <h3 className="font-mono text-sm tracking-widest uppercase mb-4 text-brand-gray-500">NORMAL DELIVERY</h3>
              <p className="font-serif text-4xl mb-2">₹49</p>
              <p className="text-black font-medium mb-6">4–6 business days</p>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Standard dispatch with tracked delivery across India.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
    </main>
  );
}

