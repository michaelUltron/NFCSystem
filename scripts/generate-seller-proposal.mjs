import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const docsDir = path.resolve("docs");
const logoPath = path.resolve("public", "sabi-logo.png");
const proposalHtmlPath = path.join(docsDir, "seller-proposal.html");
const proposalPdfPath = path.join(docsDir, "seller-proposal.pdf");

async function logoDataUri() {
  const logo = await fs.readFile(logoPath);
  return `data:image/png;base64,${logo.toString("base64")}`;
}

async function main() {
  await fs.mkdir(docsDir, { recursive: true });

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
  <title>SabiCard Seller Partnership Proposal</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      color: #101828;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
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
    h1 { color: #0f172a; font-size: 30px; line-height: 1.15; margin: 0 0 10px; }
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
    table { border-collapse: collapse; margin: 12px 0 18px; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 9px; text-align: left; vertical-align: top; }
    th { background: #f0f9ff; color: #164e63; font-weight: 700; }
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
    .value-grid, .package-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, 1fr);
      margin: 12px 0 18px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
    }
    .highlight {
      background: #ecfeff;
      border: 1px solid #67e8f9;
      border-radius: 12px;
      color: #155e75;
      margin: 12px 0;
      padding: 14px;
    }
    .steps {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(5, 1fr);
      margin: 14px 0 18px;
    }
    .step {
      background: #f0f9ff;
      border: 1px solid #7dd3fc;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .step span {
      background: #06b6d4;
      border-radius: 999px;
      color: #ffffff;
      display: inline-flex;
      font-weight: 700;
      height: 24px;
      justify-content: center;
      margin-bottom: 8px;
      width: 24px;
    }
    .page-break { break-before: page; }
    h2, h3, table, .card, .highlight, .step, .signature-line {
      break-inside: avoid;
    }
    section, .value-grid, .package-grid, .steps, .signature-grid {
      break-inside: avoid;
    }
    .signature-grid {
      display: grid;
      gap: 28px;
      grid-template-columns: repeat(2, 1fr);
      margin-top: 32px;
    }
    .signature-line {
      border-top: 1px solid #98a2b3;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="brand"><img src="${logo}" /> SabiCard</div>
    <div class="cover-mark">Seller Partnership Proposal</div>
    <h1>Grow Your NFC Card Business with SabiCard</h1>
    <p class="muted">A partnership proposal for ID, calling card, business card, and NFC product sellers who want to issue smart digital cards with a managed activation platform.</p>
    <div class="meta">
      <div><strong>Prepared by:</strong><br />SabiCard</div>
      <div><strong>Program:</strong><br />Seller Credit MVP</div>
      <div><strong>Platform:</strong><br />https://www.sabicard.app</div>
      <div><strong>Document date:</strong><br />${generatedDate}</div>
    </div>
  </section>

  <h2>Executive Summary</h2>
  <p>SabiCard gives sellers a simple way to sell NFC-enabled digital business cards without building their own software platform. Sellers register cards using credits, encode the SabiCard tap URL to physical NFC cards, and let customers activate their own accounts.</p>
  <p>The goal is to help sellers offer a modern, recurring, and professional NFC card product while SabiCard handles the activation, dashboard, profile, analytics, and card management experience.</p>

  <h2>Who This Is For</h2>
  <div class="value-grid">
    <div class="card"><h3>ID and Card Sellers</h3><p>Businesses that already print IDs, calling cards, membership cards, or PVC cards.</p></div>
    <div class="card"><h3>NFC Product Sellers</h3><p>Sellers who provide NFC cards, tags, stickers, or smart profile cards.</p></div>
    <div class="card"><h3>Local Print Shops</h3><p>Shops that want to add digital card activation to their physical card service.</p></div>
    <div class="card"><h3>Corporate Suppliers</h3><p>Suppliers serving teams, events, organizations, and business clients.</p></div>
  </div>

  <h2>Seller Value Proposition</h2>
  <ul>
    <li>Sell a higher-value NFC product instead of only a printed card.</li>
    <li>Let customers create and activate their own accounts.</li>
    <li>Track issued, unactivated, and activated cards from a seller dashboard.</li>
    <li>Use credits to control cost and inventory without complex billing at launch.</li>
    <li>Reduce support issues with clear card ownership and activation history.</li>
  </ul>

  <h2>How the Seller Program Works</h2>
  <div class="steps">
    <div class="step"><span>1</span><br /><strong>Approve</strong><br />Seller account is approved by SabiCard.</div>
    <div class="step"><span>2</span><br /><strong>Top Up</strong><br />Seller receives or purchases credits.</div>
    <div class="step"><span>3</span><br /><strong>Register</strong><br />Seller registers a card and uses 1 credit.</div>
    <div class="step"><span>4</span><br /><strong>Encode</strong><br />Seller writes the tap URL to the NFC card.</div>
    <div class="step"><span>5</span><br /><strong>Activate</strong><br />Customer activates the card to their account.</div>
  </div>

  <h2 class="page-break">Credit Model</h2>
  <div class="highlight">
    <strong>Core rule:</strong> One successfully registered card uses one seller credit.
  </div>
  <table>
    <thead>
      <tr><th>Action</th><th>Credit Effect</th><th>Business Meaning</th></tr>
    </thead>
    <tbody>
      <tr><td>Seller receives 100 credits</td><td>+100</td><td>Seller can register up to 100 cards.</td></tr>
      <tr><td>Seller registers one NFC card</td><td>-1</td><td>A sellable card record is created in SabiCard.</td></tr>
      <tr><td>Customer activates the card</td><td>No change</td><td>Customer claims the already registered card.</td></tr>
      <tr><td>Admin support adjustment</td><td>+/- manual</td><td>Used for approved support, replacements, or corrections.</td></tr>
    </tbody>
  </table>

  <h2>Recommended Pilot Offer</h2>
  <div class="package-grid">
    <div class="card">
      <h3>Starter Pilot</h3>
      <ul>
        <li>10 to 25 trial credits</li>
        <li>Seller dashboard access</li>
        <li>Basic onboarding guide</li>
        <li>Manual support during pilot</li>
      </ul>
    </div>
    <div class="card">
      <h3>Production Seller</h3>
      <ul>
        <li>Prepaid credit bundles</li>
        <li>Dashboard monitoring</li>
        <li>Card activation tracking</li>
        <li>Support for credit adjustments and disputes</li>
      </ul>
    </div>
  </div>

  <h2>Seller Responsibilities</h2>
  <ul>
    <li>Use SabiCard only for legitimate customer card transactions.</li>
    <li>Encode the correct tap URL to each physical card.</li>
    <li>Test cards before releasing them to customers.</li>
    <li>Protect customer information and avoid collecting customer passwords.</li>
    <li>Contact SabiCard for replacements, disputes, or suspicious activity.</li>
  </ul>

  <h2>SabiCard Responsibilities</h2>
  <ul>
    <li>Provide the seller dashboard and card registration platform.</li>
    <li>Maintain card activation and customer account workflows.</li>
    <li>Track credit ledger entries and card ownership.</li>
    <li>Provide support for approved credit adjustments and account issues.</li>
    <li>Continue improving the seller platform based on pilot feedback.</li>
  </ul>

  <h2 class="page-break">Commercial Terms for Discussion</h2>
  <p>The final pricing can be adjusted after the pilot, but the recommended structure is a prepaid credit model.</p>
  <table>
    <thead>
      <tr><th>Commercial Item</th><th>Suggested Approach</th></tr>
    </thead>
    <tbody>
      <tr><td>Seller access</td><td>Approved manually by SabiCard during MVP.</td></tr>
      <tr><td>Card creation</td><td>1 credit per registered card.</td></tr>
      <tr><td>Credit purchase</td><td>Prepaid credit bundles.</td></tr>
      <tr><td>Trial sellers</td><td>Limited free credits for testing and feedback.</td></tr>
      <tr><td>Replacement cards</td><td>New card uses a new credit unless SabiCard grants an adjustment.</td></tr>
      <tr><td>Suspension</td><td>SabiCard may suspend sellers for misuse, unpaid usage, or policy violation.</td></tr>
    </tbody>
  </table>

  <h2>Success Metrics for Pilot Sellers</h2>
  <ul>
    <li>Number of cards registered by the seller.</li>
    <li>Number of cards activated by customers.</li>
    <li>Time from card registration to customer activation.</li>
    <li>Seller support issues encountered.</li>
    <li>Customer confusion during activation.</li>
    <li>Seller willingness to buy additional credits.</li>
  </ul>

  <h2>Terms and Conditions Summary</h2>
  <ul>
    <li>SabiCard seller access is subject to approval and continued compliance.</li>
    <li>Sellers may not use the platform for spam, fraud, misleading claims, or unauthorized links.</li>
    <li>Sellers must not create customer accounts without consent or request customer passwords.</li>
    <li>Credits are consumed when cards are successfully registered.</li>
    <li>SabiCard may review card, credit, and activation history for support and abuse prevention.</li>
    <li>SabiCard may suspend seller access to protect customers or the platform.</li>
  </ul>

  <h2>Next Steps</h2>
  <ol>
    <li>Confirm seller interest and business details.</li>
    <li>Create or identify the seller SabiCard account.</li>
    <li>Approve seller access and assign pilot credits.</li>
    <li>Complete onboarding using the Seller Guide.</li>
    <li>Register and encode first test cards.</li>
    <li>Collect feedback after the first week of usage.</li>
  </ol>

  <h2>SabiCard Contacts</h2>
  <table>
    <tbody>
      <tr><th>General Inquiries</th><td>info@sabicard.app</td></tr>
      <tr><th>Seller and Customer Support</th><td>support@sabicard.app</td></tr>
    </tbody>
  </table>

  <div class="signature-grid">
    <div class="signature-line">
      <strong>SabiCard Representative</strong><br />
      Name / Signature / Date
    </div>
    <div class="signature-line">
      <strong>Seller Representative</strong><br />
      Name / Signature / Date
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(proposalHtmlPath, html, "utf8");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${proposalHtmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });
  await page.pdf({
    path: proposalPdfPath,
    format: "A4",
    printBackground: true,
  });
  await browser.close();

  console.log(`Generated ${proposalPdfPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
