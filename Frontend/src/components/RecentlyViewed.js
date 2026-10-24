import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentlyViewed } from "../utils/storage";
import { formatPrice } from "../utils/pricing";

const RecentlyViewed = ({ excludeId, title = "Recently viewed" }) => {
  const navigate = useNavigate();
  const items = useMemo(
    () => getRecentlyViewed().filter((p) => p._id !== excludeId),
    [excludeId]
  );

  if (!items.length) return null;

  return (
    <section>
      <div className="section-head">
        <h2 className="section-heading">{title}</h2>
      </div>
      <div className="h-scroll" style={{ gridAutoColumns: "minmax(170px, 200px)" }}>
        {items.map((p) => (
          <div
            key={p._id}
            className="product-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/product/${p._id}`)}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/product/${p._id}`)}
          >
            <div className="product-media" style={{ aspectRatio: "1 / 1" }}>
              {p.images?.[0]?.url ? (
                <img src={p.images[0].url} alt={p.title} loading="lazy" />
              ) : (
                <div className="no-media">No image</div>
              )}
            </div>
            <div className="product-info">
              <h3 className="product-title" style={{ fontSize: 14 }}>{p.title}</h3>
              <p className="product-price" style={{ fontSize: 15 }}>{formatPrice(p.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
