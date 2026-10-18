import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import { BsBag, BsCheckLg, BsTag, BsX, BsLock } from "react-icons/bs";
import Container from "../components/Container";
import Meta from "../components/Meta";
import EmptyState from "../components/EmptyState";
import { base_url } from "../utils/axiosConfig";
import { createAnOrder, getUserCart } from "../features/user/userSlice";
import { cartSubtotal, formatPrice, shippingFor, unitPrice } from "../utils/pricing";
import { readJSON, writeJSON } from "../utils/storage";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const ADDRESS_KEY = "savedAddress";

const shippingSchema = yup.object({
  firstname: yup.string().trim().required("First name is required"),
  lastname: yup.string().trim().required("Last name is required"),
  address: yup.string().trim().required("Address is required"),
  city: yup.string().trim().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  pincode: yup
    .string()
    .matches(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode")
    .required("Pincode is required"),
  other: yup.string(),
});

const loadScript = (src) =>
  new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Field = ({ formik, name, placeholder, className = "col-12", ...rest }) => (
  <div className={className}>
    <input
      className={`form-control ${formik.touched[name] && formik.errors[name] ? "is-invalid" : ""}`}
      placeholder={placeholder}
      aria-label={placeholder}
      {...formik.getFieldProps(name)}
      {...rest}
    />
    {formik.touched[name] && formik.errors[name] && <div className="error mt-1">{formik.errors[name]}</div>}
  </div>
);

const Steps = ({ current }) => {
  const steps = ["Cart", "Shipping", "Payment", "Done"];
  return (
    <div className="stepper" aria-label="Checkout progress">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="step-line" />}
          <span className={`step ${i < current ? "done" : i === current ? "active" : ""}`}>
            <span className="num">{i < current ? <BsCheckLg /> : i + 1}</span>
            {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state?.auth?.cartProducts);
  const user = useSelector((state) => state?.auth?.user);

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { name, discount } as confirmed by the server
  const [applying, setApplying] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    dispatch(getUserCart());
  }, [dispatch]);

  const items = useMemo(() => (cart || []).filter((i) => i?.productId), [cart]);
  const subtotal = cartSubtotal(items);
  const discount = coupon ? Math.round((subtotal * coupon.discount) / 100) : 0;
  const shipping = shippingFor(subtotal - discount);
  const total = subtotal - discount + shipping;

  const saved = readJSON(ADDRESS_KEY, null);
  const formik = useFormik({
    initialValues: {
      firstname: saved?.firstname || user?.firstname || "",
      lastname: saved?.lastname || user?.lastname || "",
      address: saved?.address || "",
      other: saved?.other || "",
      city: saved?.city || "",
      state: saved?.state || "",
      country: "India",
      pincode: saved?.pincode || "",
    },
    validationSchema: shippingSchema,
    onSubmit: (values) => placeOrder(values),
  });

  const applyCoupon = async (e) => {
    e?.preventDefault();
    const code = couponInput.trim();
    if (!code) return;
    setApplying(true);
    try {
      const { data } = await axios.post(`${base_url}coupon/apply`, { coupon: code });
      setCoupon(data.coupon);
      toast.success(`${data.coupon.name} applied – you saved ${formatPrice(data.discount)}`);
    } catch (err) {
      setCoupon(null);
      toast.error(err?.response?.data?.message || "Could not apply this coupon");
    } finally {
      setApplying(false);
    }
  };

  const finishOrder = async (shippingInfo, paymentInfo) => {
    const result = await dispatch(
      createAnOrder({
        shippingInfo: { ...shippingInfo, pincode: Number(shippingInfo.pincode) },
        paymentInfo,
        coupon: coupon?.name,
      })
    );
    setPlacing(false);
    if (result.error) return;
    dispatch(getUserCart());
    navigate(`/my-orders?placed=${result.payload?.order?._id || ""}`);
  };

  const payOnline = async (shippingInfo) => {
    const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!loaded) {
      setPlacing(false);
      return toast.error("Could not load the payment window. Check your connection.");
    }

    let checkout;
    try {
      // The server works out the amount from the cart and coupon
      ({ data: checkout } = await axios.post(`${base_url}user/order/checkout`, { coupon: coupon?.name }));
    } catch (err) {
      setPlacing(false);
      return toast.error(err?.response?.data?.message || "Could not start the payment");
    }

    const { amount, id: order_id, currency } = checkout.order;
    const razorpay = new window.Razorpay({
      key: checkout.key,
      amount,
      currency,
      name: "Cart Corner",
      description: `Order of ${items.length} item${items.length > 1 ? "s" : ""}`,
      order_id,
      handler: (response) =>
        finishOrder(shippingInfo, {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      prefill: {
        name: `${shippingInfo.firstname} ${shippingInfo.lastname}`,
        email: user?.email,
        contact: user?.mobile,
      },
      theme: { color: "#f0a500" },
      modal: { ondismiss: () => setPlacing(false) },
    });
    razorpay.on("payment.failed", (resp) => {
      setPlacing(false);
      toast.error(resp?.error?.description || "Payment failed");
    });
    razorpay.open();
  };

  const placeOrder = (values) => {
    writeJSON(ADDRESS_KEY, values);
    setPlacing(true);
    if (paymentMethod === "cod") {
      finishOrder(values, { method: "COD" });
    } else {
      payOnline(values);
    }
  };

  if (cart !== undefined && items.length === 0) {
    return (
      <Container class1="home-wrapper-2 py-5">
        <EmptyState
          icon={<BsBag />}
          title="Nothing to check out"
          message="Your cart is empty. Add a few things first."
          actionLabel="Browse products"
          actionTo="/product"
        />
      </Container>
    );
  }

  return (
    <>
      <Meta title="Checkout | Cart Corner" />
      <Container class1="checkout-wrapper home-wrapper-2 py-4">
        <h1 className="page-title mb-3">Checkout</h1>
        <Steps current={1} />

        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="cart-layout">
            <div className="d-flex flex-column gap-3">
              <section className="surface-card">
                <h5 className="mb-1">Contact</h5>
                <p className="text-muted mb-0 small">
                  {user?.firstname} {user?.lastname} · {user?.email}
                  {user?.mobile && <> · {user.mobile}</>}
                </p>
              </section>

              <section className="surface-card">
                <h5 className="mb-3">Shipping address</h5>
                <div className="row g-3">
                  <Field formik={formik} name="firstname" placeholder="First name" className="col-sm-6" autoComplete="given-name" />
                  <Field formik={formik} name="lastname" placeholder="Last name" className="col-sm-6" autoComplete="family-name" />
                  <Field formik={formik} name="address" placeholder="Street address" autoComplete="address-line1" />
                  <Field formik={formik} name="other" placeholder="Apartment, suite, landmark (optional)" autoComplete="address-line2" />
                  <Field formik={formik} name="city" placeholder="City" className="col-sm-6" autoComplete="address-level2" />
                  <Field formik={formik} name="pincode" placeholder="Pincode" className="col-sm-6" inputMode="numeric" maxLength={6} autoComplete="postal-code" />
                  <div className="col-sm-6">
                    <select
                      className={`form-select ${formik.touched.state && formik.errors.state ? "is-invalid" : ""}`}
                      aria-label="State"
                      {...formik.getFieldProps("state")}
                    >
                      <option value="" disabled>Select state</option>
                      {STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {formik.touched.state && formik.errors.state && <div className="error mt-1">{formik.errors.state}</div>}
                  </div>
                  <div className="col-sm-6">
                    <select className="form-select" aria-label="Country" {...formik.getFieldProps("country")}>
                      <option value="India">India</option>
                    </select>
                  </div>
                </div>
                {saved && <p className="small text-muted mt-3 mb-0">We filled in the address from your last order.</p>}
              </section>

              <section className="surface-card">
                <h5 className="mb-3">Payment method</h5>
                <div className="d-flex gap-3 flex-wrap">
                  <label className={`pay-option ${paymentMethod === "razorpay" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                    />
                    <span>
                      <span className="label d-block">Pay online</span>
                      <small>UPI, cards, net banking via Razorpay</small>
                    </span>
                  </label>
                  <label className={`pay-option ${paymentMethod === "cod" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <span>
                      <span className="label d-block">Cash on delivery</span>
                      <small>Pay {formatPrice(total)} when it arrives</small>
                    </span>
                  </label>
                </div>
              </section>

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <Link to="/cart" className="button button-ghost">← Back to cart</Link>
              </div>
            </div>

            <aside className="summary-card">
              <h5>Order summary</h5>
              <div className="mb-3">
                {items.map((item) => (
                  <div className="mini-item" key={item._id}>
                    <div className="thumb">
                      <img src={item.productId.images?.[0]?.url} alt="" />
                      <span className="qty">{item.quantity}</span>
                    </div>
                    <div className="text-truncate">
                      <div className="text-truncate">{item.productId.title}</div>
                      <small className="text-muted">
                        {[item.size && `Size ${item.size}`, item.color?.title].filter(Boolean).join(" · ")}
                      </small>
                    </div>
                    <strong>{formatPrice(unitPrice(item) * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              {coupon ? (
                <div className="coupon-applied mb-3">
                  <span className="d-flex align-items-center gap-2">
                    <BsTag /> <strong>{coupon.name}</strong> · {coupon.discount}% off
                  </span>
                  <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} aria-label="Remove coupon" onClick={() => setCoupon(null)}>
                    <BsX />
                  </button>
                </div>
              ) : (
                <div className="coupon-box mb-3">
                  <input
                    className="form-control"
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon(e)}
                  />
                  <button type="button" className="button button-outline" disabled={applying || !couponInput.trim()} onClick={applyCoupon}>
                    {applying ? "…" : "Apply"}
                  </button>
                </div>
              )}

              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              {discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <strong>−{formatPrice(discount)}</strong>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <strong>{shipping ? formatPrice(shipping) : "Free"}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button type="submit" className="button button-accent button-block mt-3" disabled={placing || cart === undefined}>
                <BsLock />{" "}
                {placing ? "Processing…" : paymentMethod === "cod" ? "Place order" : `Pay ${formatPrice(total)}`}
              </button>
              <p className="small text-muted text-center mt-2 mb-0">
                By placing your order you agree to our <Link to="/term-conditions">terms</Link>.
              </p>
            </aside>
          </div>
        </form>
      </Container>
    </>
  );
};

export default Checkout;
