import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";
import { DashboardPage } from "./pages/dashboard-page";
import { ProfilePage } from "./pages/profile-page";
import { AnalyticsPage } from "./pages/analytics-page";
import { AdminPage } from "./pages/admin-page";
import { DigitalCardPage } from "./pages/digital-card-page";
import { ActivationPage } from "./pages/activation-page";
import { TapPage } from "./pages/tap-page";
import { LeadsPage } from "./pages/leads-page";
import { SettingsPage } from "./pages/settings-page";
import { PlansPage } from "./pages/plans-page";
import { OrderPage } from "./pages/order-page";
import { AdminOrdersPage } from "./pages/admin-orders-page";
import { ResetPasswordPage } from "./pages/reset-password-page";
import { BusinessPage } from "./pages/business-page";
import { BusinessCardsPage } from "./pages/business-cards-page";
import { OrganizationInvitesPage } from "./pages/organization-invites-page";
import { BusinessLeadsAnalyticsPage } from "./pages/business-leads-analytics-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "/leads",
    Component: LeadsPage,
  },
  {
    path: "/analytics",
    Component: AnalyticsPage,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
  {
    path: "/admin",
    Component: AdminPage,
  },
  {
    path: "/card/:username",
    Component: DigitalCardPage,
  },
  {
    path: "/tap",
    Component: TapPage,
  },
  {
    path: "/activate",
    Component: ActivationPage,
  },
  {
  path: "/plans",
  Component: PlansPage,
},
{
  path: "/order",
  Component: OrderPage,
},
{
  path: "/admin/orders",
  Component: AdminOrdersPage,
},
{
  path: "/reset-password",
  Component: ResetPasswordPage,
},
{
  path: "/business",
  Component: BusinessPage,
},
{
  path: "/business/cards",
  Component: BusinessCardsPage,
},

{
  path:"/organization-invites" ,
  Component: OrganizationInvitesPage
},
{

  path:"/business-leads-analytics",
   Component: BusinessLeadsAnalyticsPage
}

]);