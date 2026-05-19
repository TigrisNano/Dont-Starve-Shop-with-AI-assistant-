import React, { useEffect, useState } from "react";
import "./OrderPage.css";

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login to view your orders");
          return;
        }

        const response = await fetch("http://localhost:3001/api/orders/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to load orders");
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        alert("Could not load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  if (orders.length === 0)
    return <p style={{ textAlign: "center" }}>You have no orders yet.</p>;

  return (
    <div className="orders-container">
      <h2>Your Orders</h2>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <div>
              <b>Date:</b> {new Date(order.order_date).toLocaleString()}
            </div>
          </div>

          <table className="order-items">
            <thead>
              <tr>
                <th>Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price} gold</td>
                  <td>{item.quantity * item.price} gold</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
