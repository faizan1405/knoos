import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Camera, Mail, Phone, MessageCircle, Home, User, Users, Info, HelpCircle, Shield, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-brand-gray-100 bg-brand-gray-50 text-brand-black">
      <Reveal className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16" yOffset={20} duration={0.6}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/knoos-logo.png"
                alt="KNOOS"
                width={150}
                height={100}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="font-serif italic text-brand-gray-600 text-sm">
              Comfort In Every Step
            </p>
            <p className="text-brand-gray-500 text-xs leading-relaxed max-w-xs">
              Premium footwear designed for everyday comfort and refined elegance by KRIPA KIRAN SHOE COMPANY.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
                Social
              </span>
              <a
                href="https://www.instagram.com/knoosshoes"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-sm text-brand-gray-600 hover:text-black transition-colors"
              >
                <Camera size={14} className="group-hover:scale-110 transition-transform" />
                <span className="font-mono font-medium text-black group-hover:underline">@KNOOSSHOES</span>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <Home size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/men" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <User size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Men</span>
                </Link>
              </li>
              <li>
                <Link href="/women" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <Users size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Women</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Information
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <Info size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <Phone size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <HelpCircle size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/returns-refunds" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <FileText size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Return &amp; Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <Shield size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="group flex items-center gap-2 text-sm text-brand-gray-600 hover:text-black transition-colors">
                  <FileText size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-brand-gray-600">
              <div className="font-medium text-black">
                KRIPA KIRAN SHOE COMPANY
              </div>
              <p className="text-xs leading-relaxed text-brand-gray-500">
                15/5 SORON KTRA SHAHGANJ<br />
                AGRA - 282010
              </p>
              <div className="pt-1 space-y-2 text-xs">
                <a href="tel:7088808882" className="group flex items-center gap-2 text-brand-gray-600 hover:text-black transition-colors">
                  <Phone size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span className="font-mono hover:underline text-black">7088808882</span>
                </a>
                <a href="https://wa.me/917088808882" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-brand-gray-600 hover:text-black transition-colors">
                  <MessageCircle size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span className="font-mono hover:underline text-black">WhatsApp</span>
                </a>
                <a href="mailto:KKSHOECOMPANY@GMAIL.COM" className="group flex items-center gap-2 text-brand-gray-600 hover:text-black transition-colors">
                  <Mail size={14} className="group-hover:scale-110 transition-transform text-brand-gray-400" />
                  <span className="font-mono hover:underline text-black">KKSHOECOMPANY@GMAIL.COM</span>
                </a>
                <div className="flex items-center gap-2 pt-1 text-brand-gray-500">
                  <Info size={14} className="text-brand-gray-400" />
                  <span className="text-black">10 AM – 7 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-gray-200 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-brand-gray-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} KNOOS (KRIPA KIRAN SHOE COMPANY). All rights reserved.
          </p>
          <p className="font-mono text-xs text-brand-gray-400 text-center sm:text-right">
            Comfort In Every Step
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
