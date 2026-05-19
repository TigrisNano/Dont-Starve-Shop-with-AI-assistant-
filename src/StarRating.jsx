import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

export default function StarRating({ rating, setRating }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: "flex", gap: "5px" }}>
      {[...Array(5)].map((_, i) => {
        const ratingValue = i + 1;
        return (
          <label key={i}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => setRating(ratingValue)}
              style={{ display: "none" }}
            />
            <FaStar
              size={24}
              color={ratingValue <= (hover || rating) ? "#FFD700" : "#ccc"}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
          </label>
        );
      })}
    </div>
  );
}
