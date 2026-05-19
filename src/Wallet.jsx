import React, { useState } from "react";
import "./Wallet.css";

function Wallet() {
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");

  const handleUseCode = async () => {
    if (!promoCode.trim()) {
      setMessage("Please enter a promo code.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3001/api/wallet/promocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Invalid code.");
      } else {
        setMessage(`Balance increased by ${data.amount}!`);
        setPromoCode("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error.");
    }
  };

  return (
    <div className="wallet-container">
      <h2>Top up your balance</h2>

      <div className="wallet-section">
        <h3>Select a payment method</h3>
        <div className="wallet-placeholder">
          (Placeholder for card selection)
        </div>
      </div>

      <div className="wallet-section">
        <h3>Or enter a promo code</h3>

        <input
          type="text"
          className="wallet-input"
          placeholder="Promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
        />

        <button className="wallet-button" onClick={handleUseCode}>
          Use code
        </button>

        {message && <p className="wallet-message">{message}</p>}
      </div>
    </div>
  );
}

export default Wallet;
