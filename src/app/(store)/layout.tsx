import { Header } from "@/components/header/Header";
import { Footer } from "@/components/footer/Footer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow pt-16">
        {children}
      </div>
      <Footer />
    </div>
  );
}
