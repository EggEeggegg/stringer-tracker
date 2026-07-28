import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#F3EFE4",
          card: "#FFFcf5",
          hover: "rgba(47,107,58,0.06)",
        },
        border: {
          DEFAULT: "rgba(47,107,58,0.14)",
          focus: "#2F6B3A",
        },
        content: {
          DEFAULT: "#1F2E1C",
          muted: "#5C6B57",
          dim: "#8A9784",
        },
        accent: {
          green: "#2F6B3A",
          lime: "#5B9A4A",
          amber: "#B8860B",
          teal: "#2A7A6E",
          red: "#C44B4B",
        },
      },
      fontFamily: {
        sans: ["Sarabun", "-apple-system", "sans-serif"],
        mono: ["Space Grotesk", "monospace"],
      },
      borderRadius: {
        card: "16px",
        item: "14px",
        input: "12px",
        chip: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
