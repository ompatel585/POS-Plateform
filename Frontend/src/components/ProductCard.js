import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { BsBag } from "react-icons/bs";
import { addToWishlist } from "../features/products/productSlilce";
import { addProdToCart, getUserCart } from "../features/user/userSlice";
import { formatPrice, stockFor, LOW_STOCK_LIMIT } from "../utils/pricing";
import Stars from "./Stars";

const NEW_FOR_DAYS = 14;

const isNew = (product) =>
  product?.createdAt &&
  Date.now() - new Date(product.createdAt).getTime() < NEW_FOR_DAYS * 864e5;

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user);
  const wishlistIds = useSelector((state) => state?.auth?.wishlistIds) || [];

  const inWishlist = wishlistIds.includes(product?._id);
  const stock = stockFor(product);
  const outOfStock = stock <= 0;
  const hasSizes = product?.sizeStock?.length > 0;
  const openProduct = () => navigate(`/product/${product?._id}`);

  const requireLogin = () => {
    toast.info("Please log in first");
    navigate("/login");
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (!user) return requireLogin();
    dispatch(addToWishlist(product._id));
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const quickAdd = async (e) => {
    e.stopPropagation();
    if (hasSizes) return openProduct(); // a size has to be picked first
    if (!user) return requireLogin();
    const result = await dispatch(
      addProdToCart({
        productId: product._id,
        quantity: 1,
        color: product.color?._id || product.color || null,
      })
    );
    if (!result.error) dispatch(getUserCart());
  };

  const video = product?.videos?.[0]?.url;
  const image = product?.images?.[0]?.url;

  return (
    <article className="product-card">
      <div className="product-media" onClick={openProduct}>
        {image ? (
          <img src={image} alt={product?.title || "product"} loading="lazy" />
        ) : video ? (
          <video
            src={video}
            muted
            loop
            playsInline
            preload="metadata"
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <div className="no-media">No image</div>
        )}

        <div className="product-badges">
          {outOfStock ? (
            <span className="badge-chip out">Out of stock</span>
          ) : stock <= LOW_STOCK_LIMIT ? (
            <span className="badge-chip low">Only {stock} left</span>
          ) : null}
          {isNew(product) && !outOfStock && <span className="badge-chip new">New</span>}
          {product?.tags === "popular" && <span className="badge-chip hot">Popular</span>}
        </div>

        <button
          type="button"
          className={`wish-btn ${inWishlist ? "active" : ""}`}
          onClick={toggleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          {inWishlist ? <AiFillHeart /> : <AiOutlineHeart />}
        </button>

        {!outOfStock && (
          <div className="quick-add">
            <button type="button" className="button button-accent" onClick={quickAdd}>
              <BsBag /> {hasSizes ? "Choose size" : "Add to cart"}
            </button>
          </div>
        )}
      </div>

      <div className="product-info">
        <span className="product-brand">{product?.brand}</span>
        <h3 className="product-title" onClick={openProduct} title={product?.title}>
          {product?.title}
        </h3>
        {product?.ratings?.length > 0 && (
          <div className="rating-line">
            <Stars value={product.totalrating} />
            <span>({product.ratings.length})</span>
          </div>
        )}
        <p
          className="product-desc"
          dangerouslySetInnerHTML={{ __html: product?.description || "" }}
        />
        <p className="product-price">{formatPrice(product?.price)}</p>
      </div>
    </article>
  );
};

export const ProductSkeleton = () => (
  <div className="skeleton-card" aria-hidden="true">
    <div className="skeleton skeleton-media" />
    <div className="skeleton skeleton-line" />
    <div className="skeleton skeleton-line" />
    <div className="skeleton skeleton-line short" />
  </div>
);

// Grid of cards; `cols` sets the desktop column count, `view="list"` switches to rows
const ProductGrid = ({ products, loading, cols = 4, view = "grid", skeletons = 8 }) => (
  <div className={`product-grid ${view === "list" ? "list" : ""}`} style={{ "--cols": cols }}>
    {loading
      ? Array.from({ length: skeletons }).map((_, i) => <ProductSkeleton key={i} />)
      : (products || []).map((p) => <ProductCard key={p._id} product={p} />)}
  </div>
);

export default ProductGrid;
