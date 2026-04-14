import "./authPages.css";

function BrandMark() {
  return (
    <svg
      className="authBrandMark"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 18h6l5 26h26l6-18H23"
        stroke="#0f172a"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 52a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        fill="#0078d4"
      />
      <path
        d="M47 52a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        fill="#0078d4"
      />
      <path
        d="M30 16l4 6 7-8"
        stroke="#0078d4"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
            <BrandMark />
            <div className="authBrandName">
              FOZOREWOR
              <br />
              <span className="authBrandAccent">MART</span>
            </div>
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

