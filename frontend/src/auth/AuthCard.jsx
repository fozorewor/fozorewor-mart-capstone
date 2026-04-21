import API from "../config/api";
import "./authPages.css";

export default function AuthCard({
  topline,
  title,
  subtitle,
  showBrandTag = true,
  children,
  footer,
}) {
  return (
    <div className="authPage">
      <section className="authCard">
        <div className="authInner">
          <div className="authBrand" aria-label="Fozorewor Mart">
            <img
              className="authBrandLogo"
              src={`${API}/images/icons/fozorewor-mart.png`}
              alt="Fozorewor Mart"
            />
          </div>

          {showBrandTag && (
            <div className="authBrandTag">FRESH GROCERIES, FAST DELIVERY</div>
          )}

          {topline && <div className="authTopline">{topline}</div>}
          <h1 className="authTitle">{title}</h1>
          <p className="authSubtitle">{subtitle}</p>

          {children}

          {footer}
        </div>
      </section>
    </div>
  );
}

