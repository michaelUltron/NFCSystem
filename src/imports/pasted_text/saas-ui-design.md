Create a **modern SaaS web application UI** for an **NFC Digital Business Card Platform**.

IMPORTANT REQUIREMENTS:

* The design MUST be structured for **React + Tailwind CSS** development.
* The layout should translate cleanly into components so the exported code will not break when used in **Visual Studio Code**.
* Follow a **component-based structure** suitable for a React project.
* Avoid complex absolute positioning. Use **flexbox and grid layouts** compatible with Tailwind.
* Use semantic HTML structure.
* Use Tailwind utility classes where possible.

TECH STACK TARGET:
React
Tailwind CSS
Supabase (authentication + database)

GENERAL DESIGN STYLE:

* Modern SaaS dashboard
* Clean minimal UI
* Rounded corners (rounded-xl)
* Soft shadows (shadow-md / shadow-lg)
* Neutral color palette
* Primary color: indigo or blue
* Mobile responsive
* Consistent spacing using Tailwind scale

PROJECT STRUCTURE (IMPORTANT):
Design UI in a structure that can map to these React components:

/components
Navbar
Sidebar
DashboardCard
ProfileEditor
AnalyticsCard
Button
Input
Modal
NfcCardStatus

/pages
LandingPage
LoginPage
RegisterPage
DashboardPage
ProfilePage
AnalyticsPage
AdminPage

LAYOUT STRUCTURE:

1. LANDING PAGE
   Modern SaaS landing page.

Sections:

* Navbar
* Hero section
* Product explanation
* Features
* How it works
* Pricing
* Call to action
* Footer

Hero Section:
Headline: "Tap. Share. Connect."
Subheadline explaining NFC digital business cards.
CTA buttons:

* Get Started
* Buy NFC Card

Features Section (3 columns):

* Instant contact sharing
* Lead capture
* Tap analytics

How It Works Section:
Step 1: Tap NFC Card
Step 2: Profile opens
Step 3: Save contact

Pricing Section:
Free Plan
Pro Plan
Business Plan

Footer:
Links
Social icons

TAILWIND STRUCTURE:
Container centered
max-w-7xl
mx-auto
px-6
py-16

2. AUTH PAGES

LOGIN PAGE
Simple centered card layout.

Fields:
Email
Password

Buttons:
Login
Sign in with Google (placeholder)

Link:
Create account

REGISTER PAGE
Fields:
Name
Email
Password

CTA:
Create account

3. USER DASHBOARD

Dashboard layout should include:

Sidebar (fixed left)
Top navbar
Main content area

Sidebar menu items:
Dashboard
My Card
Leads
Analytics
Settings

Top Navbar:
Search bar
Notifications icon
Profile avatar dropdown

Main Dashboard Content:
Grid layout using Tailwind.

Cards:
Total taps
Leads captured
Profile views
Recent activity

Card design:
rounded-xl
shadow-md
p-6
bg-white

4. PROFILE EDITOR PAGE

Allow users to edit their digital card.

Fields:
Profile photo
Name
Company
Position
Phone
Email
Website
Bio

Social links section:
LinkedIn
Instagram
Facebook
Twitter
WhatsApp

Buttons:
Save profile
Preview card

Preview section should show how the digital business card looks when tapped.

5. DIGITAL CARD PAGE (Public page)

This is the page opened when NFC card is tapped.

Layout:
Centered card style

Profile photo
Name
Company
Position

Buttons:
Save contact
Call
Email
Visit website

Social icons section.

Design should be mobile-first because most NFC taps happen on phones.

6. ANALYTICS PAGE

Cards showing:

Total taps
Unique visitors
Leads captured

Charts placeholders.

Activity table:
Date
Device
Location

7. ADMIN DASHBOARD

Admin sidebar:

Users
Cards
Orders
Subscriptions
Analytics

Users table:
Name
Email
Plan
Status

Cards table:
Card UID
Owner
Activation status
Date activated

8. NFC CARD ACTIVATION PAGE

When user taps new card:

Page shows:
"Activate your NFC Card"

Field:
Card UID (auto-filled)

Buttons:
Create account
Activate card

9. COMPONENT DESIGN RULES

Buttons:
Primary button:
bg-indigo-600
text-white
hover:bg-indigo-700
rounded-lg
px-4
py-2

Inputs:
border
rounded-lg
px-3
py-2
w-full

Cards:
bg-white
shadow-md
rounded-xl
p-6

Spacing:
Use Tailwind spacing scale only.

10. RESPONSIVE RULES

Mobile first.

Breakpoints:
sm
md
lg
xl

Sidebar collapses on mobile.

11. SUPABASE INTEGRATION PREPARATION

Prepare forms that will connect later to Supabase tables.

Expected tables:

users
profiles
cards
taps
leads

Forms should have clear field names matching database columns.

12. FINAL OUTPUT REQUIREMENTS

Export React-friendly code structure.

Avoid inline styles.

Use Tailwind classes.

Ensure layout works when pasted into a React project.

Design must be clean and developer-friendly.

Focus on structure first, aesthetics second.

Make the UI modern but simple enough to implement quickly.
