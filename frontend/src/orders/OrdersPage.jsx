import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API from "../config/api";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { getLocalOrders } from "./localOrders";
import "../../styles/shared/general.css";
import "../../styles/pages/orders.css";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "Pending";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const { token } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      if (!token) {
        setOrders([]);
        setStatus("unauthorized");
        return;
      }

      try {
        setStatus("loading");
        setError("");

        const response = await fetch(`${API}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not load your orders.");
        }

        const result = await response.json();

        if (!ignore) {
          setOrders(Array.isArray(result) ? result : []);
          setStatus("ready");
        }
      } catch (loadError) {
        if (!ignore) {
          const fallbackOrders = getLocalOrders(token);
          setOrders(fallbackOrders);
          setStatus(fallbackOrders.length > 0 ? "ready" : "error");
          setError(loadError.message || "Could not load your orders.");
        }
      }
    }

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <div className="ordersPage page-main">
      <div className="page-title">Your Orders</div>

      <div className="orders-grid">
        {status === "loading" ? (
          <div className="orders-loading-state">Loading your orders...</div>
        ) : null}

        {status === "unauthorized" ? (
          <div className="orders-empty-state">
            <h2>Sign in to view your orders</h2>
            <p>Your checkout history will appear here after you place an order.</p>
            <Link className="orders-empty-link button-primary" to="/login">
              Go to login
            </Link>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="orders-loading-state">{error}</div>
        ) : null}

        {status === "ready" && orders.length === 0 ? (
          <div className="orders-empty-state">
            <h2>No orders yet</h2>
            <p>Add groceries to your cart and complete checkout to see them here.</p>
            <Link className="orders-empty-link button-primary" to="/">
              Start shopping
            </Link>
          </div>
        ) : null}

        {status === "ready" &&
          orders.map((order) => (
            <article key={order.id} className="order-container">
              <header className="order-header">
                <div className="order-header-left-section">
                  <div>
                    <div className="order-header-label">Placed</div>
                    <div>{formatDate(order.created_at)}</div>
                  </div>
                  <div>
                    <div className="order-header-label">Total</div>
                    <div>{formatMoney(order.total)}</div>
                  </div>
                  <div>
                    <div className="order-header-label">Delivering</div>
                    <div>{formatDate(order.delivery_date)}</div>
                  </div>
                </div>

                <div className="order-header-right-section">
                  <div className="order-header-id-block">Order ID: {order.id}</div>
                  <div className="order-status-row">
                    <span
                      className={[
                        "order-status-badge",
                        order.status === "delivered"
                          ? "order-status-delivered"
                          : "order-status-placed",
                      ].join(" ")}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </header>

              {order.items.map((item) => (
                <div key={item.id} className="order-details-grid">
                  <div className="product-image-container">
                    <img src={`${API}/${item.image_path}`} alt={item.name} />
                  </div>

                  <div className="product-details">
                    <div className="product-name">{item.name}</div>
                    <div className="product-delivery-date">
                      Delivery: {formatDate(order.delivery_date)}
                    </div>
                    <div className="product-quantity">
                      Quantity: {item.quantity} · {item.unit_label || "1 unit"}
                    </div>
                    <div className="product-line-total">
                      Line total: ${Number(item.line_total || 0).toFixed(2)}
                    </div>
                    <button
                      className="button-secondary buy-again-button"
                      type="button"
                      onClick={() =>
                        addItem({
                          id: item.product_id,
                          slug: item.slug,
                          name: item.name,
                          unit_label: item.unit_label,
                          image_path: item.image_path,
                          price_cents: item.unit_price_cents,
                        })
                      }
                    >
                      Buy again
                    </button>
                  </div>

                  <div className="product-actions">
                    <Link className="button-primary track-package-button" to={`/tracking/${order.id}`}>
                      Track package
                    </Link>
                  </div>
                </div>
              ))}
            </article>
          ))}
      </div>
    </div>
  );
}
