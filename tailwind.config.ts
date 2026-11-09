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
        hanji: {
          DEFAULT: "#F7F4ED",
          dark: "#EFEAE0",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#252923",
          muted: "#5A6056",
          light: "#868C81",
        },
        pine: {
          DEFAULT: "#29493D",
          hover: "#1E372D",
          light: "#EBF1EE",
        },
        cinnabar: {
          DEFAULT: "#A7473D",
          hover: "#8B3930",
          light: "#F9ECEB",
        },
        ochre: {
          DEFAULT: "#9E722C",
          light: "#FBF5E9",
          border: "#E2C799",
        },
        border: {
          DEFAULT: "#DDD6C9",
          strong: "#C5BBAE",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', "Batang", "Georgia", "serif"],
        sans: ['"Noto Sans KR"', "Pretendard", '"Malgun Gothic"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        archive: "0 1px 3px 0 rgba(37, 41, 35, 0.05), 0 1px 2px -1px rgba(37, 41, 35, 0.05)",
        "archive-md": "0 4px 12px -2px rgba(37, 41, 35, 0.07), 0 2px 6px -2px rgba(37, 41, 35, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
