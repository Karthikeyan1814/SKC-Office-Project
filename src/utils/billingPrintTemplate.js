import { numberToIndianWords } from "./numberToWords";

/**
 * Universal High-Fidelity Printable Document Generator
 * Ensures 100% aesthetic and layout parity between Admin Portal and Client Portal.
 */
export function buildDocPrintHtml(doc, firmInfo = {}, brandingSettings = {}) {
  const isReceipt = doc.type === "RECEIPT";
  const accentColor = isReceipt ? "#059669" : (doc.accentColor || "#1e40af");
  const firm = {
    name: "Sri Kathiravan & Co.",
    subTitle: "Tax, Audit & Financial Advisory Consultants",
    address: "No. 42, Commercial Complex, Gandhi Road",
    city: "Salem, Tamil Nadu - 636007",
    phone: "+91 88257 50992",
    email: "contact@srikathiravan.com",
    gstin: "33AAAAA0000A1Z5",
    pan: "AAAAA0000A",
    state: "Tamil Nadu",
    stateCode: "33",
    bankName: "HDFC Bank Ltd",
    accountName: "Sri Kathiravan & Co.",
    accountNumber: "50200084729103",
    ifscCode: "HDFC0001234",
    branch: "Salem Main Branch",
    upiId: "8825750992@upi",
    ...firmInfo,
    ...(doc.firm || {}),
  };

  const branding = {
    showSeal: true,
    sealType: "digital",
    sealImage: null,
    showSignature: true,
    signatureType: "digital",
    signatureImage: null,
    signatoryName: "Kathiravan & Co.",
    signatoryDesignation: "Managing Partner & Authorized Signatory",
    ...brandingSettings,
  };

  const docDate = doc.date || doc.docDate || new Date().toISOString().split("T")[0];
  const docTime = doc.time || doc.docTime || "10:30 AM";
  const dueDate = doc.dueDate || "";
  const docNo = doc.docNumber || (isReceipt ? "RCP-2026-0000" : "INV-2026-0000");

  const clientName = doc.clientName || doc.client?.name || "Valued Client";
  const clientContact = doc.clientLegalName || doc.client?.contactPerson || clientName;
  const clientMobile = doc.clientMobile || doc.client?.mobile || "";
  const clientEmail = doc.clientEmail || doc.client?.email || "";
  const clientGstin = doc.clientGstin || doc.client?.gstin || doc.client?.gstnumber || "";
  const clientPan = doc.clientPan || doc.client?.pan || "";
  const clientAddress = doc.clientAddress || doc.client?.address || "Salem, Tamil Nadu";
  const clientState = doc.clientState || doc.client?.state || "Tamil Nadu";
  const clientStateCode = doc.clientStateCode || doc.client?.stateCode || "33";

  // Items Parsing
  let items = [];
  try {
    if (typeof doc.itemsJson === "string") items = JSON.parse(doc.itemsJson);
    else if (Array.isArray(doc.items)) items = doc.items;
  } catch {}
  if (!items || items.length === 0) {
    items = [
      {
        id: 1,
        description: isReceipt ? (doc.receiptTowards || "Professional Advisory & Compliance Retainer") : "GST Audit & Tax Advisory Services",
        quantity: 1,
        rate: doc.totalAmount || 0,
        total: doc.totalAmount || 0,
        hsn: "998231",
        unit: "Service",
        discountPercent: 0,
        gstPercent: 18,
      },
    ];
  }

  // Calculate Subtotal & Tax
  let subtotal = 0;
  let totalGst = 0;
  items.forEach((it) => {
    const gross = (Number(it.quantity) || 1) * (Number(it.rate) || Number(it.total) || 0);
    const disc = gross * ((Number(it.discountPercent) || 0) / 100);
    const taxable = gross - disc;
    const gstRate = it.gstPercent !== undefined ? Number(it.gstPercent) : 18;
    const gstVal = taxable * (gstRate / 100);
    subtotal += taxable;
    totalGst += gstVal;
  });

  const currentBillTotal = (subtotal + totalGst) > 0 ? (subtotal + totalGst) : (Number(doc.currentInvoiceTotal) || Number(doc.totalAmount) || 0);

  // Intermediate Rows
  let intermediateRows = [];
  try {
    if (typeof doc.intermediateRowsJson === "string") intermediateRows = JSON.parse(doc.intermediateRowsJson);
    else if (Array.isArray(doc.intermediateRows)) intermediateRows = doc.intermediateRows;
  } catch {}

  const intermediateTotal = intermediateRows.reduce((sum, r) => {
    const val = Number(r.amount) || 0;
    return r.type === "DEDUCT" ? sum - val : sum + val;
  }, 0);

  const totalOutstanding = Number(doc.totalOutstanding) || Number(doc.paymentDetails?.totalOutstanding) || 0;
  const computedTotal = Math.max(0, currentBillTotal + totalOutstanding + intermediateTotal);

  const declaredVal = (doc.declaredNetWorthPayable !== undefined && doc.declaredNetWorthPayable !== null && !isNaN(doc.declaredNetWorthPayable))
    ? Number(doc.declaredNetWorthPayable)
    : null;

  let declaredDiff = 0;
  if (doc.declaredAdjustmentDiff !== undefined && doc.declaredAdjustmentDiff !== null && !isNaN(doc.declaredAdjustmentDiff)) {
    declaredDiff = Number(doc.declaredAdjustmentDiff);
  } else if (declaredVal !== null) {
    declaredDiff = declaredVal - computedTotal;
  }

  const adjustmentNote = doc.declaredAdjustmentNote || doc.paymentDetails?.declaredAdjustmentNote || (
    Array.isArray(doc.netWorthAuditHistory) && doc.netWorthAuditHistory[0]?.note ? doc.netWorthAuditHistory[0].note : ""
  );

  const effectiveNetPayable = declaredVal !== null ? declaredVal : (computedTotal + declaredDiff);
  const paidAmount = Number(doc.paidAmount) || 0;
  const remainingBalance = Number(doc.remainingBalance) !== undefined
    ? Number(doc.remainingBalance)
    : Math.max(0, effectiveNetPayable - paidAmount);
  const paymentMode = doc.paymentMode || "UPI";

  // Amount In Words
  const amountToWordify = isReceipt ? paidAmount : effectiveNetPayable;
  const amountWords = numberToIndianWords(Math.round(amountToWordify));

  // Custom Columns
  let customCols = [];
  try {
    if (typeof doc.customColumnsJson === "string") customCols = JSON.parse(doc.customColumnsJson);
    else if (Array.isArray(doc.customColumns)) customCols = doc.customColumns;
  } catch {}
  const activeCustomCols = customCols.filter((c) => c && c.enabled);

  // Official Seal SVG
  const sealSvg = `
    <svg viewBox="0 0 100 100" class="doc-svg-seal" style="width: 66px; height: 66px; display: inline-block; vertical-align: middle;">
      <circle cx="50" cy="50" r="46" stroke="#059669" stroke-width="2.5" fill="none" stroke-dasharray="3 2" />
      <circle cx="50" cy="50" r="41" stroke="#059669" stroke-width="1.5" fill="none" />
      <circle cx="50" cy="50" r="28" stroke="#059669" stroke-width="1" fill="none" />
      <path id="curve-top" d="M 16 50 A 34 34 0 0 1 84 50" fill="none" />
      <path id="curve-bot" d="M 84 50 A 34 34 0 0 1 16 50" fill="none" />
      <text font-size="7" font-weight="900" fill="#059669" letter-spacing="0.8">
        <textPath href="#curve-top" start-offset="50%" text-anchor="middle">${firm.name}</textPath>
      </text>
      <text font-size="5.5" font-weight="700" fill="#059669" letter-spacing="0.6">
        <textPath href="#curve-bot" start-offset="50%" text-anchor="middle">TAX & AUDIT CONSULTANTS</textPath>
      </text>
      <text x="50" y="47" font-size="5.5" font-weight="900" text-anchor="middle" fill="#059669">OFFICIAL</text>
      <text x="50" y="55" font-size="6.5" font-weight="900" text-anchor="middle" fill="#059669">★ SEAL ★</text>
      <text x="50" y="63" font-size="5" font-weight="700" text-anchor="middle" fill="#059669">SALEM</text>
    </svg>
  `;

  if (isReceipt) {
    // ═════════════════════════════════════════════════════════════════════════
    // HIGH-FIDELITY PAYMENT RECEIPT (HORIZONTAL VOUCHER)
    // ═════════════════════════════════════════════════════════════════════════
    return `
      <div class="doc-paper-receipt" style="border: 2px solid #059669; padding: 16px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; width: 100%; background: #ffffff; break-inside: avoid; page-break-inside: avoid;">
        <div class="doc-receipt-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 10px; break-inside: avoid;">
          <div>
            <h2 style="margin: 0; color: #065f46; font-size: 20px; font-weight: 900; letter-spacing: -0.2px;">${firm.name}</h2>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">${firm.subTitle} • ${firm.city} • Phone: <strong>${firm.phone}</strong></p>
          </div>
          <div style="background: #059669; color: #ffffff; padding: 5px 16px; border-radius: 999px; font-weight: 800; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
            OFFICIAL PAYMENT RECEIPT
          </div>
          <div style="text-align: right; font-size: 11.5px; color: #334155;">
            <div>Receipt No: <strong style="color: #065f46; font-size: 13px;">${docNo}</strong></div>
            <div>Date: <strong>${docDate}</strong></div>
            <div>Time: <strong>${docTime}</strong></div>
          </div>
        </div>

        <div style="font-size: 12.5px; line-height: 1.75; margin-bottom: 10px; break-inside: avoid;">
          <div style="margin-bottom: 3px;">
            Received with thanks from:
            <strong style="border-bottom: 1.5px solid #059669; padding: 0 8px; color: #0f172a; font-size: 14px;">${clientName}</strong>
            ${clientMobile ? `(Mobile: <strong>${clientMobile}</strong>)` : ""}
          </div>
          <div style="margin-bottom: 3px;">
            The sum of Rupees:
            <strong style="color: #065f46; border-bottom: 1.5px solid #059669; padding: 0 8px;">${amountWords}</strong>
          </div>
          <div style="margin-bottom: 3px;">
            Being payment towards / on account of:
            <strong style="border-bottom: 1.5px solid #059669; padding: 0 8px; color: #1e40af;">${doc.receiptTowards || "Professional Advisory & Compliance Retainer"}</strong>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin: 10px 0; gap: 10px; break-inside: avoid;">
          <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 8px 16px; display: inline-flex; align-items: center; gap: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #047857;">AMOUNT RECEIVED:</span>
            <strong style="font-size: 20px; color: #065f46;">₹ ${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 14px; font-size: 11.5px; color: #334155;">
            Payment Mode: <strong style="color: #065f46;">${paymentMode}</strong>
            <span> • Settlement Date: <strong>${docDate}</strong></span>
          </div>
        </div>

        <table class="receipt-items-table" style="width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; font-size: 9.5px !important; margin: 10px 0; box-sizing: border-box; break-inside: auto;">
          <thead>
            <tr style="background: #ecfdf5; color: #065f46; border-bottom: 1.5px solid #a7f3d0;">
              <th style="padding: 5px 4px; text-align: left; width: 50%;">Service / Particular Details</th>
              <th style="padding: 5px 4px; text-align: center; width: 15%;">Unit</th>
              <th style="padding: 5px 4px; text-align: right; width: 17%;">Amount Received</th>
              <th style="padding: 5px 4px; text-align: right; width: 18%;">Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it) => `
              <tr style="border-bottom: 1px solid #e2e8f0; break-inside: avoid; page-break-inside: avoid;">
                <td style="padding: 5px 4px; text-align: left;"><strong>${it.description || doc.receiptTowards || "Professional Services"}</strong></td>
                <td style="padding: 5px 4px; text-align: center;">${it.unit || "Service"}</td>
                <td style="padding: 5px 4px; text-align: right; font-weight: 800; color: #047857;">₹ ${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td style="padding: 5px 4px; text-align: right; font-weight: 800; color: ${remainingBalance <= 0 ? "#15803d" : "#b91c1c"};">
                  ₹ ${remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="doc-receipt-footer" style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 8px; break-inside: avoid; page-break-inside: avoid;">
          <div style="font-size: 10px; color: #64748b; max-width: 55%; line-height: 1.45;">
            * Computer generated official legal payment receipt.<br />
            * Subject to realization of electronic bank settlements.<br />
            * Thank you for your continued association with ${firm.name || "Sri Kathiravan & Co."}.
          </div>

          <div style="display: flex; align-items: flex-end; gap: 18px; break-inside: avoid; page-break-inside: avoid;">
            ${branding.showSeal ? `<div class="doc-seal-box" style="text-align: center; break-inside: avoid; page-break-inside: avoid;">${sealSvg}</div>` : ""}
            <div class="doc-signatory" style="text-align: right; font-size: 11px; break-inside: avoid; page-break-inside: avoid;">
              <div style="font-family: 'Dancing Script', cursive; font-size: 20px; color: #065f46; font-weight: bold; margin-bottom: 2px;">
                ${branding.signatoryName || "Kathiravan & Co."}
              </div>
              <div style="width: 130px; height: 1.5px; background: #059669; margin: 3px 0 2px auto;"></div>
              <strong>FOR ${firm.name}</strong><br />
              <small style="color: #64748b; font-size: 9.5px;">${branding.signatoryDesignation || "Authorized Signatory"}</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HIGH-FIDELITY TAX INVOICE (VERTICAL A4 PORTRAIT)
  // Standard 1-4 items fits cleanly on 1 page; 5+ items paginate seamlessly
  // ═════════════════════════════════════════════════════════════════════════
  return `
    <div class="doc-paper-invoice" style="border: 1px solid #cbd5e1; padding: 14px 18px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; width: 100%; background: #ffffff; position: relative;">
      <!-- Accent Top Stripe -->
      <div class="doc-invoice-stripe" style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: ${accentColor};"></div>

      <!-- Header -->
      <div class="doc-invoice-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 4px; margin-bottom: 8px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 8px; break-inside: avoid; page-break-inside: avoid;">
        <div>
          <h2 style="margin: 0; color: ${accentColor}; font-size: 20px; font-weight: 900; letter-spacing: -0.2px;">${firm.name}</h2>
          <p style="margin: 2px 0 1px 0; font-size: 11px; font-weight: 700; color: #334155;">${firm.subTitle}</p>
          <p style="margin: 1px 0; font-size: 10px; color: #475569;">${firm.address}, ${firm.city}</p>
          <p style="margin: 1px 0; font-size: 10px; color: #475569;">Phone: <strong>${firm.phone}</strong> • Email: ${firm.email}</p>
          <p style="margin: 1px 0; font-size: 10px; color: #475569;">GSTIN: <strong>${firm.gstin}</strong> • PAN: ${firm.pan}</p>
        </div>

        <div style="text-align: right;">
          <h1 style="margin: 0; color: ${accentColor}; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">TAX INVOICE</h1>
          <div style="margin-top: 4px; font-size: 11px; line-height: 1.45; color: #334155;">
            <div>Invoice No: <strong style="color: #0f172a; font-size: 12.5px;">${docNo}</strong></div>
            <div>Invoice Date: <strong>${docDate}</strong></div>
            ${dueDate ? `<div>Due Date: <strong style="color: #b91c1c;">${dueDate}</strong></div>` : ""}
            ${doc.referenceNo ? `<div>Ref / PO: <strong>${doc.referenceNo}</strong></div>` : ""}
          </div>
        </div>
      </div>

      <!-- Addresses & Compliance Grid -->
      <div class="doc-addresses-grid" style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 10.5px; break-inside: avoid; page-break-inside: avoid;">
        <div style="flex: 1.2;">
          <h4 style="margin: 0 0 3px 0; font-size: 9.5px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.4px;">Billed To (Client / Customer):</h4>
          <div style="font-size: 13.5px; font-weight: 900; color: #0f172a; margin-bottom: 1px;">${clientName}</div>
          ${clientContact ? `<p style="margin: 1px 0; color: #334155;">Attn: <strong>${clientContact}</strong></p>` : ""}
          <p style="margin: 1px 0; color: #475569; line-height: 1.35;">${clientAddress}</p>
          <p style="margin: 1px 0; color: #475569;">📱 Mobile: <strong>${clientMobile || "N/A"}</strong> ${clientEmail ? `• ✉️ ${clientEmail}` : ""}</p>
          <p style="margin: 1px 0; color: #475569;">GSTIN: <strong>${clientGstin || "Unregistered"}</strong> ${clientPan ? `• PAN: ${clientPan}` : ""}</p>
        </div>

        <div style="flex: 1; border-left: 1px solid #e2e8f0; padding-left: 12px;">
          <h4 style="margin: 0 0 3px 0; font-size: 9.5px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.4px;">Supply & Compliance Details:</h4>
          <p style="margin: 1.5px 0; color: #334155;">Place of Supply: <strong>${clientState}</strong></p>
          <p style="margin: 1.5px 0; color: #334155;">State Code: <strong>${clientStateCode}</strong></p>
          <p style="margin: 1.5px 0; color: #334155;">Reverse Charge Applicable: <strong>No</strong></p>
          <p style="margin: 1.5px 0; color: #334155;">Nature of Supply: <strong>Professional Legal & Advisory</strong></p>
        </div>
      </div>

      <!-- Items Table -->
      <table class="doc-table" style="width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; font-size: 9.5px !important; margin-bottom: 8px; word-break: break-word !important; box-sizing: border-box !important; break-inside: auto; page-break-inside: auto;">
        <thead>
          <tr style="background: ${accentColor}; color: #ffffff;">
            <th style="padding: 4.5px 4px; text-align: center; width: 5%;">#</th>
            <th style="padding: 4.5px 4px; text-align: left; width: 37%;">Product / Service Description</th>
            <th style="padding: 4.5px 4px; text-align: left; width: 10%;">HSN/SAC</th>
            <th style="padding: 4.5px 4px; text-align: left; width: 9%;">Unit</th>
            ${activeCustomCols.map((col) => `<th style="padding: 4.5px 4px; text-align: left; width: 10%;">${col.name}</th>`).join("")}
            <th style="padding: 4.5px 4px; text-align: center; width: 6%;">Qty</th>
            <th style="padding: 4.5px 4px; text-align: right; width: 11%;">Rate (₹)</th>
            <th style="padding: 4.5px 4px; text-align: center; width: 7%;">GST%</th>
            <th style="padding: 4.5px 4px; text-align: right; width: 15%;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; break-inside: avoid; page-break-inside: avoid;">
              <td style="padding: 4.5px 4px; text-align: center; font-weight: 700;">${idx + 1}</td>
              <td style="padding: 4.5px 4px; text-align: left;"><strong style="color: #0f172a;">${it.description}</strong></td>
              <td style="padding: 4.5px 4px; text-align: left;">${it.hsn || "998231"}</td>
              <td style="padding: 4.5px 4px; text-align: left;">${it.unit || "Service"}</td>
              ${activeCustomCols.map((col) => `<td style="padding: 4.5px 4px; text-align: left; color: #1e40af; font-weight: 600;">${it.customValues?.[col.id] || "—"}</td>`).join("")}
              <td style="padding: 4.5px 4px; text-align: center;">${it.quantity || 1}</td>
              <td style="padding: 4.5px 4px; text-align: right;">₹${Number(it.rate || it.total).toLocaleString("en-IN")}</td>
              <td style="padding: 4.5px 4px; text-align: center;">${it.gstPercent !== undefined ? it.gstPercent : 18}%</td>
              <td style="padding: 4.5px 4px; text-align: right; font-weight: 800;">₹${Number(it.total || (it.rate * (it.quantity || 1))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Summary Split: Bank Details & Tax Calculation Table -->
      <div class="doc-summary-split" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid;">
        <div class="doc-bank-box" style="flex: 1 1 48%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 10px; break-inside: avoid; page-break-inside: avoid;">
          <strong style="color: #0f172a; display: block; margin-bottom: 3px; font-size: 10.5px;">🏦 Authorized Remittance & Bank Settlement Details:</strong>
          <p style="margin: 1.5px 0;">Bank: <strong>${firm.bankName}</strong></p>
          <p style="margin: 1.5px 0;">A/C Name: <strong>${firm.accountName}</strong></p>
          <p style="margin: 1.5px 0;">A/C Number: <strong>${firm.accountNumber}</strong></p>
          <p style="margin: 1.5px 0;">IFSC Code: <strong>${firm.ifscCode}</strong> (${firm.branch})</p>
          <p style="margin: 3px 0 0 0; color: #166534; font-weight: 700;">Official UPI ID: <strong>${firm.upiId}</strong></p>
        </div>

        <div class="doc-calc-table-wrap" style="flex: 1 1 48%; break-inside: avoid; page-break-inside: avoid;">
          <table class="doc-calc-table" style="width: 100%; font-size: 10.5px; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding: 2px 0; color: #475569;">Subtotal (Taxable Value):</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 600;">₹ ${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #475569;">CGST (9%):</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 600;">₹ ${(totalGst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #475569;">SGST (9%):</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 600;">₹ ${(totalGst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 3px 0; font-weight: 700; color: #0f172a;">Current Invoice Amount:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 800; color: #0f172a;">₹ ${currentBillTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              ${totalOutstanding > 0 ? `
                <tr style="color: #b91c1c; font-weight: 700;">
                  <td style="padding: 2px 0;">Previous Total Outstanding:</td>
                  <td style="padding: 2px 0; text-align: right;">+ ₹ ${totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ` : ""}
              ${intermediateRows.map((r) => `
                <tr style="color: #6b21a8;">
                  <td style="padding: 2px 0;">${r.label}:</td>
                  <td style="padding: 2px 0; text-align: right;">${r.type === "DEDUCT" ? "- " : "+ "}₹ ${Number(r.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join("")}
              ${(declaredDiff !== 0 || adjustmentNote) ? `
                <tr style="color: ${declaredDiff < 0 ? "#15803d" : declaredDiff > 0 ? "#1d4ed8" : "#0f766e"}; font-weight: 700; background: ${declaredDiff < 0 ? "#f0fdf4" : declaredDiff > 0 ? "#eff6ff" : "transparent"};">
                  <td style="padding: 2px 4px;">
                    ${declaredDiff < 0 ? "Declared Adjustment / Concession" : declaredDiff > 0 ? "Declared Adjustment / Surcharge" : "Declared Adjustment"}
                    ${adjustmentNote ? ` (${adjustmentNote})` : ""}:
                  </td>
                  <td style="padding: 2px 4px; text-align: right;">
                    ${declaredDiff < 0 ? "- " : declaredDiff > 0 ? "+ " : ""}₹ ${Math.abs(declaredDiff).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ` : ""}
              <tr style="border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1;">
                <td style="padding: 4px 0; font-weight: 900; font-size: 12.5px; color: ${accentColor};">TOTAL NET PAYABLE:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 900; font-size: 13.5px; color: ${accentColor};">
                  ₹ ${effectiveNetPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #166534; font-weight: 700;">Amount Paid / Cleared:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 800; color: #166534;">₹ ${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="font-weight: 900; color: ${remainingBalance <= 0 ? "#15803d" : "#dc2626"}; font-size: 11.5px;">
                <td style="padding: 3px 0;">Remaining Balance Due:</td>
                <td style="padding: 3px 0; text-align: right;">₹ ${remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Amount in Words -->
      <div class="doc-amount-words" style="background: #f1f5f9; border-left: 3px solid ${accentColor}; padding: 5px 10px; margin-bottom: 6px; font-size: 10.5px; border-radius: 4px; break-inside: avoid; page-break-inside: avoid;">
        <strong>Amount in Words: </strong> ${amountWords}
      </div>

      <!-- Payment Status Stamp Badge -->
      <div class="doc-payment-status" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid;">
        <div style="font-size: 11px; color: #334155;">
          Payment Realization Mode: <strong style="color: ${accentColor};">${paymentMode}</strong>
        </div>
        <div>
          <span style="display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; background: ${remainingBalance <= 0 ? "#ecfdf5" : paidAmount > 0 ? "#fef3c7" : "#fee2e2"}; color: ${remainingBalance <= 0 ? "#065f46" : paidAmount > 0 ? "#b45309" : "#991b1b"}; border: 1px solid ${remainingBalance <= 0 ? "#a7f3d0" : paidAmount > 0 ? "#fde68a" : "#fca5a5"};">
            ${remainingBalance <= 0 ? "✓ FULLY PAID" : paidAmount > 0 ? "PARTIALLY PAID" : "PAYMENT DUE"}
          </span>
        </div>
      </div>

      <!-- Terms & Signature Grid -->
      <div class="doc-footer-grid" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px; break-inside: avoid; page-break-inside: avoid; page-break-before: auto;">
        <div class="doc-terms" style="font-size: 9.5px; color: #64748b; max-width: 55%; line-height: 1.4; break-inside: avoid; page-break-inside: avoid;">
          <strong style="color: #334155;">Terms & Conditions:</strong><br />
          1. All payments must be made to "${firm.accountName || firm.name || "Sri Kathiravan & Co."}" authorized bank account or official UPI.<br />
          2. This is a computer generated legal tax invoice and is binding under Indian GST Law.<br />
          3. Subject to Salem jurisdiction.
        </div>

        <div style="display: flex; align-items: flex-end; gap: 16px; break-inside: avoid; page-break-inside: avoid;">
          ${branding.showSeal ? `<div class="doc-seal-box" style="text-align: center; break-inside: avoid; page-break-inside: avoid;">${sealSvg}</div>` : ""}
          <div class="doc-signatory" style="text-align: right; font-size: 11px; break-inside: avoid; page-break-inside: avoid;">
            <div style="font-family: 'Dancing Script', cursive; font-size: 20px; color: ${accentColor}; font-weight: bold; margin-bottom: 2px;">
              ${branding.signatoryName || "Kathiravan & Co."}
            </div>
            <div style="width: 130px; height: 1.5px; background: ${accentColor}; margin: 3px 0 2px auto;"></div>
            <strong>FOR ${firm.name}</strong><br />
            <small style="color: #64748b; font-size: 9.5px;">${branding.signatoryDesignation || "Authorized Signatory"}</small>
          </div>
        </div>
      </div>
    </div>
  `;
}
