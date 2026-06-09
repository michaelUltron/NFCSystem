import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SELLER_GUIDE_BASE_URL || "https://www.sabicard.app";
const sellerOnly = process.env.SELLER_GUIDE_SELLER_ONLY === "1";
const adminEmail = process.env.SELLER_GUIDE_ADMIN_EMAIL;
const adminPassword = process.env.SELLER_GUIDE_ADMIN_PASSWORD;
const sellerEmail = process.env.SELLER_GUIDE_SELLER_EMAIL || process.env.SELLER_GUIDE_EMAIL;
const sellerPassword =
  process.env.SELLER_GUIDE_SELLER_PASSWORD || process.env.SELLER_GUIDE_PASSWORD;

if (!sellerEmail || !sellerPassword) {
  throw new Error(
    "Set SELLER_GUIDE_SELLER_EMAIL and SELLER_GUIDE_SELLER_PASSWORD before running."
  );
}

if (!sellerOnly && (!adminEmail || !adminPassword)) {
  throw new Error(
    "Set SELLER_GUIDE_ADMIN_EMAIL and SELLER_GUIDE_ADMIN_PASSWORD, or set SELLER_GUIDE_SELLER_ONLY=1."
  );
}

const docsDir = path.resolve("docs");
const shotDir = path.join(docsDir, "seller-guide-assets");

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

async function login(page, loginEmail, loginPassword) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#email").fill(loginEmail);
  await page.locator("#password").fill(loginPassword);
  await screenshot(page, "02-login.png");
  await page.getByRole("button", { name: /^Sign In$/ }).click();
  await page.waitForTimeout(3000);
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function logout(page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  const signOut = page.getByRole("button", { name: /Sign Out/i });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}

async function dismissDialog(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator('[aria-label="Close user picker"]').click().catch(() => {});
}

async function activateCurrentAccountAsSeller(page) {
  await page.goto(`${baseUrl}/admin/sellers`, { waitUntil: "networkidle" });
  await screenshot(page, "03-admin-sellers.png");

  await page.getByRole("button", { name: /Find/i }).click();
  await page.getByPlaceholder("seller@example.com").fill(sellerEmail);
  await page.waitForTimeout(1000);
  await screenshot(page, "04-user-picker.png");

  const userCards = page.locator("button", { hasText: sellerEmail });
  if ((await userCards.count()) > 0) {
    await userCards.first().click();
  } else {
    await dismissDialog(page);
  }

  const userIdInput = page.getByPlaceholder("Auth user UUID");
  const selectedUserId = await userIdInput.inputValue().catch(() => "");
  if (!selectedUserId) return;

  const businessNameInput = page.getByPlaceholder("Seller shop name");
  if (!(await businessNameInput.inputValue())) {
    await businessNameInput.fill("SabiCard Seller Demo");
  }

  const contactEmailInput = page.getByPlaceholder("seller@example.com");
  if (!(await contactEmailInput.inputValue())) {
    await contactEmailInput.fill(sellerEmail);
  }

  await page.locator("select").first().selectOption("active");
  const initialCredits = page.locator('input[type="number"]');
  const currentCreditsValue = await initialCredits.inputValue().catch(() => "0");
  if (currentCreditsValue !== "0") {
    await initialCredits.fill("0");
  }
  await page.getByRole("button", { name: /Save Seller/i }).click();
  await page.waitForTimeout(2000);
}

