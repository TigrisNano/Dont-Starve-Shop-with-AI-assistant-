import React from "react";
import { useCart } from "./CartContext";
import "./CartPage.css";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, totalCount, totalPrice } =
    useCart();

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      {items.length === 0 ? (
        <p className="cart-empty">Cart is empty</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th style={{ width: "120px" }}>Price</th>
                <th style={{ width: "160px" }}>Quantity</th>
                <th style={{ width: "120px" }}>Subtotal</th>
                <th style={{ width: "80px" }}> </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key}>
                  <td>
                    <img
                      src={item.image_path}
                      alt={item.name}
                      className="cart-thumb"
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.price} gold</td>
                  <td>
                    <div className="cart-qty">
                      <button
                        onClick={() => updateQty(item.key, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.key, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{item.price * item.quantity} gold</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.key)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <div>
              <b>Items:</b> {totalCount}
            </div>
            <div>
              <b>Total:</b> {totalPrice} gold
            </div>
          </div>

          <div className="cart-actions">
            <button
              className="checkout-btn"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    alert("Please login to checkout");
                    return;
                  }

                  const response = await fetch(
                    "http://localhost:3001/api/orders",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        items: items.map((i) => ({
                          id: i.id,
                          name: i.name,
                          quantity: i.quantity,
                          price: i.price,
                          category: i.category,
                        })),
                        totalPrice,
                      }),
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    alert(data.error || "Order failed");
                    return;
                  }

                  alert(
                    `Order successful! New balance: ${data.newBalance} gold`
                  );
                  clearCart();

                  window.dispatchEvent(new Event("updateBalance"));
                } catch (err) {
                  console.error("Checkout error:", err);
                  alert("Checkout failed");
                }
              }}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
