import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import API from "../config/api";
import { useAuth } from "../auth/AuthContext";
import { getLocalOrderById } from "./localOrders";
import "../../styles/shared/general.css";
import "../../styles/pages/tracking.css";

function formatDate(value) {
  if (!value) return "Pending";
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrackingPage() {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      if (!token) {
        setStatus("unauthorized");
        return;
      }

      try {
        setStatus("loading");
        setError("");

        const response = await fetch(`${API}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not load that order.");
        }

        const result = await response.json();

        if (!ignore) {
          setOrder(result);
          setStatus("ready");
        }
      } catch (loadError) {
        if (!ignore) {
          const fallbackOrder = getLocalOrderById(token, orderId);

          if (fallbackOrder) {
            setOrder(fallbackOrder);
            setStatus("ready");
          } else {
            setStatus("error");
            setError(loadError.message || "Could not load that order.");
          }
        }
      }
    }

    loadOrder();

    return () => {
      ignore = true;
    };
  }, [orderId, token]);

  const leadItem = order?.items?.[0];
  const progressWidth = order?.status === "delivered" ? "100%" : "62%";
  const itemSummary =
    order && leadItem
      ? order.items.length > 1
        ? `${leadItem.name} and ${order.items.length - 1} more item(s)`
        : leadItem.name
      : "";

  return (
    <div className="trackingPage page-main">
      <div className="order-tracking">
        <Link className="back-to-orders-link link-primary" to="/orders">
          View all orders
        </Link>

        {status === "loading" ? (
          <div className="tracking-summary-card">Loading tracking details...</div>
        ) : null}

        {status === "unauthorized" ? (
          <div className="tracking-summary-card">Sign in to track your order.</div>
        ) : null}

        {status === "error" ? (
          <div className="tracking-summary-card">{error}</div>
        ) : null}

        {status === "ready" && order && leadItem ? (
          <>
            <article className="tracking-summary-card">
              <div className="delivery-date">
                Arriving: {formatDate(order.delivery_date)}
              </div>
              <div className="product-info">{itemSummary}</div>
              <div
                className={[
                  "tracking-status",
                  order.status === "delivered"
                    ? "tracking-status-delivered"
                    : "tracking-status-placed",
                ].join(" ")}
              >
                {order.status === "delivered" ? "Delivered" : "On the way"}
              </div>
              <img
                className="product-image"
                src={`${API}/${leadItem.image_path}`}
                alt={leadItem.name}
              />
              <div className="tracking-status-note">
                Order total: ${Number(order.total || 0).toFixed(2)}
              </div>
            </article>

            <div className="progress-labels-container">
              <div className="progress-label current-status">Preparing</div>
              <div className="progress-label current-status">Out for delivery</div>
              <div
                className={[
                  "progress-label",
                  order.status === "delivered" ? "current-status" : "",
                ].join(" ")}
              >
                Delivered
              </div>
            </div>

            <div className="progress-bar-container" aria-hidden="true">
              <div className="progress-bar" style={{ width: progressWidth }} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
