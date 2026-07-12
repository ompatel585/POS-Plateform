import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getOrders } from "../features/user/userSlice";

const OrderBill = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const printRef = useRef();

  const orderState = useSelector((state) => state?.auth?.getorderedProduct?.orders);
  const order = orderState?.find((o) => o._id === id);

  const customer = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;

  useEffect(() => {
    if (customer?.token && !orderState) {
      dispatch(getOrders({ headers: { Authorization: `Bearer ${customer.token}` } }));
    }
  }, [dispatch]);

  // auto-print if ?print=true in URL
  useEffect(() => {
    if (order) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "true") {
        setTimeout(() => handlePrint(), 500);
      }
    }
  }, [order]);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Order Bill - ${order?._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
            .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
            .total-row td { font-weight: bold; background: #f9f9f9; }
            h2 { margin: 0; }
            .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; background: #ffc107; color: #333; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h5>Loading order...</h5>
      </div>
    );
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const shipping = 100;
  const subtotal = order.totalPriceAfterDiscount;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <button className="btn btn-outline-secondary" onClick={() => navigate("/my-orders")}>
          ← Back to Orders
        </button>
        <button className="btn btn-dark" onClick={handlePrint}>
          🖨️ Print Bill
        </button>
      </div>

      <div ref={printRef} style={{ maxWidth: "800px", margin: "0 auto", padding: "30px", border: "1px solid #eee", borderRadius: "12px" }}>
        {/* Bill Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 style={{ fontWeight: "bold" }}>Cart's Corner</h2>
            <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>Tax Invoice / Bill of Supply</p>
          </div>
          <div className="text-end">
            <p className="mb-0"><strong>Order ID:</strong> {order._id}</p>
            <p className="mb-0"><strong>Date:</strong> {formatDate(order.createdAt)}</p>
            <p className="mb-0">
              <strong>Status:</strong>{" "}
              <span className={`badge ${order.orderStatus === "Delivered" ? "bg-success" : "bg-warning text-dark"}`}>
                {order.orderStatus}
              </span>
            </p>
            <p className="mb-0">
              <strong>Payment:</strong>{" "}
              {order.paymentInfo?.method === "COD" || order.paymentInfo?.razorpayOrderId === "OFFLINE"
                ? "Cash on Delivery"
                : "Online (Razorpay)"}
            </p>
          </div>
        </div>

        <hr />

        {/* Shipping Address */}
        {order.shippingInfo?.address && (
          <div className="mb-4">
            <h6 className="fw-bold mb-1">Shipping Address</h6>
            <p className="mb-0">
              {order.shippingInfo.firstname} {order.shippingInfo.lastname}
            </p>
            <p className="mb-0">{order.shippingInfo.address}{order.shippingInfo.other ? `, ${order.shippingInfo.other}` : ""}</p>
            <p className="mb-0">{order.shippingInfo.city}, {order.shippingInfo.state} - {order.shippingInfo.pincode}</p>
          </div>
        )}

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>#</th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>Product</th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>Color</th>
              <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>Qty</th>
              <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Unit Price</th>
              <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems?.map((item, index) => (
              <tr key={item._id || index}>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{index + 1}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  <div className="d-flex align-items-center gap-2">
                    {item?.product?.images?.[0]?.url && (
                      <img
                        src={item.product.images[0].url}
                        alt=""
                        style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    )}
                    <span>{item?.product?.title || "N/A"}</span>
                  </div>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {item?.color?.title ? (
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: item.color.title, border: "1px solid #ccc" }} />
                      <span>{item.color.title}</span>
                    </div>
                  ) : "—"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>{item.quantity}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₹ {item.price?.toLocaleString("en-IN")}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₹ {(item.price * item.quantity)?.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Subtotal</td>
              <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₹ {subtotal?.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td colSpan={5} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Shipping</td>
              <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₹ {shipping}</td>
            </tr>
            <tr style={{ fontWeight: "bold", background: "#f9f9f9" }}>
              <td colSpan={5} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Grand Total</td>
              <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₹ {(subtotal + shipping)?.toLocaleString("en-IN")}</td>
            </tr>
          </tfoot>
        </table>

        <p className="text-center text-muted mt-4" style={{ fontSize: "13px" }}>
          Thank you for shopping with Cart's Corner!
        </p>
      </div>
    </div>
  );
};

export default OrderBill;
