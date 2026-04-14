const CATEGORIES = [
  "All",
  "Dairy",
  "Fruits",
  "Grains",
  "Meat",
  "Snacks",
  "Vegetables",
];

const PLACEHOLDER_PRODUCTS = [
  { name: "Fresh item", subtitle: "1 unit" },
  { name: "Daily essential", subtitle: "500 g" },
  { name: "Popular pick", subtitle: "1 pack" },
  { name: "Top rated", subtitle: "1 kg" },
  { name: "New arrival", subtitle: "1 unit" },
  { name: "Best value", subtitle: "2 units" },
];

export default function FozoreworHome() {
  return (
    <div className="fz-page">
      <section className="fz-categories" aria-label="Categories">
        {CATEGORIES.map((category) => (
          <button key={category} className="fz-chip" type="button">
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
          {PLACEHOLDER_PRODUCTS.map((product) => (
            <article key={product.name} className="fz-card">
              <div className="fz-card-media" aria-hidden="true" />
              <div className="fz-card-body">
                <h3 className="fz-card-title">{product.name}</h3>
                <p className="fz-card-subtitle">{product.subtitle}</p>
                <button className="fz-primary" type="button">
                  Add
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

