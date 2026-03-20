type ReceiptPdfData = {
  receipt: {
    onchain_receipt_id: string;
    tx_id: string;
    payer_wallet_address: string;
    paid_at: string;
    amount: number;
    currency: "sBTC" | "STX" | "USDCx";
  };
  invoice: {
    onchain_invoice_id: string;
    description: string;
    customer_name: string;
    customer_email: string;
    recipient_address: string;
    created_at: string;
    paid_at: string;
  } | null;
  merchant: {
    company_name: string;
    display_name: string;
    email: string;
    slug: string;
    settlement_wallet: string;
  } | null;
};

const pageWidth = 595;
const pageHeight = 842;
const L = 48;
const R = 547;
const W = R - L;

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(v: string) {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escUri(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatAmount(amount: number, currency: "sBTC" | "STX" | "USDCx") {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "sBTC" ? 8 : 2,
  }).format(amount)} ${currency}`;
}

function formatDate(value: string) {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function prefixTxId(txId: string) {
  if (!txId) return "Unavailable";
  return txId.startsWith("0x") ? txId : `0x${txId}`;
}

function wrapText(value: string, maxChars: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ["Unavailable"];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) { current = candidate; continue; }
    if (current) { lines.push(current); current = word; continue; }
    lines.push(word.slice(0, maxChars));
    current = word.slice(maxChars);
  }
  if (current) lines.push(current);
  return lines;
}

function truncateMiddle(value: string, maxLength = 34) {
  if (!value || value.length <= maxLength) return value || "Unavailable";
  const head = Math.ceil((maxLength - 3) / 2);
  const tail = Math.floor((maxLength - 3) / 2);
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

// ── Colors ────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const DARK_BG: RGB = [0.07, 0.07, 0.08];
const CARD_BG: RGB = [0.11, 0.11, 0.13];
const CARD_BDR: RGB = [0.22, 0.22, 0.25];
const INNER_BG: RGB = [0.07, 0.07, 0.09];
const INNER_BDR: RGB = [0.18, 0.18, 0.21];
const WHITE: RGB = [1, 1, 1];
const MUTED: RGB = [0.55, 0.55, 0.60];
const LABEL: RGB = [0.38, 0.38, 0.43];
const GREEN: RGB = [0.09, 0.72, 0.44];
const GREEN_BG: RGB = [0.05, 0.30, 0.18];
const AMBER: RGB = [0.96, 0.62, 0.04];
const BLUE: RGB = [0.30, 0.55, 0.95];

// ── Primitives ────────────────────────────────────────────────────────────────

function txt(font: "F1" | "F2" | "F3", size: number, x: number, y: number, value: string, [r, g, b]: RGB = WHITE) {
  return `BT ${r} ${g} ${b} rg /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(value)}) Tj ET`;
}

// Text centered within a rect: pass rect x, y (bottom-left), w, h
function txtCentered(font: "F1" | "F2" | "F3", size: number, rx: number, ry: number, rw: number, rh: number, value: string, color: RGB = WHITE) {
  // Approximate character width for centering: Helvetica ~0.55 × size per char
  const approxW = value.length * size * 0.55;
  const tx = rx + (rw - approxW) / 2;
  // Vertical center: baseline sits ~0.35 × size above mid
  const ty = ry + (rh - size) / 2 + size * 0.2;
  return txt(font, size, tx, ty, value, color);
}

function roundedFill(x: number, y: number, w: number, h: number, [r, g, b]: RGB, rx = 8) {
  const k = rx * 0.552;
  return [
    `${r} ${g} ${b} rg`,
    `${x + rx} ${y} m ${x + w - rx} ${y} l ${x + w - rx + k} ${y} ${x + w} ${y + k} ${x + w} ${y + rx} c`,
    `${x + w} ${y + h - rx} l ${x + w} ${y + h - rx + k} ${x + w - rx + k} ${y + h} ${x + w - rx} ${y + h} c`,
    `${x + rx} ${y + h} l ${x + rx - k} ${y + h} ${x} ${y + h - rx + k} ${x} ${y + h - rx} c`,
    `${x} ${y + rx} l ${x} ${y + rx - k} ${x + rx - k} ${y} ${x + rx} ${y} c f`,
  ].join(" ");
}

function roundedStroke(x: number, y: number, w: number, h: number, [r, g, b]: RGB, lw = 0.5, rx = 8) {
  const k = rx * 0.552;
  return [
    `q ${lw} w ${r} ${g} ${b} RG`,
    `${x + rx} ${y} m ${x + w - rx} ${y} l ${x + w - rx + k} ${y} ${x + w} ${y + k} ${x + w} ${y + rx} c`,
    `${x + w} ${y + h - rx} l ${x + w} ${y + h - rx + k} ${x + w - rx + k} ${y + h} ${x + w - rx} ${y + h} c`,
    `${x + rx} ${y + h} l ${x + rx - k} ${y + h} ${x} ${y + h - rx + k} ${x} ${y + h - rx} c`,
    `${x} ${y + rx} l ${x} ${y + rx - k} ${x + rx - k} ${y} ${x + rx} ${y} c S Q`,
  ].join(" ");
}

function hline(y: number, x1 = L, x2 = R, [r, g, b]: RGB = CARD_BDR, lw = 0.5) {
  return `q ${lw} w ${r} ${g} ${b} RG ${x1} ${y} m ${x2} ${y} l S Q`;
}

function glassCard(x: number, y: number, w: number, h: number, out: string[]) {
  out.push(roundedFill(x, y, w, h, CARD_BG, 10));
  out.push(roundedStroke(x, y, w, h, CARD_BDR, 0.5, 10));
}

function innerCard(x: number, y: number, w: number, h: number, out: string[]) {
  out.push(roundedFill(x, y, w, h, INNER_BG, 6));
  out.push(roundedStroke(x, y, w, h, INNER_BDR, 0.5, 6));
}

function field(x: number, y: number, label: string, value: string, out: string[], color: RGB = WHITE, size = 10.5) {
  out.push(txt("F1", 7.5, x, y, label.toUpperCase(), LABEL));
  out.push(txt("F2", size, x, y - 14, value, color));
}

// ── PDF assembly ──────────────────────────────────────────────────────────────

function makePdf(pageContent: string, annotObjects: string[], contentLength: number) {
  const annotCount = annotObjects.length;
  const annotStartIdx = 8;
  const annotRefs = Array.from({ length: annotCount }, (_, i) => `${annotStartIdx + i} 0 R`).join(" ");

  const pageDict = annotCount > 0
    ? `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R /Annots [${annotRefs}] >>`
    : `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    pageDict,
    `<< /Length ${contentLength} >>\nstream\n${pageContent}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    ...annotObjects,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, "binary");
}

export function buildReceiptPdf(data: ReceiptPdfData) {
  const merchantName = data.merchant?.company_name || data.merchant?.display_name || "StackPay Merchant";
  const description = data.invoice?.description || "Payment received via StackPay";
  const customerName = data.invoice?.customer_name || "Customer";
  const customerEmail = data.invoice?.customer_email || "—";
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet";

  // Full tx_id on one line — Courier 8pt, ~0.6 × 8 = 4.8px per char
  // 499px inner card width, so ~104 chars fit. A 66-char 0x-prefixed hash fits fine.
  const fullTxId = prefixTxId(data.receipt.tx_id || "");

  const txUrl = network === "mainnet"
    ? `https://explorer.hiro.so/txid/${data.receipt.tx_id}?chain=mainnet`
    : `https://explorer.hiro.so/txid/${data.receipt.tx_id}?chain=testnet`;

  const out: string[] = [];

  // ── Page background ───────────────────────────────────────────────────────
  out.push(`${DARK_BG[0]} ${DARK_BG[1]} ${DARK_BG[2]} rg 0 0 ${pageWidth} ${pageHeight} re f`);

  // ── Header card ───────────────────────────────────────────────────────────
  const hCardH = 90;
  const hCardY = pageHeight - hCardH - 36;
  glassCard(L, hCardY, W, hCardH, out);

  out.push(txt("F1", 8, L + 16, hCardY + hCardH - 22, "STACKPAY", LABEL));
  out.push(txt("F2", 18, L + 16, hCardY + hCardH - 44, merchantName, WHITE));
  out.push(txt("F1", 9, L + 16, hCardY + hCardH - 62, "Payment receipt", MUTED));
  out.push(txt("F1", 9, L + 16, hCardY + 16, formatDate(data.receipt.paid_at), LABEL));

  // PAID badge — fixed size, text centered within it
  const badgeW = 58;
  const badgeH = 24;
  const badgeX = R - badgeW - 16;
  const badgeY = hCardY + hCardH - 50;
  out.push(roundedFill(badgeX, badgeY, badgeW, badgeH, GREEN_BG, 12));
  out.push(txtCentered("F2", 9, badgeX, badgeY, badgeW, badgeH, "PAID", GREEN));

  // ── Amount card ───────────────────────────────────────────────────────────
  const aCardY = hCardY - 58 - 10;
  glassCard(L, aCardY, W, 54, out);
  out.push(txt("F1", 7.5, L + 16, aCardY + 40, "AMOUNT PAID", LABEL));
  out.push(txt("F2", 24, L + 16, aCardY + 16, formatAmount(data.receipt.amount, data.receipt.currency), AMBER));

  // ── Details card ─────────────────────────────────────────────────────────
  // Rows: receipt id / invoice id | customer / email | payer wallet / network
  const dCardH = 110;
  const dCardY = aCardY - dCardH - 10;
  glassCard(L, dCardY, W, dCardH, out);

  const c1 = L + 16;
  const c2 = L + W / 2 + 8;

  field(c1, dCardY + dCardH - 24, "Receipt ID", truncateMiddle(data.receipt.onchain_receipt_id || "Unavailable", 26), out);
  field(c2, dCardY + dCardH - 24, "Invoice ID", truncateMiddle(data.invoice?.onchain_invoice_id || "Unavailable", 26), out);
  out.push(hline(dCardY + dCardH - 52, L + 8, R - 8, INNER_BDR));
  field(c1, dCardY + dCardH - 66, "Customer", customerName, out);
  field(c2, dCardY + dCardH - 66, "Email", customerEmail, out);
  out.push(hline(dCardY + dCardH - 94, L + 8, R - 8, INNER_BDR));
  field(c1, dCardY + 14, "Payer wallet", truncateMiddle(data.receipt.payer_wallet_address || "Unavailable", 26), out);
  field(c2, dCardY + 14, "Network", network.charAt(0).toUpperCase() + network.slice(1), out);

  // ── Transaction ID card (single line, clickable) ──────────────────────────
  const innerPad = 10;
  const innerH = txLineH_single + innerPad * 2;
  const txCardH = innerH + 40;
  const txCardY = dCardY - txCardH - 10;
  glassCard(L, txCardY, W, txCardH, out);
  out.push(txt("F1", 7.5, L + 16, txCardY + txCardH - 20, "TRANSACTION ID", LABEL));

  const monoY = txCardY + innerPad;
  innerCard(L + 10, monoY, W - 20, innerH, out);
  // Single line, blue to signal it's a link
  out.push(txt("F3", 8, L + 20, monoY + innerPad + 4, fullTxId, BLUE));

  // ── Description card ──────────────────────────────────────────────────────
  const descLines = wrapText(description, 74).slice(0, 3);
  const descCardH = 26 + descLines.length * 15 + 20;
  const descCardY = txCardY - descCardH - 10;
  glassCard(L, descCardY, W, descCardH, out);
  out.push(txt("F1", 7.5, L + 16, descCardY + descCardH - 20, "DESCRIPTION", LABEL));
  descLines.forEach((line, i) => {
    out.push(txt("F1", 10, L + 16, descCardY + descCardH - 38 - i * 15, line, MUTED));
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  out.push(hline(38, L, R, CARD_BDR));
  out.push(txt("F2", 8.5, L, 24, "STACKPAY", MUTED));
  // out.push(txt("F1", 8, L + 68, 24, "· stackpay.app", LABEL));
  out.push(txt("F1", 8, R - 130, 24, `Generated ${formatDate(new Date().toISOString())}`, LABEL));

  // ── URI annotation over the mono tx_id card ───────────────────────────────
  const annotRect: [number, number, number, number] = [L + 10, monoY, L + 10 + W - 20, monoY + innerH];
  const annotObj = `<< /Type /Annot /Subtype /Link /Rect [${annotRect.join(" ")}] /Border [0 0 0] /A << /Type /Action /S /URI /URI (${escUri(txUrl)}) >> >>`;

  const contentStream = out.join("\n");
  return makePdf(contentStream, [annotObj], Buffer.byteLength(contentStream, "binary"));
}

// Single-line tx inner card height
const txLineH_single = 14;