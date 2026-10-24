const formatMoney = (value) => Number(value || 0).toFixed(2);

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getCustomerName = (order) => {
  const shippingName = [order?.shippingInfo?.firstname, order?.shippingInfo?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (shippingName) return shippingName;

  const userName = [order?.user?.firstname, order?.user?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (userName) return userName;

  return order?.user?.name || "Customer";
};

const getCustomerAddress = (order) =>
  [
    order?.shippingInfo?.address,
    order?.shippingInfo?.city,
    order?.shippingInfo?.state,
    order?.shippingInfo?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

const getPaymentLabel = (order) => {
  if (order?.paymentInfo?.razorpayPaymentId) {
    return `Razorpay (${order.paymentInfo.razorpayPaymentId})`;
  }
  if (order?.paymentInfo?.razorpayOrderId) {
    return `Razorpay Order (${order.paymentInfo.razorpayOrderId})`;
  }
  return order?.mode || "ONLINE";
};

export const buildOrderBillHtml = (order) => {
  const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const billDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : new Date().toLocaleString();
  const total = Number(order?.totalPrice || 0);
  const payable = Number(order?.totalPriceAfterDiscount || order?.totalPrice || 0);

  const itemsHtml = items.length
    ? items
        .map((item, index) => {
          const productName =
            item?.product?.title ||
            item?.product?.name ||
            item?.product?.productName ||
            "Product";
          const quantity = Number(item?.quantity || 0);
          const price = Number(item?.price || 0);
          const rowTotal = quantity * price;
          const colorName = item?.color?.title || item?.color?.name || "-";

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(productName)}</td>
              <td>${escapeHtml(colorName)}</td>
              <td class="right">${quantity}</td>
              <td class="right">Rs. ${formatMoney(price)}</td>
              <td class="right">Rs. ${formatMoney(rowTotal)}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="6" class="muted">No order items found.</td>
      </tr>
    `;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bill ${escapeHtml(order?._id || "")}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 24px;
            color: #111827;
            background: #f9fafb;
          }
          .bill {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 28px;
          }
          .top {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            margin: 0 0 6px;
          }
          .muted { color: #6b7280; }
          .meta {
            text-align: right;
            font-size: 13px;
            color: #374151;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            background: #fafafa;
          }
          .card h3 {
            margin: 0 0 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #4b5563;
          }
          .card p {
            margin: 4px 0;
            font-size: 14px;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th, td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            text-align: left;
          }
          th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
          }
          .right { text-align: right; }
          .summary {
            margin-top: 18px;
            display: flex;
            justify-content: flex-end;
          }
          .summary-box {
            min-width: 300px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            background: #fafafa;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 8px 0;
            font-size: 14px;
          }
          .summary-row.total {
            border-top: 1px dashed #d1d5db;
            padding-top: 10px;
            margin-top: 12px;
            font-size: 16px;
            font-weight: 800;
          }
          @media print {
            body { background: #fff; padding: 0; }
            .bill { border: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="bill">
          <div class="top">
            <div>
              <h1 class="title">Order Bill</h1>
              <div class="muted">Bill ID: ${escapeHtml(order?._id || "")}</div>
            </div>
            <div class="meta">
              <div><strong>Date:</strong> ${escapeHtml(billDate)}</div>
              <div><strong>Status:</strong> ${escapeHtml(order?.orderStatus || "Ordered")}</div>
              <div><strong>Mode:</strong> ${escapeHtml(order?.mode || "ONLINE")}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>Customer</h3>
              <p><strong>Name:</strong> ${escapeHtml(getCustomerName(order))}</p>
              <p><strong>Address:</strong> ${escapeHtml(getCustomerAddress(order) || "N/A")}</p>
            </div>
            <div class="card">
              <h3>Payment</h3>
              <p><strong>Method:</strong> ${escapeHtml(getPaymentLabel(order))}</p>
              <p><strong>Placed By:</strong> ${escapeHtml(order?.user?.email || order?.user?.mobile || "N/A")}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 8%">#</th>
                <th>Product</th>
                <th>Color</th>
                <th class="right" style="width: 12%">Qty</th>
                <th class="right" style="width: 16%">Price</th>
                <th class="right" style="width: 16%">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-row">
                <span>Order Total</span>
                <span>Rs. ${formatMoney(total)}</span>
              </div>
              <div class="summary-row total">
                <span>Payable Amount</span>
                <span>Rs. ${formatMoney(payable)}</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const openOrderBillWindow = (order, { autoPrint = true } = {}) => {
  const billWindow = window.open("", "_blank", "width=1100,height=900");
  if (!billWindow) return false;

  billWindow.document.write(buildOrderBillHtml(order));
  billWindow.document.close();

  if (autoPrint) {
    setTimeout(() => billWindow.print(), 300);
  }

  return true;
};
