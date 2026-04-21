import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import API from "../config/api";
import { useAuth } from "../auth/AuthContext";
import { calculateSummary, useCart } from "./CartContext";
import { saveLocalOrder } from "../orders/localOrders";
import "../../styles/shared/general.css";
import "../../styles/pages/checkout/checkout-header.css";
import "../../styles/pages/checkout/checkout.css";

function formatMoneyFromCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { token } = useAuth();
  const summary = calculateSummary(items);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function placeOrder() {
    if (!token) {
      navigate("/login");
      return;
    }

    setPending(true);
    setError("");

    try {
      let response;

      try {
        response = await fetch(`${API}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });
      } catch {
        const localOrder = saveLocalOrder(token, items, summary);
        clearCart();
        navigate(`/tracking/${localOrder.id}`);
        return;
      }

      if (!response.ok) {
        const rawBody = await response.text();
        let message = "Could not place your order.";

        try {
          const parsed = JSON.parse(rawBody);
          message = parsed.error || message;
        } catch {
          if (rawBody) message = rawBody;
        }

        throw new Error(message);
      }

      const order = await response.json();
      clearCart();
      navigate(`/tracking/${order.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="checkout-header">
        <div className="header-content">
          <div className="checkout-header-left-section">
            <Link className="site-brand" to="/">
              <img
                className="site-logo"
                src={`${API}/images/icons/fozorewor-mart.png`}
                alt="Fozorewor Mart"
              />
            </Link>
          </div>

          <div className="checkout-header-middle-section">
            Checkout (<Link className="return-to-home-link" to="/">{itemCount} items</Link>)
          </div>

          <div className="checkout-header-right-section">
            <div className="checkout-cart-icon" aria-hidden="true">
              <img src={`${API}/images/icons/cart-icon.png`} alt="" />
              <span className="checkout-cart-count">{itemCount}</span>
            </div>
            <img
              src={`${API}/images/icons/checkout-lock-icon.png`}
              alt="Secure checkout"
            />
          </div>
        </div>
      </header>

      <div className="checkoutPage">
        <div className="page-title">Review your order</div>

        <div className="checkout-grid">
          <section>
            {items.length === 0 ? (
              <div className="cart-item-container empty-cart-message">
                Your cart is empty.
                <Link to="/">Browse groceries</Link>
              </div>
            ) : (
              items.map((item) => (
                <article key={item.productId} className="cart-item-container">
                  <div className="delivery-date">Delivery estimate: Tomorrow</div>

                  <div className="cart-item-details-grid">
                    <img
                      className="product-image"
                      src={`${API}/${item.imagePath}`}
                      alt={item.name}
                    />

                    <div>
                      <div className="product-name">{item.name}</div>
                      <div className="product-price">
                        {formatMoneyFromCents(item.priceCents)}
                      </div>
                      <div className="product-quantity">
                        {item.unitLabel}
                        <button
                          className="delete-quantity-link"
                          type="button"
                          onClick={() => removeItem(item.productId)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="quantity-controls">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                          }
                        >
                          -
                        </button>
                        <span className="quantity-label">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="delivery-options">
                      <div className="delivery-options-title">Order summary</div>
                      <div className="delivery-option">
                        <input
                          className="delivery-option-input"
                          type="radio"
                          checked
                          readOnly
                        />
                        <div>
                          <div className="delivery-option-date">Standard delivery</div>
                          <div className="delivery-option-price">
                            Item total: {formatMoneyFromCents(item.priceCents * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="payment-summary">
            <div className="payment-summary-title">Order Summary</div>

            <div className="payment-summary-row">
              <div>Items ({itemCount}):</div>
              <div className="payment-summary-money">
                {formatMoneyFromCents(summary.subtotalCents)}
              </div>
            </div>

            <div className="payment-summary-row">
              <div>Delivery:</div>
              <div className="payment-summary-money">
                {formatMoneyFromCents(summary.deliveryFeeCents)}
              </div>
            </div>

            <div className="payment-summary-row subtotal-row">
              <div>Tax:</div>
              <div className="payment-summary-money">
                {formatMoneyFromCents(summary.taxCents)}
              </div>
            </div>

            <div className="payment-summary-row total-row">
              <div>Order total:</div>
              <div className="payment-summary-money">
                {formatMoneyFromCents(summary.totalCents)}
              </div>
            </div>

            <button
              className="button-primary place-order-button"
              type="button"
              disabled={items.length === 0 || pending}
              onClick={() => {
                placeOrder().catch((error) => {
                  setError(error.message);
                });
              }}
            >
              {token ? (pending ? "Placing order..." : "Place your order") : "Sign in to checkout"}
            </button>
            {error ? <div className="checkout-inline-error">{error}</div> : null}
          </aside>
        </div>
      </div>
    </>
  );
}
