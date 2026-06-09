import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SELLER_GUIDE_BASE_URL || "https://www.sabicard.app";
const sellerEmail = process.env.SELLER_GUIDE_SELLER_EMAIL;
const sellerPassword = process.env.SELLER_GUIDE_SELLER_PASSWORD;
const customerEmail =
  process.env.SELLER_GUIDE_CUSTOMER_EMAIL ||
  `sabicardapp+guide-${Date.now()}@gmail.com`;
const customerPassword = process.env.SELLER_GUIDE_CUSTOMER_PASSWORD || "Guide.12345";
const customerName = process.env.SELLER_GUIDE_CUSTOMER_NAME || "SabiCard Guide Customer";
const rebuildOnly = process.env.SELLER_GUIDE_REBUILD_ONLY === "1";
const rebuildCardUid = process.env.SELLER_GUIDE_CARD_UID || "SC758300";

if (!sellerEmail || !sellerPassword) {
  throw new Error(
    "Set SELLER_GUIDE_SELLER_EMAIL and SELLER_GUIDE_SELLER_PASSWORD before running."
  );
}

const docsDir = path.resolve("docs");
const shotDir = path.join(docsDir, "seller-guide-assets");
const logoPath = path.resolve("public", "sabi-logo.png");

async function ensureDirs() {
  await fs.rm(shotDir, { recursive: true, force: true });
  await fs.mkdir(shotDir, { recursive: true });
}

function shot(name) {
  return path.join(shotDir, name);
}

async function screenshot(page, name) {
  await page.screenshot({
    path: shot(name),
    fullPage: true,
  });
}

async function clearAnnotations(page) {
  await page.evaluate(() => {
    document.querySelectorAll("[data-guide-marker]").forEach((node) => node.remove());
  });
}

async function mark(page, locator, label, number) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;

  await page.evaluate(
    ({ box, label, number }) => {
      const marker = document.createElement("div");
      marker.setAttribute("data-guide-marker", "true");
      marker.style.position = "fixed";
      marker.style.left = `${box.x - 6}px`;
      marker.style.top = `${box.y - 6}px`;
      marker.style.width = `${box.width + 12}px`;
      marker.style.height = `${box.height + 12}px`;
      marker.style.border = "3px solid #06b6d4";
      marker.style.borderRadius = "12px";
      marker.style.boxShadow = "0 0 0 9999px rgba(15, 23, 42, 0.12)";
      marker.style.pointerEvents = "none";
      marker.style.zIndex = "999998";

      const badge = document.createElement("div");
      badge.setAttribute("data-guide-marker", "true");
      badge.textContent = `${number}. ${label}`;
      badge.style.position = "fixed";
      badge.style.left = `${box.x}px`;
      badge.style.top = `${Math.max(8, box.y - 38)}px`;
      badge.style.background = "#06b6d4";
      badge.style.color = "#ffffff";
      badge.style.borderRadius = "999px";
      badge.style.font = "700 13px Arial, sans-serif";
      badge.style.padding = "8px 12px";
      badge.style.pointerEvents = "none";
      badge.style.zIndex = "999999";
      badge.style.boxShadow = "0 10px 20px rgba(2, 132, 199, 0.25)";

      document.body.appendChild(marker);
      document.body.appendChild(badge);
    },
    { box, label, number }
  );
}

