const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Page navigations: try the network first (so you always get the
      // latest page when online), but fall back to the last cached copy of
      // that page if the network drops mid-navigation — this is what
      // prevents the raw "ERR_NETWORK_CHANGED" browser error page from
      // showing once the app has been opened at least once before.
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 6,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      // Cache app shell / static assets. Data itself always goes to Supabase
      // (the cloud database), never served from this cache.
      urlPattern: /^https?.*\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "static-assets" },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
