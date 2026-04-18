/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Nếu bạn dùng Tailwind v4
    // tailwindcss: {},          // Nếu bạn dùng Tailwind v3
    autoprefixer: {},
  },
};

export default config;