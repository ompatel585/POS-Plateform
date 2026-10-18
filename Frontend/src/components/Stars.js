import React from "react";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";

// Read-only star display that handles half stars (e.g. 4.3 → ★★★★½)
const Stars = ({ value = 0, size }) => {
  const rating = Number(value) || 0;
  const style = size ? { width: size, height: size } : undefined;
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        if (rating >= n) return <BsStarFill key={n} style={style} />;
        if (rating >= n - 0.5) return <BsStarHalf key={n} style={style} />;
        return <BsStar key={n} className="empty" style={style} />;
      })}
    </span>
  );
};

export default Stars;
