import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/pricing";

// Vertical product videos; renders nothing when no product has a video
const ShopTheLook = ({ products }) => {
  const navigate = useNavigate();
  const looks = (products || []).filter((p) => p?.videos?.[0]?.url).slice(0, 10);

  if (!looks.length) return null;

  return (
    <section>
      <div className="section-head">
        <div>
          <h2 className="section-heading">Shop the look</h2>
          <p>See it in motion, then make it yours</p>
        </div>
      </div>
      <div className="h-scroll" style={{ gridAutoColumns: "minmax(200px, 240px)" }}>
        {looks.map((p) => (
          <div
            key={p._id}
            className="product-card shop-the-look"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/product/${p._id}`)}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/product/${p._id}`)}
          >
            <video
              src={p.videos[0].url}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              style={{ width: "100%", objectFit: "cover", display: "block", borderRadius: 0 }}
            />
            <div className="product-info">
              <h3 className="product-title" style={{ minHeight: 0 }}>{p.title}</h3>
              <p className="product-price">{formatPrice(p.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ShopTheLook;
