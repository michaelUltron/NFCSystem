import { useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Trash2,
} from "lucide-react";

export function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account preferences</p>
          </div>

          <div className="max-w-4xl space-y-6">
            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">Account Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    defaultValue="johndoe"
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue="john@techcorp.com"
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                </div>

                <button className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-600">
                      Receive email updates about your card activity
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">New Lead Alerts</div>
                    <div className="text-sm text-gray-600">
                      Get notified when someone saves your contact
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Weekly Reports</div>
                    <div className="text-sm text-gray-600">
                      Receive weekly analytics summaries
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" />
                </label>
              </div>
            </div>

            {/* Billing */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">Billing & Plan</h2>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">Current Plan: Pro</div>
                    <div className="text-sm text-gray-600">
                      $12/month • Renews on Apr 14, 2026
                    </div>
                  </div>
                  <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 w-full md:w-auto">
                  Upgrade Plan
                </button>
                <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 w-full md:w-auto ml-0 md:ml-2">
                  Manage Billing
                </button>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">Privacy & Security</h2>
              </div>

              <div className="space-y-4">
                <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 w-full md:w-auto">
                  Change Password
                </button>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Public Profile</div>
                    <div className="text-sm text-gray-600">
                      Make your card visible to search engines
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-red-600">
                  Danger Zone
                </h2>
              </div>

              <div>
                <div className="mb-4">
                  <div className="font-medium">Delete Account</div>
                  <div className="text-sm text-gray-600">
                    Permanently delete your account and all data
                  </div>
                </div>
                <button className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
