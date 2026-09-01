import { Hero } from "@/components/hero/Hero";
import { Reveal } from "@/components/motion/Reveal";
import Image from "next/image";

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

      {/* SECTION 1 — MADE WITH INTENT */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-brand-gray-50">
        <Reveal className="max-w-7xl mx-auto">
          <p className="font-mono text-sm uppercase tracking-widest text-brand-gray-500 mb-4">WHY KNOOS</p>
          <h2 className="font-serif text-3xl md:text-4xl mb-16 uppercase">MADE WITH INTENT</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v4l3 3" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Comfort</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Cushioned footbeds and considered fit for long days on your feet.</p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7-7m7 7a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Craftsmanship</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Clean lines, careful stitching and a finish you can feel.</p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Everyday Style</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Silhouettes that move easily from work to weekend.</p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-4z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Quality Materials</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Selected leathers, knits and durable rubber outsoles.</p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-brand-gray-200 mb-6 bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Built To Move</h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">Flexible construction designed around natural movement.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION 2 — OUR QUALITY PROCESS */}
      <section className="py-24 px-6 md:px-12 lg:px-24">
        <Reveal className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-brand-gray-100 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-sm tracking-widest text-brand-gray-400">PROCESS VISUAL</span>
              </div>
            </div>
            <div>
              <p className="font-mono text-sm uppercase tracking-widest text-brand-gray-500 mb-4">PROCESS</p>
              <h2 className="font-serif text-3xl md:text-4xl mb-12">Finished with care.</h2>
              <div className="space-y-8">
                {[
                  "Material selection and inspection",
                  "Cutting and stitched construction",
                  "Comfort-focused footbed assembly",
                  "Finishing, cleaning and quality control"
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <p className="text-lg text-black font-light">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SECTION 3 — DELIVERY */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-brand-gray-50">
        <Reveal className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="font-mono text-sm uppercase tracking-widest text-brand-gray-500 mb-4">DELIVERY</p>
            <h2 className="font-serif text-3xl md:text-4xl mb-6 uppercase">CHOOSE YOUR PACE</h2>
            <p className="text-brand-gray-600">Two ways to receive your pair. Charges are shown at checkout and kept up to date by our team.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-black relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 bg-black text-white text-xs font-mono px-4 py-1 tracking-widest uppercase rounded-bl-xl">
                Primary
              </div>
              <h3 className="font-mono text-sm tracking-widest uppercase mb-4 text-brand-gray-500">FAST DELIVERY</h3>
              <p className="font-serif text-4xl mb-2">₹199</p>
              <p className="text-blue-600 font-medium mb-6">1–2 business days</p>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Priority dispatch with express courier handling and live tracking.
              </p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-brand-gray-200 hover:border-brand-gray-300 transition-colors">
              <h3 className="font-mono text-sm tracking-widest uppercase mb-4 text-brand-gray-500">NORMAL DELIVERY</h3>
              <p className="font-serif text-4xl mb-2">₹49</p>
              <p className="text-black font-medium mb-6">4–6 business days</p>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Standard dispatch with tracked delivery across India.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

