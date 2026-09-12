/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite and pg ship native/fs code; they must stay outside the bundler and
  // run on the Node runtime. Bundling produces a broken/duplicated instance.
  serverExternalPackages: ['@electric-sql/pglite', 'katex', 'pg'],

  // Lint runs on build again. It had been off with no config file present,
  // which is how ~60 unused imports and two stale-closure effect bugs shipped
  // (react-hooks/exhaustive-deps flags both). See eslint.config.mjs.
  eslint: { dirs: ['src'] },

  // Source PDFs and question images are streamed through authenticated route
  // handlers, never served statically. Nothing large is imported at build time.
  experimental: {
    largePageDataBytes: 512 * 1024,
  },
};

export default nextConfig;