async function buildPdf() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SabiCard Seller Guide</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      margin: 0;
    }
    h1 { font-size: 28px; margin: 0 0 8px; }
    h2 { border-bottom: 1px solid #e5e7eb; font-size: 18px; margin: 26px 0 10px; padding-bottom: 6px; }
    h3 { font-size: 14px; margin: 14px 0 6px; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 8px 0 12px 20px; padding: 0; }
    li { margin: 4px 0; }
    .cover {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
      min-height: 220px;
      justify-content: center;
    }
    .muted { color: #6b7280; }
    .callout {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      color: #3730a3;
      margin: 12px 0;
      padding: 12px;
    }
    .policy {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin: 10px 0;
      padding: 12px;
    }
    .shot {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      margin: 10px 0 18px;
      max-width: 100%;
      width: 100%;
    }
    .page-break { break-before: page; }
    code {
      background: #f3f4f6;
      border-radius: 4px;
      font-family: Consolas, monospace;
      padding: 2px 4px;
    }
  </style>
</head>
<body>
  <section class="cover">
    <h1>SabiCard Seller Guide</h1>
    <p class="muted">MVP onboarding, seller activation, card registration, NFC encoding, credits, and seller policies.</p>
    <p class="muted">Generated from actual SabiCard application screenshots.</p>
  </section>

  <h2>1. Seller Account Registration</h2>
  <p>A seller starts by creating a normal SabiCard account. For the MVP, seller access is not automatic. The platform admin reviews and activates the seller account.</p>
  <ol>
    <li>Open the registration page.</li>
    <li>Enter full name, email, password, and confirmation password.</li>
    <li>After registration, sign in with the new account.</li>
  </ol>
  <img class="shot" src="seller-guide-assets/01-register.png" />

  <h2>2. Sign In</h2>
  <p>The seller signs in using the same account that will later be approved by the admin.</p>
  <img class="shot" src="seller-guide-assets/02-login.png" />

  <h2 class="page-break">3. Seller Access</h2>
  <p>In this MVP, seller access is approved by the platform before the Seller Dashboard becomes available. Once approved, the seller signs in with their normal SabiCard account and opens the Seller Dashboard.</p>
  <ol>
    <li>Create or sign in to the seller account.</li>
    <li>Wait for platform approval.</li>
    <li>Open <code>/seller</code> to manage credits and cards.</li>
  </ol>

  <h2 class="page-break">4. Seller Dashboard</h2>
  <p>After activation, the seller can open the Seller Dashboard. This dashboard shows credits, total cards, unactivated cards, and activated cards.</p>
  <img class="shot" src="seller-guide-assets/05-seller-dashboard.png" />

  <h2>5. Registering a Card</h2>
  <p>To issue a card, the seller enters or generates a Card UID and clicks <strong>Register and Use 1 Credit</strong>.</p>
  <div class="callout">
    One successful card registration consumes exactly 1 seller credit. Failed NFC writing does not consume another credit because the credit is deducted when the card record is registered in the platform.
  </div>
  <img class="shot" src="seller-guide-assets/06-register-card.png" />

  <h2 class="page-break">6. Encoding the NFC Card</h2>
  <p>After registration, the seller can encode the card by writing the card tap URL to the physical NFC tag.</p>
  <ol>
    <li>Find the card in Seller Cards.</li>
    <li>Click <strong>Encode NFC</strong>.</li>
    <li>Use Chrome on Android over HTTPS with NFC enabled.</li>
    <li>Hold the card still near the phone until writing finishes.</li>
  </ol>
  <p>If Web NFC is not supported on the device, copy the Tap URL and use another NFC writer app or compatible Android browser/device.</p>
  <img class="shot" src="seller-guide-assets/07-encode-card.png" />

  <h2>7. Customer Activation</h2>
  <p>The seller gives the encoded card to the customer. When the customer taps the card, SabiCard opens the activation page. The customer creates or signs in to their own account, then confirms activation.</p>
  <p>The system automatically links the activated card and customer back to the seller who registered the card.</p>
  <img class="shot" src="seller-guide-assets/08-activation.png" />

  <h2 class="page-break">Credit Rules</h2>
  <div class="policy">
    <h3>Credit Usage</h3>
    <ul>
      <li>1 registered card = 1 credit consumed.</li>
      <li>Credits are deducted only after successful card registration.</li>
      <li>Duplicate card UIDs should not be registered again.</li>
      <li>Credits are tracked in a ledger for audit history.</li>
    </ul>
  </div>
  <div class="policy">
    <h3>Seller Access</h3>
    <ul>
      <li>Seller accounts are admin-approved during the MVP.</li>
      <li>Suspended sellers cannot register new cards.</li>
      <li>Seller dashboard data is limited to cards registered by that seller.</li>
      <li>Users activate their own accounts; sellers do not create customer accounts.</li>
    </ul>
  </div>
  <div class="policy">
    <h3>Replacement and Support Policy</h3>
    <ul>
      <li>Each new physical card registration uses a credit.</li>
      <li>Lost, defective, or replacement cards should be handled according to admin policy.</li>
      <li>Admin may adjust credits manually for approved support cases.</li>
      <li>Card ownership should not be transferred after activation without admin review.</li>
    </ul>
  </div>
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
  await ensureDirs();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await screenshot(page, "01-register.png");

  if (!sellerOnly) {
    await login(page, adminEmail, adminPassword);
    await activateCurrentAccountAsSeller(page);
    await logout(page);
  }

  await login(page, sellerEmail, sellerPassword);

  await page.goto(`${baseUrl}/seller`, { waitUntil: "networkidle" });
  await screenshot(page, "05-seller-dashboard.png");

  const sellerInactive = await page.getByText("Seller access is not active.").isVisible().catch(() => false);
  if (sellerInactive) {
    await browser.close();
    throw new Error("Seller access is not active for this account. Activate it before generating seller dashboard screenshots.");
  }

  await page.locator("main").getByText("Register Card").scrollIntoViewIfNeeded();
  await screenshot(page, "06-register-card.png");

  await page.locator("main").getByText("Seller Cards").scrollIntoViewIfNeeded();
  await screenshot(page, "07-encode-card.png");

  await page.goto(`${baseUrl}/activate?uid=SC-DEMO-GUIDE`, {
    waitUntil: "networkidle",
  });
  await screenshot(page, "08-activation.png");

  await browser.close();
  await buildPdf();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
