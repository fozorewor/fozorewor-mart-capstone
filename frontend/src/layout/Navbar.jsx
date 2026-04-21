import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="fz-nav">
      <NavLink className="fz-brand" to="/">
        <span className="fz-brand-title">FOZOREWOR</span>
        <span className="fz-brand-subtitle">MART</span>
      </NavLink>

      <form className="fz-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="fz-sr-only" htmlFor="fz-search-input">
          Search for groceries
        </label>
        <input
          id="fz-search-input"
          className="fz-search-input"
          type="search"
          placeholder="Search for groceries"
        />
        <button className="fz-search-button" type="submit">
          Search
        </button>
      </form>

      <nav className="fz-nav-actions" aria-label="Account and cart">
        {token ? (
          <button
            className="fz-nav-button fz-nav-link-primary"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        ) : (
          <>
            <NavLink className="fz-nav-link fz-nav-link-primary" to="/login">
              Login
            </NavLink>
            <NavLink className="fz-nav-link fz-nav-link-primary" to="/register">
              Register
            </NavLink>
          </>
        )}

        <NavLink className="fz-nav-link fz-nav-link-primary" to="/orders">
          Returns &amp; Orders
        </NavLink>

        <button className="fz-cart" type="button" onClick={() => navigate("/checkout")}>
          <span className="fz-cart-badge" aria-label="Items in cart">
            {itemCount}
          </span>
          My Cart
        </button>
      </nav>
    </header>
  );
}