async function cleanLogin(page, email, password, shotName = "02-login.png") {
  await page.goto(`${baseUrl}/login?guide=${Date.now()}`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  const signIn = page.getByRole("button", { name: /^Sign In$/ });
  await mark(page, signIn, "Sign in", 1);
  await screenshot(page, shotName);
  await clearAnnotations(page);
  await signIn.click();
  await page.waitForTimeout(3000);
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function signOut(page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  const signOutButton = page.getByRole("button", { name: /Sign Out/i });
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await page.waitForTimeout(1200);
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function registerCustomer(page) {
  await page.goto(`${baseUrl}/register?next=${encodeURIComponent("/dashboard")}`, {
    waitUntil: "networkidle",
  });
  await page.locator("#fullName").fill(customerName);
  await page.locator("#email").fill(customerEmail);
  await page.locator("#password").fill(customerPassword);
  await page.locator("#confirmPassword").fill(customerPassword);
  const createButton = page.getByRole("button", { name: /Create Account/i });
  await mark(page, createButton, "Create customer account", 1);
  await screenshot(page, "01-register.png");
  await clearAnnotations(page);
  await createButton.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function createSellerCard(page) {
  await page.goto(`${baseUrl}/seller?guide=${Date.now()}`, {
    waitUntil: "networkidle",
  });

  const inactive = await page
    .getByText("Seller access is not active.")
    .isVisible()
    .catch(() => false);
  if (inactive) {
    throw new Error("Seller access is not active for this account.");
  }

  await screenshot(page, "03-seller-dashboard.png");

  const cardInput = page.locator('input[placeholder="SC123456"]').first();
  await cardInput.scrollIntoViewIfNeeded();
  const cardUid = (await cardInput.inputValue()).trim();
  if (!cardUid) throw new Error("Could not read generated card UID.");

  const registerButton = page.getByRole("button", {
    name: /Register and Use 1 Credit/i,
  });
  await mark(page, registerButton, "Register card and spend 1 credit", 1);
  await screenshot(page, "04-register-card-before-click.png");
  await clearAnnotations(page);
  await registerButton.click();
  await page.waitForTimeout(2500);
  await page.waitForLoadState("networkidle").catch(() => {});

  await page.getByText(cardUid).first().scrollIntoViewIfNeeded().catch(() => {});
  await screenshot(page, "05-card-created.png");

  const copyButton = page.getByRole("button", { name: /Copy URL/i }).first();
  const encodeButton = page.getByRole("button", { name: /Encode NFC/i }).first();
  await mark(page, copyButton, "Copy tap URL", 1);
  await mark(page, encodeButton, "Encode NFC tag", 2);
  await screenshot(page, "06-encoding-actions.png");
  await clearAnnotations(page);

  return cardUid;
}

async function activateCardAsCustomer(page, cardUid) {
  await signOut(page);
  await registerCustomer(page);
  await cleanLogin(page, customerEmail, customerPassword, "07-customer-login.png");

  await page.goto(`${baseUrl}/activate?uid=${encodeURIComponent(cardUid)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  const confirmButton = page.getByRole("button", { name: /Confirm Activation/i });
  await mark(page, confirmButton, "Confirm activation", 1);
  await screenshot(page, "08-confirm-activation.png");
  await clearAnnotations(page);
  await confirmButton.click();
  await page.waitForTimeout(3000);
  await page.waitForLoadState("networkidle").catch(() => {});
  await screenshot(page, "09-activation-complete.png");
}

function termsSection() {
  return `
    <h2 class="page-break">Terms and Conditions for Sellers</h2>
    <div class="terms-grid">
      <section>
        <h3>Seller Approval</h3>
        <p>Seller access is granted by SabiCard. A normal user account does not automatically receive seller privileges. SabiCard may approve, reject, suspend, or reactivate seller access based on platform policy.</p>
      </section>
      <section>
        <h3>Credit Usage</h3>
        <p>One successful card registration consumes one seller credit. Credits are deducted when the card is registered in the platform, before the card is sold or activated by a customer.</p>
      </section>
      <section>
        <h3>Card Responsibility</h3>
        <p>The seller is responsible for encoding the correct tap URL to the correct physical NFC card. The seller must verify the card after encoding before giving it to a customer.</p>
      </section>
      <section>
        <h3>Customer Ownership</h3>
        <p>Customers create and manage their own accounts. Sellers must not create customer accounts without consent, collect passwords, or impersonate customers.</p>
      </section>
      <section>
        <h3>Acceptable Use</h3>
        <p>Sellers must not use SabiCard for spam, fraud, misleading claims, unauthorized reselling, malicious links, or content that violates applicable law or platform rules.</p>
      </section>
      <section>
        <h3>Support and Adjustments</h3>
        <p>Credit adjustments, replacement cards, disputed activations, and ownership transfer requests are subject to SabiCard review. SabiCard may inspect ledger history and card activity when resolving support cases.</p>
      </section>
      <section>
        <h3>Suspension</h3>
        <p>SabiCard may suspend seller card creation for abuse, suspicious activity, unpaid usage, customer complaints, or violation of these conditions. Existing active customer cards may remain available unless security requires otherwise.</p>
      </section>
      <section>
        <h3>Data Privacy</h3>
        <p>Sellers can monitor cards and related activation details available in their dashboard. Sellers must protect customer information and use it only for legitimate card support and service purposes.</p>
      </section>
    </div>
  `;
}

function quickStartSection() {
  return `
    <h2>Quick Start Checklist</h2>
    <div class="checklist">
      <div><span>1</span> Sign in to the approved seller account.</div>
      <div><span>2</span> Confirm available seller credits.</div>
      <div><span>3</span> Generate or enter a Card UID.</div>
      <div><span>4</span> Click <strong>Register and Use 1 Credit</strong>.</div>
      <div><span>5</span> Encode the NFC card using Encode NFC or Copy URL.</div>
      <div><span>6</span> Test the physical card before release.</div>
      <div><span>7</span> Give the card to the customer.</div>
      <div><span>8</span> Customer creates/signs in and confirms activation.</div>
      <div><span>9</span> Confirm the card appears as activated in Seller Cards.</div>
    </div>
  `;
}

function workflowSection() {
  return `
    <h2>Seller Workflow</h2>
    <div class="workflow">
      <div><strong>Register Card</strong><br />Seller creates card record.</div>
      <div class="arrow">→</div>
      <div><strong>Credit Deducted</strong><br />1 credit is consumed.</div>
      <div class="arrow">→</div>
      <div><strong>Encode NFC</strong><br />Tap URL is written to card.</div>
      <div class="arrow">→</div>
      <div><strong>Customer Activates</strong><br />User account claims the card.</div>
      <div class="arrow">→</div>
      <div><strong>Dashboard Updates</strong><br />Card becomes activated.</div>
    </div>
  `;
}

function troubleshootingSection() {
  return `
    <h2 class="page-break">Troubleshooting</h2>
    <table>
      <thead>
        <tr><th>Issue</th><th>Likely Cause</th><th>Recommended Action</th></tr>
      </thead>
      <tbody>
        <tr><td>NFC writing is not supported</td><td>Browser or device does not support Web NFC.</td><td>Use Chrome on Android over HTTPS, or copy the tap URL and write it with another NFC writer app.</td></tr>
        <tr><td>Seller has no credits</td><td>Credit balance is zero.</td><td>Contact SabiCard admin to top up seller credits before registering more cards.</td></tr>
        <tr><td>Card tap opens the wrong page</td><td>Wrong URL was encoded to the physical NFC card.</td><td>Copy the tap URL from the seller dashboard and rewrite the NFC card.</td></tr>
        <tr><td>Card is already activated</td><td>The card was claimed by a customer account.</td><td>Do not reuse the card. Contact support if activation was accidental or disputed.</td></tr>
        <tr><td>Card registered but not encoded</td><td>The digital card exists but the physical NFC tag was not written.</td><td>Find the card in Seller Cards, then use Encode NFC or Copy URL.</td></tr>
        <tr><td>Customer cannot log in</td><td>Incorrect password, unverified email, or account issue.</td><td>Ask the customer to use password reset or contact SabiCard support.</td></tr>
        <tr><td>Card does not appear in dashboard</td><td>The card may belong to another seller or registration failed.</td><td>Search by Card UID. If missing, confirm credits and retry registration.</td></tr>
      </tbody>
    </table>
  `;
}

function requirementsAndTestingSection() {
  return `
    <h2 class="page-break">Device Requirements</h2>
    <div class="terms-grid">
      <section>
        <h3>Recommended Setup</h3>
        <ul>
          <li>Android phone with NFC support.</li>
          <li>Chrome browser.</li>
          <li>NFC enabled in device settings.</li>
          <li>Stable internet connection.</li>
          <li>Writable NFC card or tag.</li>
          <li>SabiCard opened over HTTPS.</li>
        </ul>
      </section>
      <section>
        <h3>Important Notes</h3>
        <ul>
          <li>Browser-based NFC writing may not work on all iPhones.</li>
          <li>If Web NFC is unavailable, use Copy URL and a compatible NFC writer app.</li>
          <li>Keep the card still near the phone until writing completes.</li>
          <li>Always test the card before giving it to the customer.</li>
        </ul>
      </section>
    </div>

    <h2>Card Testing Procedure</h2>
    <ol>
      <li>After encoding, tap the physical card with a phone.</li>
      <li>Confirm the URL opens <code>${baseUrl}/tap?uid=...</code>.</li>
      <li>Confirm an unassigned card redirects to activation.</li>
      <li>Do not activate the card using the seller account.</li>
      <li>Give the card to the customer only after the tap test succeeds.</li>
    </ol>
  `;
}

function creditLedgerSection() {
  return `
    <h2>Credit Ledger Example</h2>
    <p>The seller credit balance is calculated from a ledger. Every top-up and every card registration creates a transaction record.</p>
    <table>
      <thead>
        <tr><th>Action</th><th>Credit Change</th><th>Balance</th></tr>
      </thead>
      <tbody>
        <tr><td>Admin adds seller credits</td><td>+100</td><td>100</td></tr>
        <tr><td>Seller registers one card</td><td>-1</td><td>99</td></tr>
        <tr><td>Seller registers another card</td><td>-1</td><td>98</td></tr>
        <tr><td>Admin support adjustment</td><td>+1</td><td>99</td></tr>
      </tbody>
    </table>
  `;
}

function doDontSection() {
  return `
    <h2 class="page-break">Seller Policy Summary</h2>
    <div class="do-dont">
      <section class="do">
        <h3>Do</h3>
        <ul>
          <li>Register cards only for real customer transactions.</li>
          <li>Test every encoded card before release.</li>
          <li>Protect customer information.</li>
          <li>Use the official tap URL from the dashboard.</li>
          <li>Contact support for replacements or disputed activations.</li>
        </ul>
      </section>
      <section class="dont">
        <h3>Do Not</h3>
        <ul>
          <li>Share your seller login with unauthorized users.</li>
          <li>Create customer accounts without customer consent.</li>
          <li>Reuse cards that are already activated.</li>
          <li>Encode misleading, unsafe, or unauthorized links.</li>
          <li>Continue selling after suspension or credit exhaustion.</li>
        </ul>
      </section>
    </div>
  `;
}

function supportAndGlossarySection() {
  return `
    <h2>Support Escalation</h2>
    <p>Contact SabiCard admin or support when any of these situations happen:</p>
    <ul>
      <li>Seller needs additional credits or credit adjustment.</li>
      <li>Wrong customer activated a card.</li>
      <li>A card is lost, defective, or needs replacement.</li>
      <li>NFC encoding repeatedly fails across supported devices.</li>
      <li>Customer reports duplicate activation or unauthorized card usage.</li>
      <li>Suspicious account, card, or activation activity appears.</li>
    </ul>

    <h2>Glossary</h2>
    <table>
      <tbody>
        <tr><th>Card UID</th><td>The unique card identifier used by SabiCard.</td></tr>
        <tr><th>Tap URL</th><td>The URL written to the physical NFC card.</td></tr>
        <tr><th>Activation</th><td>The process where a customer claims a card to their own account.</td></tr>
        <tr><th>Seller Credits</th><td>Credits consumed when sellers register new cards.</td></tr>
        <tr><th>Registered Card</th><td>A card created in the seller dashboard but not necessarily activated by a customer.</td></tr>
        <tr><th>Activated Card</th><td>A registered card that has been claimed by a customer account.</td></tr>
        <tr><th>NFC Encoding</th><td>Writing the SabiCard tap URL to the physical NFC tag or card.</td></tr>
        <tr><th>Customer Account</th><td>The end user's personal SabiCard account.</td></tr>
      </tbody>
    </table>
  `;
}

async function logoDataUri() {
  const logo = await fs.readFile(logoPath);
  return `data:image/png;base64,${logo.toString("base64")}`;
}

async function buildPdf(cardUid) {
  const logo = await logoDataUri();
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SabiCard Seller Guide</title>
  <style>
    @page { size: A4; margin: 22mm 16mm 20mm; }
    * { box-sizing: border-box; }
    body {
      color: #101828;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
    }
    .doc-header, .doc-footer {
      align-items: center;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      left: 0;
      position: fixed;
      right: 0;
      z-index: 10;
    }
    .doc-header {
      border-bottom: 1px solid #d7eef8;
      height: 48px;
      top: -16mm;
    }
    .doc-footer {
      border-top: 1px solid #d7eef8;
      bottom: -14mm;
      color: #667085;
      font-size: 10px;
      height: 36px;
    }
    .brand {
      align-items: center;
      color: #0f172a;
      display: flex;
      font-size: 15px;
      font-weight: 700;
      gap: 8px;
    }
    .brand img { height: 26px; width: 26px; object-fit: contain; }
    .doc-title { color: #06b6d4; font-weight: 700; }
    h1 { color: #0f172a; font-size: 30px; margin: 0 0 8px; }
    h2 {
      border-bottom: 2px solid #d7eef8;
      color: #0f172a;
      font-size: 18px;
      margin: 26px 0 10px;
      padding-bottom: 6px;
    }
    h3 { color: #164e63; font-size: 14px; margin: 14px 0 6px; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 8px 0 12px 20px; padding: 0; }
    li { margin: 4px 0; }
    .cover {
      background: linear-gradient(135deg, #ecfeff 0%, #ffffff 58%, #f0f9ff 100%);
      border: 1px solid #cffafe;
      border-radius: 14px;
      margin-top: 8px;
      padding: 28px;
    }
    .cover-mark {
      color: #06b6d4;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .muted { color: #667085; }
    .meta {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(2, 1fr);
      margin-top: 16px;
      padding: 12px;
    }
    .callout {
      background: #ecfeff;
      border: 1px solid #67e8f9;
      border-radius: 10px;
      color: #155e75;
      margin: 12px 0;
      padding: 12px;
    }
    .policy, .terms-grid section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      margin: 10px 0;
      padding: 12px;
    }
    .terms-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, 1fr);
    }
    .checklist {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(3, 1fr);
      margin: 12px 0 18px;
    }
    .checklist div {
      background: #ffffff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      min-height: 68px;
      padding: 10px;
    }
    .checklist span {
      background: #06b6d4;
      border-radius: 999px;
      color: #ffffff;
      display: inline-flex;
      font-size: 11px;
      font-weight: 700;
      height: 22px;
      justify-content: center;
      margin-right: 6px;
      width: 22px;
    }
    .workflow {
      align-items: stretch;
      display: grid;
      gap: 8px;
      grid-template-columns: 1fr 20px 1fr 20px 1fr 20px 1fr 20px 1fr;
      margin: 12px 0 18px;
    }
    .workflow div:not(.arrow) {
      background: #f0f9ff;
      border: 1px solid #7dd3fc;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
    }
    .workflow .arrow {
      align-items: center;
      color: #06b6d4;
      display: flex;
      font-size: 18px;
      font-weight: 700;
      justify-content: center;
    }
    .do-dont {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(2, 1fr);
    }
    .do-dont section {
      border-radius: 12px;
      padding: 14px;
    }
    .do {
      background: #f0fdf4;
      border: 1px solid #86efac;
    }
    .dont {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    table {
      border-collapse: collapse;
      margin: 12px 0 18px;
      width: 100%;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f0f9ff;
      color: #164e63;
      font-weight: 700;
    }
    .shot {
      border: 1px solid #d1d5db;
      border-radius: 10px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      margin: 10px 0 18px;
      max-width: 100%;
      width: 100%;
    }
    .page-break { break-before: page; }
    .caption {
      color: #475467;
      font-size: 11px;
      margin-top: -10px;
    }
    code {
      background: #eef2ff;
      border-radius: 4px;
      color: #3730a3;
      font-family: Consolas, monospace;
      padding: 2px 4px;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="brand"><img src="${logo}" /> SabiCard</div>
    <div class="doc-title">Seller Guide</div>
  </div>
  <div class="doc-footer">
    <span>Generated from live SabiCard screenshots</span>
    <span>${generatedDate}</span>
  </div>

  <section class="cover">
    <div class="cover-mark">Seller Operating Manual</div>
    <h1>SabiCard Seller Guide</h1>
    <p class="muted">A practical walkthrough for seller account access, live card creation, NFC encoding, customer activation, credit rules, and platform conditions.</p>
    <div class="meta">
      <div><strong>Live demo card:</strong><br />${cardUid}</div>
      <div><strong>Application:</strong><br />${baseUrl}</div>
      <div><strong>Seller account:</strong><br />${sellerEmail}</div>
      <div><strong>Customer activation:</strong><br />Completed with a live guide account</div>
    </div>
  </section>

  ${quickStartSection()}
  ${workflowSection()}

  <h2>1. Seller Account Registration</h2>
  <p>A seller starts with a normal SabiCard account. Seller privileges are granted by the platform after review.</p>
  <ol>
    <li>Open the registration page.</li>
    <li>Enter full name, email, password, and confirmation password.</li>
    <li>Submit the form and sign in after the account is created.</li>
  </ol>
  <img class="shot" src="seller-guide-assets/01-register.png" />
  <p class="caption">Marker 1 shows the Create Account action.</p>

  <h2>2. Sign In</h2>
  <p>The seller signs in using the account that has approved seller access.</p>
  <img class="shot" src="seller-guide-assets/02-login.png" />

  <h2 class="page-break">3. Seller Dashboard</h2>
  <p>The Seller Dashboard shows the seller credit balance, total cards, unactivated cards, activated cards, and the card registration form.</p>
  <img class="shot" src="seller-guide-assets/03-seller-dashboard.png" />

  <h2>4. Create a Live Card</h2>
  <p>This guide created a live card record in production. The seller uses the generated Card UID and clicks <strong>Register and Use 1 Credit</strong>.</p>
  <div class="callout">
    Card used in this guide: <strong>${cardUid}</strong>. One credit was consumed when this card was successfully registered.
  </div>
  <img class="shot" src="seller-guide-assets/04-register-card-before-click.png" />
  <p class="caption">Marker 1 shows the button that registers the live card and deducts one credit.</p>

  <h2 class="page-break">5. Card Created</h2>
  <p>After registration, the card appears in the Seller Cards list. At this stage the card is ready to be encoded or copied into an NFC writer.</p>
  <img class="shot" src="seller-guide-assets/05-card-created.png" />

  <h2>6. Encode the NFC Card</h2>
  <p>The seller writes the card tap URL to the physical NFC card. On supported devices, use <strong>Encode NFC</strong>. If Web NFC is unavailable, use <strong>Copy URL</strong> and write it with another NFC writer.</p>
  <ol>
    <li>Use Chrome on Android over HTTPS with NFC enabled for Web NFC writing.</li>
    <li>Keep the physical card close to the phone until writing completes.</li>
    <li>Test the card by tapping it after encoding.</li>
  </ol>
  <img class="shot" src="seller-guide-assets/06-encoding-actions.png" />
  <p class="caption">Marker 1 shows Copy URL. Marker 2 shows Encode NFC.</p>

  <h2 class="page-break">7. Customer Activation</h2>
  <p>The customer taps the encoded card, signs in or creates an account, and confirms activation. The card becomes assigned to that customer and remains linked to the seller who registered it.</p>
  <img class="shot" src="seller-guide-assets/08-confirm-activation.png" />
  <p class="caption">Marker 1 shows the customer confirmation button for the live card.</p>

  <h2>8. Activation Complete</h2>
  <p>After confirmation, SabiCard opens the activated card destination or dashboard. The seller dashboard can now count the card as activated.</p>
  <img class="shot" src="seller-guide-assets/09-activation-complete.png" />

  <h2 class="page-break">Credit Rules</h2>
  <div class="policy">
    <h3>How Credits Work</h3>
    <ul>
      <li>One successful card registration consumes one seller credit.</li>
      <li>Credits are deducted when the seller registers the card in SabiCard, not when the customer later activates it.</li>
      <li>Failed NFC writing does not deduct another credit because the card record already exists.</li>
      <li>Credit changes are tracked in a ledger for audit history.</li>
    </ul>
  </div>
  <div class="policy">
    <h3>Operational Policy</h3>
    <ul>
      <li>Sellers should confirm the card UID and tap URL before giving cards to customers.</li>
      <li>A card should not be reused for multiple customers after activation.</li>
      <li>Replacement cards normally require a new card registration and credit unless SabiCard grants a support adjustment.</li>
      <li>Suspended sellers cannot issue new cards until reactivated by SabiCard.</li>
    </ul>
  </div>
  ${creditLedgerSection()}
  ${requirementsAndTestingSection()}
  ${troubleshootingSection()}
  ${doDontSection()}
  ${supportAndGlossarySection()}

  ${termsSection()}
</body>
</html>`;

  const htmlPath = path.join(docsDir, "seller-guide.html");
  await fs.writeFile(htmlPath, html, "utf8");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });
  await page.pdf({
    path: path.join(docsDir, "seller-guide.pdf"),
    format: "A4",
    printBackground: true,
  });
  await browser.close();
}

async function main() {
  if (rebuildOnly) {
    await buildPdf(rebuildCardUid);
    console.log(`Rebuilt seller guide for card ${rebuildCardUid}`);
    return;
  }

  await ensureDirs();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  await cleanLogin(page, sellerEmail, sellerPassword);
  const cardUid = await createSellerCard(page);
  await activateCardAsCustomer(page, cardUid);
  await browser.close();

  await buildPdf(cardUid);
  console.log(`Generated seller guide for live card ${cardUid}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
