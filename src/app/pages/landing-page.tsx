import { Link } from "react-router";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import sabiLogo from "../assets/sabi_banner.jpg";

import {
  Zap,
  Users,
  BarChart3,
  Smartphone,
  Share2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Tap. Share. Connect.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform the way you network with NFC digital business cards.
              Share your contact information instantly with a single tap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-6 py-3 text-center inline-flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/#pricing"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 text-center"
              >
                Buy NFC Card
              </Link>
            </div>
          </div>
          <div className="relative">
            <ImageWithFallback
              src={sabiLogo}
              alt="NFC Business Card"
              className="rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose SabiCard?</h2>
            <p className="text-xl text-gray-600">
              Everything you need to network smarter and track your connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Instant Contact Sharing
              </h3>
              <p className="text-gray-600">
                Share your complete contact information with a single tap. No
                app required for recipients.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lead Capture</h3>
              <p className="text-gray-600">
                Capture leads automatically when someone taps your card. Build
                your network effortlessly.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tap Analytics</h3>
              <p className="text-gray-600">
                Track every tap, view detailed analytics, and understand how
                people engage with your card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Getting started is simple and takes less than 5 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <div className="mb-4">
                <Smartphone className="w-12 h-12 text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tap NFC Card</h3>
              <p className="text-gray-600">
                Hold your NFC card near any smartphone to activate
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <div className="mb-4">
                <Share2 className="w-12 h-12 text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Profile Opens</h3>
              <p className="text-gray-600">
                Your digital business card opens instantly on their phone
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <div className="mb-4">
                <CheckCircle className="w-12 h-12 text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Contact</h3>
              <p className="text-gray-600">
                They save your contact with one click. Connection made!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>1 Digital Card</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Basic Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Up to 100 taps/month</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full text-center border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-indigo-600 text-white rounded-xl p-8 shadow-lg transform scale-105">
              <div className="text-center mb-2">
                <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                  POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-indigo-100">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Unlimited Digital Cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Advanced Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Unlimited Taps</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Lead Capture</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Custom Branding</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full text-center bg-white text-indigo-600 hover:bg-gray-50 rounded-lg px-6 py-3"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Business Plan */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold mb-2">Business</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Team Management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>API Access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full text-center border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Networking?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of professionals using SabiCard to make better
            connections
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-8 py-4 text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
