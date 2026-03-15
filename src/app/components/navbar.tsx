import { Link } from "react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import sabiLogo from "../assets/sabi-logo.png";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {/* <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div> */}
            <img src={sabiLogo} alt="SabiCard" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-xl">SabiCard</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features"className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a  href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a  href="#how-it-works" className="text-gray-600 hover:text-gray-900">
              How it works
            </a>
            <Link to="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">
              How it works
            </a>
            <Link to="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-center"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
