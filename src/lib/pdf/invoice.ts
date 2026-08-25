import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib";
import type { Client, Organization, Payment, Profile, Project } from "@/types/domain";

// ============================================================================
// Server-side invoice PDF generation using pdf-lib (pure JS, no native
// dependencies — safe in any Node runtime). One PDF page per invoice,
// rendered on demand by src/app/api/payments/[id]/invoice/route.ts.
// Internal notes (Payment.notes_internal) are intentionally never included
// here — this file is downloadable by clients.
// ============================================================================

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN = 56;

const INK = rgb(0.11, 0.11, 0.13);
const MUTED = rgb(0.45, 0.45, 0.5);
const LINE = rgb(0.85, 0.85, 0.88);

const STATUS_COLORS: Record<Payment["status"], { bg: RGB; fg: RGB; label: string }> = {
  draft: { bg: rgb(0.9, 0.9, 0.91), fg: rgb(0.35, 0.35, 0.38), label: "DRAFT" },
  sent: { bg: rgb(0.86, 0.91, 0.99), fg: rgb(0.15, 0.35, 0.75), label: "AWAITING PAYMENT" },
  paid: { bg: rgb(0.85, 0.95, 0.87), fg: rgb(0.13, 0.5, 0.25), label: "PAID" },
  overdue: { bg: rgb(0.99, 0.87, 0.86), fg: rgb(0.7, 0.18, 0.15), label: "OVERDUE" },
  cancelled: { bg: rgb(0.9, 0.9, 0.91), fg: rgb(0.4, 0.4, 0.43), label: "CANCELLED" },
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(dateOnly: string) {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
}

export async function generateInvoicePdf(input: {
  payment: Payment;
  project: Project | null;
  client: Client | null;
  clientProfile: Profile | null;
  org: Organization | null;
}) {
  const { payment, project, client, clientProfile, org } = input;

  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${payment.invoice_number}`);
  doc.setProducer("Project Hub");

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  const text = (
    str: string,
    x: number,
    yPos: number,
    opts: { size?: number; font?: typeof regular; color?: RGB; align?: "left" | "right" } = {}
  ) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? regular;
    const color = opts.color ?? INK;
    const width = font.widthOfTextAtSize(str, size);
    const drawX = opts.align === "right" ? x - width : x;
    page.drawText(str, { x: drawX, y: yPos, size, font, color });
    return width;
  };

  const rightEdge = PAGE_WIDTH - MARGIN;

  // -- Header: org name (left) / "INVOICE" + status pill (right) -----------
  text(org?.name ?? "Project Hub", MARGIN, y, { size: 18, font: bold });
  text("INVOICE", rightEdge, y, { size: 22, font: bold, align: "right" });
  y -= 22;

  const status = STATUS_COLORS[payment.status];
  const pillLabel = status.label;
  const pillWidth = bold.widthOfTextAtSize(pillLabel, 9) + 16;
  page.drawRectangle({ x: rightEdge - pillWidth, y: y - 4, width: pillWidth, height: 18, color: status.bg });
  text(pillLabel, rightEdge - 8, y, { size: 9, font: bold, color: status.fg, align: "right" });
  y -= 40;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: rightEdge, y }, thickness: 1, color: LINE });
  y -= 28;

  // -- Bill to / invoice meta, side by side ---------------------------------
  const colTop = y;
  text("BILL TO", MARGIN, y, { size: 8.5, font: bold, color: MUTED });
  y -= 16;
  text(client?.company_name ?? "—", MARGIN, y, { size: 12, font: bold });
  y -= 15;
  if (clientProfile?.full_name) {
    text(clientProfile.full_name, MARGIN, y, { size: 10, color: MUTED });
    y -= 14;
  }
  if (clientProfile?.email) {
    text(clientProfile.email, MARGIN, y, { size: 10, color: MUTED });
    y -= 14;
  }

  let metaY = colTop;
  const metaRow = (label: string, value: string) => {
    text(label, rightEdge, metaY, { size: 8.5, color: MUTED, align: "right" });
    metaY -= 13;
    text(value, rightEdge, metaY, { size: 10, font: bold, align: "right" });
    metaY -= 19;
  };
  metaRow("Invoice number", payment.invoice_number);
  metaRow("Issued", formatDate(payment.issued_date));
  metaRow("Due", formatDate(payment.due_date));
  if (payment.status === "paid" && payment.paid_date) metaRow("Paid", formatDate(payment.paid_date));
  if (project?.name) metaRow("Project", project.name);

  y = Math.min(y, metaY) - 20;

  // -- Line item table -------------------------------------------------------
  page.drawRectangle({ x: MARGIN, y: y - 4, width: rightEdge - MARGIN, height: 22, color: rgb(0.96, 0.96, 0.97) });
  text("DESCRIPTION", MARGIN + 10, y + 2, { size: 8.5, font: bold, color: MUTED });
  text("AMOUNT", rightEdge - 10, y + 2, { size: 8.5, font: bold, color: MUTED, align: "right" });
  y -= 30;

  const descLines = wrapText(payment.description, regular, 10, rightEdge - MARGIN - 140);
  for (const line of descLines) {
    text(line, MARGIN + 10, y, { size: 10 });
    y -= 14;
  }
  text(formatMoney(payment.amount, payment.currency), rightEdge - 10, y + (descLines.length - 1) * 14, {
    size: 10,
    font: bold,
    align: "right",
  });
  y -= 10;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: rightEdge, y }, thickness: 1, color: LINE });
  y -= 26;

  text("Total due", rightEdge - 130, y, { size: 11, color: MUTED });
  text(formatMoney(payment.amount, payment.currency), rightEdge - 10, y, { size: 16, font: bold, align: "right" });
  y -= 34;

  if (payment.status === "paid" && payment.payment_method) {
    text(`Paid via ${payment.payment_method}.`, MARGIN, y, { size: 9.5, color: MUTED });
    y -= 16;
  } else if (payment.status === "sent" || payment.status === "overdue") {
    text("Please remit payment by the due date above.", MARGIN, y, { size: 9.5, color: MUTED });
    y -= 16;
  }

  // -- Footer ------------------------------------------------------------
  text("Thank you for your business.", MARGIN, MARGIN, { size: 9.5, color: MUTED });

  return doc.save();
}

function wrapText(str: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number) {
  const words = str.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}
