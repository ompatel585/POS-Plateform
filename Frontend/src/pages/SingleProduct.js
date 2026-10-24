import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import moment from "moment";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import {
  BsDash,
  BsPlus,
  BsTruck,
  BsArrowRepeat,
  BsShieldCheck,
  BsLink45Deg,
  BsWhatsapp,
  BsPlayFill,
  BsPatchCheckFill,
  BsStarFill,
  BsBag,
} from "react-icons/bs";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import Stars from "../components/Stars";
import ProductGrid from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import { addRating, addToWishlist, getAProduct } from "../features/products/productSlilce";
import { productSevice } from "../features/products/productService";
import { addProdToCart, getOrders, getUserCart } from "../features/user/userSlice";
import { addRecentlyViewed } from "../utils/storage";
import { formatPrice, stockFor, LOW_STOCK_LIMIT, FREE_SHIPPING_ABOVE } from "../utils/pricing";

const MAX_PER_ORDER = 10;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const isVideoUrl = (url) => url?.includes("/video/") || /\.(mp4|webm|mov)$/i.test(url || "");

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
};

const Gallery = ({ media, title }) => {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null);
  const current = media[active];

  useEffect(() => setActive(0), [media]);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="pdp-gallery">
      <div className="pdp-thumbs">
        {media.map((m, i) => (
          <button
            type="button"
            key={m.url + i}
            className={`pdp-thumb ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Show ${m.type} ${i + 1}`}
          >
            {m.type === "video" ? (
              <>
                <video src={m.url} muted preload="metadata" />
                <span className="play"><BsPlayFill /></span>
              </>
            ) : (
              <img src={m.url} alt="" />
            )}
          </button>
        ))}
      </div>
      <div
        className={`pdp-main-media ${zoom && current?.type === "image" ? "zoomed" : ""}`}
        onMouseMove={current?.type === "image" ? onMove : undefined}
        onMouseLeave={() => setZoom(null)}
      >
        {!current ? (
          <div className="d-flex h-100 align-items-center justify-content-center text-muted">No image</div>
        ) : current.type === "video" ? (
          <video src={current.url} controls autoPlay muted loop playsInline />
        ) : (
          <img
            src={current.url}
            alt={title}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        )}
      </div>
    </div>
  );
};

const ReviewForm = ({ productId, existing }) => {
  const dispatch = useDispatch();
  const [star, setStar] = useState(existing?.star || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment || "");

  const submit = (e) => {
    e.preventDefault();
    if (!star) return toast.error("Please choose a star rating");
    if (!comment.trim()) return toast.error("Please write a few words about the product");
    dispatch(addRating({ star, comment: comment.trim(), prodId: productId }));
  };

  return (
    <form onSubmit={submit} className="surface-card mb-4">
      <h6 className="mb-2">{existing ? "Update your review" : "Write a review"}</h6>
      <div className="star-input mb-3" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={(hover || star) >= n ? "on" : ""}
            onMouseEnter={() => setHover(n)}
            onClick={() => setStar(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <BsStarFill />
          </button>
        ))}
      </div>
      <textarea
        className="form-control mb-3"
        rows="3"
        placeholder="What did you like or dislike?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit" className="button">
        {existing ? "Update review" : "Submit review"}
      </button>
    </form>
  );
};

