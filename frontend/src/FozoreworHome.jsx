import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import { useCart } from "./cart/CartContext";
import API from "./config/api";

export default function FozoreworHome() {
  const { token } = useAuth();
  const { addItem, getItemQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState({});

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        setError("");
        const response = await fetch(API + "/products");
        if (!response.ok) {
          throw new Error("Could not load products.");
        }

        const result = await response.json();
        if (!ignore) {
          setProducts(Array.isArray(result) ? result : []);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Could not load products.");
          setProducts([]);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = ["All", ...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  function handleAddToCart(product) {
    addItem(product);
    setRecentlyAdded((currentState) => ({
      ...currentState,
      [product.id]: true,
    }));

    window.setTimeout(() => {
      setRecentlyAdded((currentState) => {
        if (!currentState[product.id]) return currentState;

        const nextState = { ...currentState };
        delete nextState[product.id];
        return nextState;
      });
    }, 1400);
  }

  return (
    <div className="fz-page">
      {!token && (
        <section className="fz-hero">
          <div className="fz-hero-copy">
            <p className="fz-eyebrow">New to Fozorewor Mart?</p>
            <h1>Create your account and start shopping faster.</h1>
            <p className="fz-hero-text">
              Register with your username, email, and password to save your session and use
              the grocery catalog from one app.
            </p>
          </div>

          <div className="fz-hero-actions">
            <Link className="fz-primary fz-primary-link" to="/register">
              Register now
            </Link>
            <Link className="fz-secondary-link" to="/login">
              Already have an account? Sign in
            </Link>
          </div>
        </section>
      )}

      <section className="fz-categories" aria-label="Categories">
        {categories.map((category) => (
          <button
            key={category}
            className="fz-chip"
            type="button"
            onClick={() => setSelectedCategory(category)}
          >
            <div className="fz-chip-thumb" aria-hidden="true" />
            <span className="fz-chip-label">{category}</span>
          </button>
        ))}
      </section>

      <section className="fz-section" aria-label="Popular in your area">
        <header className="fz-section-header">
          <h2>Popular in your area</h2>
          <button className="fz-link" type="button">
            see all
          </button>
        </header>

        <div className="fz-grid">
          {error ? (
            <article className="fz-card">
              <div className="fz-card-body">
                <h3 className="fz-card-title">Products unavailable</h3>
                <p className="fz-card-subtitle">{error}</p>
              </div>
            </article>
          ) : null}

          {!error && visibleProducts.length === 0 ? (
            <article className="fz-card">
              <div className="fz-card-body">
                <h3 className="fz-card-title">No products yet</h3>
                <p className="fz-card-subtitle">
                  Seed the database to load the grocery catalog.
                </p>
              </div>
            </article>
          ) : null}

          {visibleProducts.map((product) => (
            <article key={product.name} className="fz-card">
              <div className="fz-card-media">
                <img
                  className="fz-card-image"
                  src={`${API}/${product.image_path}`}
                  alt={product.name}
                />
              </div>
              <div className="fz-card-body">
                {getItemQuantity(product.id) > 0 ? (
                  <div className="fz-card-cart-state">
                    In cart: {getItemQuantity(product.id)}
                  </div>
                ) : null}
                {recentlyAdded[product.id] ? (
                  <div className="fz-card-added-state">Added to cart</div>
                ) : null}
                <h3 className="fz-card-title">{product.name}</h3>
                <p className="fz-card-subtitle">
                  {product.unit_label || "1 unit"} · ${Number(product.price || 0).toFixed(2)}
                </p>
                <button
                  className="fz-primary"
                  type="button"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

