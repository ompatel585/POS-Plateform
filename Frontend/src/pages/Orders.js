import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BsBoxSeam, BsCheckLg, BsCheckCircleFill, BsXCircle, BsPrinter, BsReceipt } from "react-icons/bs";
import Container from "../components/Container";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import EmptyState from "../components/EmptyState";
import { cancelOrder, getOrders } from "../features/user/userSlice";
import { formatPrice } from "../utils/pricing";

// Mirrors the statuses the admin panel can set
const STAGES = ["Ordered", "Processed", "Shipped", "Out for Delivery", "Delivered"];
const CANCELLABLE = ["Ordered", "Processed"];
const FILTERS = ["All", "Active", "Delivered", "Cancelled"];

const formatDate = (date, withTime) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: withTime ? undefined : "numeric",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "";

const statusClass = (status) =>
  status === "Delivered" ? "delivered" : status === "Cancelled" ? "cancelled" : status === "Ordered" ? "ordered" : "";

const Timeline = ({ order }) => {
  const history = order.statusHistory || [];
  const when = (stage) => history.filter((h) => h.status === stage).pop()?.at;

  if (order.orderStatus === "Cancelled") {
    return (
      <div className="timeline-cancelled">
        <BsXCircle /> This order was cancelled{when("Cancelled") ? ` on ${formatDate(when("Cancelled"), true)}` : ""}.
      </div>
    );
  }

  const currentIndex = Math.max(0, STAGES.indexOf(order.orderStatus));
  return (
    <div className="timeline" aria-label={`Order status: ${order.orderStatus}`}>
      {STAGES.map((stage, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
        const at = when(stage) || (i === 0 ? order.createdAt : null);
        return (
          <div className={`timeline-step ${state}`} key={stage}>
            <span className="dot">{state && <BsCheckLg size={14} />}</span>
            {stage}
            {state && at && <span className="when">{formatDate(at, true)}</span>}
          </div>
        );
      })}
    </div>
  );
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const placedId = searchParams.get("placed");
  const orders = useSelector((state) => state?.auth?.getorderedProduct?.orders);
  const [filter, setFilter] = useState("All");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const sorted = [...(orders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const visible = sorted.filter((o) => {
    if (filter === "Active") return !["Delivered", "Cancelled"].includes(o.orderStatus);
    if (filter === "Delivered" || filter === "Cancelled") return o.orderStatus === filter;
    return true;
  });

  const onCancel = async (order) => {
    if (!window.confirm("Cancel this order? Items go back to stock and this can't be undone.")) return;
    setCancelling(order._id);
    await dispatch(cancelOrder(order._id));
    setCancelling(null);
  };

  return (
    <>
      <Meta title="My orders | Cart Corner" />
      <BreadCrumb title="My Orders" />

      <Container class1="home-wrapper-2 py-4">
        <div className="section-head flex-wrap">
          <div>
            <h1 className="page-title">My orders</h1>
            <p>Track, cancel or print your orders</p>
          </div>
          {sorted.length > 0 && (
            <div className="chip-row">
              {FILTERS.map((f) => (
                <button type="button" key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {placedId && (
          <div className="coupon-applied mb-4" role="status">
            <span className="d-flex align-items-center gap-2">
              <BsCheckCircleFill /> Thank you! Your order has been placed. We'll keep you posted here.
            </span>
          </div>
        )}

        {orders === undefined ? (
          <div className="skeleton" style={{ height: 220 }} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<BsBoxSeam />}
            title="No orders yet"
            message="When you place an order, you can track it here."
            actionLabel="Start shopping"
            actionTo="/product"
          />
        ) : visible.length === 0 ? (
          <EmptyState title={`No ${filter.toLowerCase()} orders`} actionLabel="Show all" onAction={() => setFilter("All")} />
        ) : (
          visible.map((order) => (
            <div key={order._id} className="order-card" style={placedId === order._id ? { borderColor: "var(--success)" } : undefined}>
              <div className="order-head">
                <div>
                  <small>Order</small>
                  <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                </div>
                <div>
                  <small>Placed on</small>
                  {formatDate(order.createdAt)}
                </div>
                <div>
                  <small>Total</small>
                  <strong>{formatPrice(order.totalPriceAfterDiscount)}</strong>
                </div>
                <div>
                  <small>Payment</small>
                  {order.paymentInfo?.method === "COD" ? "Cash on delivery" : order.mode === "OFFLINE" ? "In store" : "Paid online"}
                </div>
                <span className={`status-pill ${statusClass(order.orderStatus)} ms-auto`}>{order.orderStatus}</span>
              </div>

              <div className="order-body">
                <Timeline order={order} />

                {order.orderItems?.map((item) => (
                  <div className="order-item" key={item._id}>
                    {item.product?.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt="" />
                    ) : (
                      <div className="skeleton" style={{ width: 64, height: 64, animation: "none" }} />
                    )}
                    <div>
                      {item.product ? (
                        <Link to={`/product/${item.product._id}`} className="fw-medium text-dark">
                          {item.product.title}
                        </Link>
                      ) : (
                        <span className="text-muted">Product no longer available</span>
                      )}
                      <div className="small text-muted d-flex gap-3 flex-wrap mt-1">
                        <span>Qty {item.quantity}</span>
                        {item.size && <span>Size {item.size}</span>}
                        {item.color?.title && (
                          <span className="d-inline-flex align-items-center gap-1">
                            <span className="color-dot" style={{ backgroundColor: item.color.title }} /> {item.color.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}

                <div className="d-flex gap-2 flex-wrap justify-content-end mt-3">
                  {CANCELLABLE.includes(order.orderStatus) && order.mode !== "OFFLINE" && (
                    <button
                      type="button"
                      className="button button-danger button-sm"
                      disabled={cancelling === order._id}
                      onClick={() => onCancel(order)}
                    >
                      {cancelling === order._id ? "Cancelling…" : "Cancel order"}
                    </button>
                  )}
                  <button type="button" className="button button-outline button-sm" onClick={() => navigate(`/order-bill/${order._id}`)}>
                    <BsReceipt /> View bill
                  </button>
                  <button type="button" className="button button-outline button-sm" onClick={() => navigate(`/order-bill/${order._id}?print=true`)}>
                    <BsPrinter /> Print
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </Container>
    </>
  );
};

export default Orders;