const Reviews = ({ product, user, purchased }) => {
  const ratings = product?.ratings || [];
  const total = ratings.length;
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: ratings.filter((r) => Math.round(r.star) === n).length,
  }));
  const mine = user && ratings.find((r) => (r.postedby?._id || r.postedby) === user._id);
  const sorted = [...ratings].sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

  return (
    <div>
      <div className="rating-summary mb-4">
        <div className="rating-big">
          <div className="value">{total ? Number(product.totalrating || 0).toFixed(1) : "–"}</div>
          <Stars value={product.totalrating} />
          <div className="text-muted small mt-1">
            {total} {total === 1 ? "review" : "reviews"}
          </div>
        </div>
        <div>
          {counts.map(({ n, count }) => (
            <div className="rating-bar-row" key={n}>
              <span>{n} ★</span>
              <div className="rating-bar">
                <span style={{ width: total ? `${(count / total) * 100}%` : 0 }} />
              </div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {!user ? (
        <p className="text-muted">
          <Link to="/login" className="text-accent">Log in</Link> to review products you've bought.
        </p>
      ) : purchased ? (
        <ReviewForm key={product._id} productId={product._id} existing={mine} />
      ) : (
        <p className="text-muted">Only customers who bought this product can leave a review.</p>
      )}

      {sorted.length === 0 ? (
        <p className="text-muted">No reviews yet.</p>
      ) : (
        sorted.map((r, i) => {
          const name = r.postedby?.firstname
            ? `${r.postedby.firstname} ${r.postedby.lastname?.charAt(0) || ""}.`
            : "Customer";
          return (
            <div className="review-card" key={r._id || i}>
              <div className="review-author">
                <span className="avatar">{name.charAt(0)}</span>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <strong>{name}</strong>
                    {r.verified && (
                      <span className="verified-badge"><BsPatchCheckFill /> Verified purchase</span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2 small text-muted">
                    <Stars value={r.star} />
                    {r.postedAt && <span>{moment(r.postedAt).fromNow()}</span>}
                  </div>
                </div>
              </div>
              <p>{r.comment}</p>
            </div>
          );
        })
      )}
    </div>
  );
};

const SingleProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const product = useSelector((state) => state?.product?.singleproduct);
  const loading = useSelector((state) => state?.product?.isLoading);
  const user = useSelector((state) => state?.auth?.user);
  const cart = useSelector((state) => state?.auth?.cartProducts);
  const orders = useSelector((state) => state?.auth?.getorderedProduct?.orders);
  const wishlistIds = useSelector((state) => state?.auth?.wishlistIds) || [];

  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("description");
  const [related, setRelated] = useState([]);
  const [adding, setAdding] = useState(false);

  const isCurrent = product?._id === id;

  useEffect(() => {
    dispatch(getAProduct(id));
    setSize(null);
    setQuantity(1);
    setTab("description");
  }, [dispatch, id]);

  useEffect(() => {
    if (user) dispatch(getOrders());
  }, [dispatch, user]);

  useEffect(() => {
    if (!isCurrent) return;
    addRecentlyViewed(product);
    productSevice
      .getProducts({ category: product.category, limit: 9 })
      .then((list) => setRelated((list || []).filter((p) => p._id !== product._id).slice(0, 8)))
      .catch(() => setRelated([]));
  }, [isCurrent, product]);

  const media = useMemo(() => {
    if (!isCurrent) return [];
    return [
      ...(product.images || []).map((i) => ({ type: isVideoUrl(i.url) ? "video" : "image", url: i.url })),
      ...(product.videos || []).map((v) => ({ type: "video", url: v.url })),
    ];
  }, [isCurrent, product]);

  const sizes = useMemo(
    () =>
      [...(product?.sizeStock || [])].sort(
        (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
      ),
    [product]
  );
  const hasSizes = sizes.length > 0;
  const stock = stockFor(product, size);
  const totalStock = stockFor(product);
  const maxQty = Math.max(1, Math.min(MAX_PER_ORDER, stock));
  const inWishlist = wishlistIds.includes(product?._id);

  const inCart = cart?.some(
    (c) => (c.productId?._id || c.productId) === product?._id && (c.size || null) === (size || null)
  );
  const purchased = orders?.some(
    (o) =>
      o.orderStatus !== "Cancelled" &&
      o.orderItems?.some((it) => (it.product?._id || it.product) === product?._id)
  );

  useEffect(() => {
    if (quantity > maxQty) setQuantity(maxQty);
  }, [maxQty, quantity]);

  const requireLogin = () => {
    toast.info("Please log in to continue");
    navigate("/login");
  };

  const addToCart = async (thenCheckout = false) => {
    if (!user) return requireLogin();
    if (hasSizes && !size) return toast.error("Please choose a size");
    if (inCart && !thenCheckout) return navigate("/cart");
    setAdding(true);
    const result = inCart
      ? { error: null }
      : await dispatch(
          addProdToCart({
            productId: product._id,
            quantity,
            size,
            color: product.color?._id || null,
          })
        );
    setAdding(false);
    if (result.error) return;
    dispatch(getUserCart());
    if (thenCheckout) navigate("/checkout");
  };

  const toggleWishlist = () => {
    if (!user) return requireLogin();
    dispatch(addToWishlist(product._id));
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const share = async () => {
    await copyText(window.location.href);
    toast.success("Link copied");
  };

  if (!isCurrent) {
    return (
      <Container class1="home-wrapper-2 py-5">
        <div className="row g-4">
          <div className="col-md-6"><div className="skeleton" style={{ aspectRatio: "1 / 1" }} /></div>
          <div className="col-md-6">
            <div className="skeleton mb-3" style={{ height: 32, width: "80%" }} />
            <div className="skeleton mb-3" style={{ height: 28, width: "30%" }} />
            <div className="skeleton" style={{ height: 160 }} />
            {!loading && <p className="text-muted mt-3">This product could not be found.</p>}
          </div>
        </div>
      </Container>
    );
  }

  const stockNote =
    hasSizes && !size ? (
      totalStock > 0 ? (
        <span className="stock-note in">In stock · choose a size</span>
      ) : (
        <span className="stock-note out">Out of stock</span>
      )
    ) : stock <= 0 ? (
      <span className="stock-note out">Out of stock</span>
    ) : stock <= LOW_STOCK_LIMIT ? (
      <span className="stock-note low">Hurry, only {stock} left</span>
    ) : (
      <span className="stock-note in">In stock</span>
    );

  const soldOut = hasSizes ? totalStock <= 0 || (size && stock <= 0) : stock <= 0;

  return (
    <>
      <Meta title={`${product.title} | Cart Corner`} />
      <BreadCrumb title={product.title} />

      <Container class1="main-product-wrapper home-wrapper-2 py-4">
        <div className="row g-4 g-lg-5">
          <div className="col-12 col-md-6">
            <Gallery media={media} title={product.title} />
          </div>

          <div className="col-12 col-md-6">
            <div className="pdp-info">
              <div>
                <Link to={`/search?q=${encodeURIComponent(product.brand)}`} className="product-brand">
                  {product.brand}
                </Link>
                <h1 className="mt-1">{product.title}</h1>
                <button
                  type="button"
                  className="rating-line border-0 bg-transparent p-0 mt-2"
                  onClick={() => {
                    setTab("reviews");
                    document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Stars value={product.totalrating} />
                  <span>
                    {product.ratings?.length
                      ? `${Number(product.totalrating).toFixed(1)} · ${product.ratings.length} reviews`
                      : "No reviews yet"}
                  </span>
                </button>
              </div>

              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="pdp-price">{formatPrice(product.price)}</span>
                {stockNote}
              </div>

              {product.color?.title && (
                <div>
                  <div className="option-label">Colour</div>
                  <ul className="colors">
                    <li className="selected" style={{ backgroundColor: product.color.title }} title={product.color.title} />
                  </ul>
                </div>
              )}

              {hasSizes && (
                <div>
                  <div className="option-label">
                    Size <span>{size ? `Selected: ${size}` : "Choose one"}</span>
                  </div>
                  <div className="size-picker">
                    {sizes.map((s) => (
                      <button
                        type="button"
                        key={s.size}
                        className={`size-option ${size === s.size ? "selected" : ""}`}
                        disabled={s.quantity <= 0}
                        onClick={() => setSize(s.size)}
                        title={s.quantity <= 0 ? "Out of stock" : `${s.quantity} available`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!soldOut && (
                <div>
                  <div className="option-label">Quantity</div>
                  <div className="qty-stepper">
                    <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>
                      <BsDash />
                    </button>
                    <span aria-live="polite">{quantity}</span>
                    <button type="button" aria-label="Increase quantity" disabled={quantity >= maxQty} onClick={() => setQuantity((q) => q + 1)}>
                      <BsPlus />
                    </button>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 flex-wrap">
                <button type="button" className="button flex-fill" disabled={soldOut || adding} onClick={() => addToCart(false)}>
                  <BsBag /> {soldOut ? "Out of stock" : inCart ? "Go to cart" : adding ? "Adding…" : "Add to cart"}
                </button>
                {!soldOut && (
                  <button type="button" className="button button-accent flex-fill" disabled={adding} onClick={() => addToCart(true)}>
                    Buy now
                  </button>
                )}
                <button
                  type="button"
                  className={`button button-outline ${inWishlist ? "text-danger" : ""}`}
                  onClick={toggleWishlist}
                  aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {inWishlist ? <AiFillHeart /> : <AiOutlineHeart />}
                </button>
              </div>

              <div className="pdp-perks">
                <div className="pdp-perk"><BsTruck /> Free shipping over {formatPrice(FREE_SHIPPING_ABOVE)}</div>
                <div className="pdp-perk"><BsArrowRepeat /> Easy returns</div>
                <div className="pdp-perk"><BsShieldCheck /> Secure checkout</div>
              </div>

              <dl className="pdp-meta">
                <dt>Category</dt>
                <dd>
                  <Link to={`/category/${encodeURIComponent(product.category)}`} className="text-accent">
                    {product.category}
                  </Link>
                </dd>
                <dt>Brand</dt>
                <dd>{product.brand}</dd>
                {product.tags && (
                  <>
                    <dt>Tags</dt>
                    <dd>{product.tags}</dd>
                  </>
                )}
                {product.barcode && (
                  <>
                    <dt>SKU</dt>
                    <dd style={{ textTransform: "none" }}>{product.barcode}</dd>
                  </>
                )}
              </dl>

              <div className="share-row">
                Share:
                <button type="button" className="button button-outline button-sm" onClick={share}>
                  <BsLink45Deg /> Copy link
                </button>
                <a
                  className="button button-outline button-sm"
                  href={`https://wa.me/?text=${encodeURIComponent(`${product.title} – ${window.location.href}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BsWhatsapp /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container class1="home-wrapper-2 py-4">
        <div id="product-tabs" className="surface-card">
          <div className="tabs-bar" role="tablist">
            {[
              ["description", "Description"],
              ["reviews", `Reviews (${product.ratings?.length || 0})`],
              ["shipping", "Shipping & returns"],
            ].map(([key, label]) => (
              <button
                type="button"
                role="tab"
                key={key}
                aria-selected={tab === key}
                className={`tab-btn ${tab === key ? "active" : ""}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "description" && (
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: product.description }} />
          )}
          {tab === "reviews" && <Reviews product={product} user={user} purchased={purchased} />}
          {tab === "shipping" && (
            <div className="rich-text">
              <p>
                Orders over {formatPrice(FREE_SHIPPING_ABOVE)} ship free; smaller orders have a flat delivery charge shown at checkout.
                We ship across India within <strong>5–10 business days</strong>.
              </p>
              <p>
                You can cancel an order from <Link to="/my-orders">My Orders</Link> until it ships. See our{" "}
                <Link to="/refund-policy">refund policy</Link> for returns.
              </p>
            </div>
          )}
        </div>
      </Container>

      {related.length > 0 && (
        <Container class1="home-wrapper-2 py-4">
          <div className="section-head">
            <h2 className="section-heading">You may also like</h2>
            <Link to={`/category/${encodeURIComponent(product.category)}`} className="section-link">
              View all →
            </Link>
          </div>
          <ProductGrid products={related.slice(0, 4)} />
        </Container>
      )}

      <Container class1="home-wrapper-2 py-4">
        <RecentlyViewed excludeId={product._id} />
      </Container>
    </>
  );
};

export default SingleProduct;
