import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BsBag, BsDash, BsPlus, BsTrash } from "react-icons/bs";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import EmptyState from "../components/EmptyState";
import RecentlyViewed from "../components/RecentlyViewed";
import { deleteCartProduct, getUserCart, updateCartProduct } from "../features/user/userSlice";
import { cartSubtotal, formatPrice, shippingFor, stockFor, unitPrice, FREE_SHIPPING_ABOVE } from "../utils/pricing";

const MAX_PER_ORDER = 10;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state?.auth?.cartProducts);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    dispatch(getUserCart());
  }, [dispatch]);

  const items = (cart || []).filter((item) => item?.productId);
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const toFreeShipping = Math.max(0, FREE_SHIPPING_ABOVE - subtotal);

  const changeQuantity = async (item, quantity) => {
    setBusyId(item._id);
    await dispatch(updateCartProduct({ cartItemId: item._id, quantity }));
    await dispatch(getUserCart());
    setBusyId(null);
  };

  const remove = async (item) => {
    setBusyId(item._id);
    await dispatch(deleteCartProduct({ id: item._id }));
    await dispatch(getUserCart());
    setBusyId(null);
  };

  return (
    <>
      <Meta title="Cart | Cart Corner" />
      <BreadCrumb title="Cart" />
      <Container class1="cart-wrapper home-wrapper-2 py-4">
        <h1 className="page-title mb-3">Shopping cart</h1>

        {cart === undefined ? (
          <div className="skeleton" style={{ height: 240 }} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BsBag />}
            title="Your cart is empty"
            message="Looks like you haven't added anything yet. Let's fix that."
            actionLabel="Start shopping"
            actionTo="/product"
          />
        ) : (
          <div className="cart-layout">
            <div>
              {items.map((item) => {
                const product = item.productId;
                const max = Math.max(1, Math.min(MAX_PER_ORDER, stockFor(product, item.size)));
                const busy = busyId === item._id;
                return (
                  <div className="cart-item" key={item._id} style={{ opacity: busy ? 0.6 : 1 }}>
                    <Link to={`/product/${product._id}`}>
                      <img src={product.images?.[0]?.url} alt={product.title} />
                    </Link>
                    <div>
                      <Link to={`/product/${product._id}`} className="title">
                        {product.title}
                      </Link>
                      <div className="variant">
                        <span>{formatPrice(unitPrice(item))}</span>
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color?.title && (
                          <span className="d-inline-flex align-items-center gap-1">
                            <span className="color-dot" style={{ backgroundColor: item.color.title }} />
                            {item.color.title}
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
                        <div className="qty-stepper sm">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={busy || item.quantity <= 1}
                            onClick={() => changeQuantity(item, item.quantity - 1)}
                          >
                            <BsDash />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={busy || item.quantity >= max}
                            onClick={() => changeQuantity(item, item.quantity + 1)}
                          >
                            <BsPlus />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="button button-ghost button-sm text-danger"
                          disabled={busy}
                          onClick={() => remove(item)}
                        >
                          <BsTrash /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="line-total">{formatPrice(unitPrice(item) * item.quantity)}</div>
                  </div>
                );
              })}
              <Link to="/product" className="button button-outline mt-2">
                ← Continue shopping
              </Link>
            </div>

            <aside className="summary-card">
              <h5>Order summary</h5>
              <div className="ship-progress">
                {toFreeShipping > 0 ? (
                  <>Add <strong>{formatPrice(toFreeShipping)}</strong> more for free shipping</>
                ) : (
                  <>🎉 You've unlocked free shipping</>
                )}
                <div className="bar">
                  <span style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_ABOVE) * 100)}%` }} />
                </div>
              </div>
              <div className="summary-row">
                <span>Subtotal ({items.reduce((n, i) => n + Number(i.quantity), 0)} items)</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong>{shipping ? formatPrice(shipping) : "Free"}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(subtotal + shipping)}</span>
              </div>
              <p className="small text-muted mt-2 mb-3">Have a coupon? Apply it at checkout.</p>
              <button type="button" className="button button-accent button-block" onClick={() => navigate("/checkout")}>
                Proceed to checkout
              </button>
            </aside>
          </div>
        )}
      </Container>

      <Container class1="home-wrapper-2 py-4">
        <RecentlyViewed title="Pick up where you left off" />
      </Container>
    </>
  );
};

export default Cart;
