import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "./CartContext";
import "./ProductPage.css";
import StarRating from "./StarRating";

export default function ProductPage() {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState("");

  const token = localStorage.getItem("token");
  const isAuthenticated = Boolean(token);
  let username = null;

  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      username = payload.username;
    }
  } catch {}

  useEffect(() => {
    let mounted = true;
    axios
      .get("http://localhost:3001/api/items")
      .then((res) => {
        if (mounted) {
          setAllItems(res.data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const product = useMemo(() => {
    const pid = Number(id);
    return allItems.find(
      (i) => i.category === category && Number(i.id) === pid
    );
  }, [allItems, category, id]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3001/api/reviews/${category}:${id}`
      );
      setReviews(res.data);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  };

  useEffect(() => {
    if (product) fetchReviews();
  }, [product]);

  const handleAddReview = async () => {
    if (!newText.trim()) return;
    try {
      await axios.post(
        `http://localhost:3001/api/reviews/${category}:${id}`,
        { rating: newRating, review_text: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewText("");
      setNewRating(5);
      fetchReviews();
    } catch (err) {
      console.error("Error adding review:", err);
    }
  };

  const handleEdit = (r) => {
    setEditingId(r.review_id);
    setEditRating(r.rating);
    setEditText(r.review_text);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `http://localhost:3001/api/reviews/${editingId}`,
        { rating: editRating, review_text: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditRating(5);
      setEditText("");
      fetchReviews();
    } catch (err) {
      console.error("Error updating review:", err);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (editingId === reviewId) {
        setEditingId(null);
        setEditRating(5);
        setEditText("");
      }

      fetchReviews();
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  if (loading)
    return (
      <div className="product-container">
        <p>Loading...</p>
      </div>
    );

  if (!product)
    return (
      <div className="product-container">
        <p>Product not found.</p>
      </div>
    );

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        category: product.category,
        name: product.name,
        price: product.price,
        image_path: product.image_path,
        description: product.description,
      },
      qty
    );
    navigate("/cart");
  };

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(
        1
      )
    : null;

  return (
    <div className="product-container">
      <div className="product-card">
        <img
          src={product.image_path}
          alt={product.name}
          className="product-image"
        />
        <div className="product-info">
          <h2>{product.name}</h2>
          <p className="product-category">
            <b>Category:</b> {product.category}
          </p>
          <p className="product-price">
            <b>Price:</b> {product.price} gold
          </p>

          {avgRating && (
            <p className="product-rating">
              <b>Average rating:</b> ⭐ {avgRating}/5.0 ({reviews.length}{" "}
              reviews)
            </p>
          )}

          <p className="product-desc">{product.description}</p>

          {isAuthenticated && (
            <div className="qty-row">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="qty-btn"
              >
                −
              </button>
              <span className="qty-val">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="qty-btn">
                +
              </button>
            </div>
          )}

          {isAuthenticated ? (
            <button className="add-to-cart" onClick={handleAdd}>
              Add to cart
            </button>
          ) : (
            <button className="login-to-buy" onClick={() => navigate("/login")}>
              Login to buy
            </button>
          )}
        </div>
      </div>

      <div className="reviews-dark">
        <h3>Reviews</h3>

        {isAuthenticated && (
          <div className="add-review">
            {editingId ? (
              <>
                <h4>Edit your review</h4>
                <div className="rating-stars">
                  <StarRating rating={editRating} setRating={setEditRating} />
                </div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Edit your review..."
                />
                <div className="review-buttons">
                  <button onClick={handleSaveEdit}>Save</button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditRating(5);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4>Leave a review</h4>
                <div className="rating-stars">
                  <StarRating rating={newRating} setRating={setNewRating} />
                </div>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Write your review..."
                />
                <button onClick={handleAddReview}>Submit</button>
              </>
            )}
          </div>
        )}

        {reviews.length === 0 && <p>No reviews yet.</p>}

        {reviews.map((r) => (
          <div key={r.review_id} className="review">
            <p style={{ marginBottom: "5px" }}>
              <b>{r.username}</b> ⭐ {r.rating}/5
            </p>
            <p>{r.review_text}</p>
            <small>{new Date(r.created_at).toLocaleString()}</small>

            {username === r.username && (
              <div className="review-actions">
                <button onClick={() => handleEdit(r)}>Edit</button>
                <button onClick={() => handleDelete(r.review_id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
