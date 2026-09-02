import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { FaqAccordion } from "@/components/faq/FaqAccordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | KNOOS",
  description: "Find answers to frequently asked questions about KNOOS footwear, shipping, returns, and more.",
};

export const revalidate = 60; // Revalidate every minute

export default async function FaqPage() {
  const faqs = await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      question: true,
      answer: true,
    }
  });

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl text-brand-black mb-6 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="font-mono text-sm uppercase tracking-widest text-brand-gray-400">
          Everything you need to know about our products and services.
        </p>
      </div>
      
      <FaqAccordion faqs={faqs} />
    </main>
  );
}
