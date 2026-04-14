const defaultLoaderUrl = "https://js-agent.newrelic.com/nr-loader-spa-current.min.js";

function toBool(value) {
  return String(value).toLowerCase() === "true";
}

export function initializeNewRelicBrowser() {
  if (!toBool(import.meta.env.VITE_NEW_RELIC_ENABLED)) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.NREUM?.initialized || document.querySelector('script[data-nr-loader="true"]')) return;

  const accountID = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID;
  const trustKey = import.meta.env.VITE_NEW_RELIC_TRUST_KEY || accountID;
  const agentID = import.meta.env.VITE_NEW_RELIC_AGENT_ID;
  const applicationID = import.meta.env.VITE_NEW_RELIC_APPLICATION_ID;
  const licenseKey = import.meta.env.VITE_NEW_RELIC_BROWSER_LICENSE_KEY;
  const beacon = import.meta.env.VITE_NEW_RELIC_BEACON || "bam.nr-data.net";
  const errorBeacon = import.meta.env.VITE_NEW_RELIC_ERROR_BEACON || "bam.nr-data.net";
  const loaderUrl = import.meta.env.VITE_NEW_RELIC_LOADER_URL || defaultLoaderUrl;

  if (!accountID || !agentID || !applicationID || !licenseKey) {
    console.warn(
      "New Relic browser agent not started: missing one or more required VITE_NEW_RELIC_* values.",
    );
    return;
  }

  window.NREUM = window.NREUM || {};
  window.NREUM.init = {
    distributed_tracing: { enabled: true },
    ajax: { deny_list: [beacon] },
  };
  window.NREUM.loader_config = {
    accountID,
    trustKey,
    agentID,
    licenseKey,
    applicationID,
  };
  window.NREUM.info = {
    beacon,
    errorBeacon,
    licenseKey,
    applicationID,
    sa: 1,
  };

  const script = document.createElement("script");
  script.src = loaderUrl;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.nrLoader = "true";
  document.head.appendChild(script);

  window.NREUM.initialized = true;
}
