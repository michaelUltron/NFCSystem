import { Link } from "react-router";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import sabiLogo from "../assets/sabi-logo.png";

type FooterProps = {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
};

export function Footer({ onOpenPrivacy, onOpenTerms }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={sabiLogo}
                alt="SabiCard"
                className="w-8 h-8 object-contain"
              />
              <span className="font-semibold text-xl">SabiCard</span>
            </div>

            <p className="text-gray-400 text-sm leading-6">
              Smart NFC digital business cards for professionals, teams, and
              businesses that want to share, connect, and grow better.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/#features" className="hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/order" className="hover:text-white">
                  Buy NFC Card
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="mailto:support-sabicardapp@gmail.com" className="hover:text-white">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:support-sabicardapp@gmail.com" className="hover:text-white">
                  Business Inquiries
                </a>
              </li>

              <li>
                <Link to="/login" className="hover:text-white">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">

              <li>
                <a
                  href="mailto:support-sabicardapp@gmail.com"
                  className="hover:text-white inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  support-sabicardapp@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2026 SabiCard. All rights reserved.
          </p>

          <div className="flex gap-4">
            <a href="https://www.facebook.com/profile.php?id=61579502916436" className="text-gray-400 hover:text-white" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.tiktok.com/@sabicard" className="text-gray-400 hover:text-white" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}