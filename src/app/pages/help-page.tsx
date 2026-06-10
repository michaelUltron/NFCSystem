import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Contact,
  CreditCard,
  HelpCircle,
  MousePointerClick,
  Smartphone,
  User,
} from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";

const activationSteps = [
  "Tap the physical NFC card on your phone or scan the card QR code.",
  "Sign in or create an account when the activation page opens.",
  "Confirm activation under the correct personal or business account.",
  "Open the public card and test Save Contact.",
];

const profileSteps = [
  "Open My Card from the sidebar.",
  "Upload a clear profile photo and optional cover photo.",
  "Add your public username, name, role, company, and contact details.",
  "Choose a theme in My Digital Card, then preview the public card.",
  "Click Save Profile before sharing the card link.",
];

const contactSteps = [
  "Open a public digital card from an NFC tap, QR scan, or shared link.",
  "Tap Save Contact or Get My vCard.",
  "Allow the .vcf file to download or open in your phone contacts app.",
  "Review the saved name, phone, email, website, and photo before saving.",
];

const planFeatures = [
  {
    plan: "Free",
    details:
      "One active card, basic profile editing, and a 7-day trial for lead capture, themes, and branding tools.",
  },
  {
    plan: "Pro",
    details:
      "Lead capture, theme customization, better personal branding tools, and expanded personal card features.",
  },
  {
    plan: "Business",
    details:
      "Business inventory, organization branding, team card management, and business leads and analytics.",
  },
];

const troubleshootingItems = [
  {
    issue: "NFC tap does not open anything",
    fix: "Make sure NFC is enabled, tap the top/back area of the phone, remove thick cases, and try holding the card still for one second.",
  },
  {
    issue: "Card stays on checking state",
    fix: "Confirm the card UID exists in the card inventory and that the card is not blocked or disabled.",
  },
  {
    issue: "Card says unavailable",
    fix: "Check that the card is assigned to the correct user and the user has a public username saved.",
  },
  {
    issue: "Saved contact photo is missing",
    fix: "Use a public profile image URL and test on the target phone contact app. Some contact apps do not import embedded photos.",
  },
  {
    issue: "Theme or cover photo disappeared",
    fix: "Free users keep those features during the 7-day trial. After it ends, upgrade to Pro or Business to unlock them again.",
  },
];

function HelpSection({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 text-sm text-gray-700">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
              <HelpCircle className="h-4 w-4" />
              Help Center
            </div>
            <h1 className="mb-2 text-3xl font-bold">SabiCard Help</h1>
            <p className="max-w-3xl text-gray-600">
              Quick instructions for activating cards, editing profiles, saving
              contacts, understanding plans, and fixing common NFC tap issues.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <HelpSection icon={CreditCard} title="How To Activate A Card">
              <StepList steps={activationSteps} />
              <Link
                to="/activate"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Smartphone className="h-4 w-4" />
                Open Activation
              </Link>
            </HelpSection>

            <HelpSection icon={User} title="How To Edit Your Profile">
              <StepList steps={profileSteps} />
              <Link
                to="/profile"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Edit My Card
              </Link>
            </HelpSection>

            <HelpSection icon={Contact} title="How To Save A Contact">
              <StepList steps={contactSteps} />
            </HelpSection>

            <HelpSection icon={CheckCircle2} title="Plan Features">
              <div className="space-y-3">
                {planFeatures.map((feature) => (
                  <div key={feature.plan} className="rounded-lg border p-4">
                    <p className="font-semibold text-gray-900">{feature.plan}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {feature.details}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                to="/plans"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                <CreditCard className="h-4 w-4" />
                View Plans
              </Link>
            </HelpSection>
          </div>

          <section className="mt-6 rounded-xl bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-semibold">
                Troubleshooting NFC Tap Issues
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {troubleshootingItems.map((item) => (
                <div key={item.issue} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start gap-2">
                    <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <p className="font-semibold text-gray-900">{item.issue}</p>
                  </div>
                  <p className="text-sm text-gray-600">{item.fix}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
