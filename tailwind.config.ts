import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7fa",
          100: "#e9edf3",
          600: "#1e293b",
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
