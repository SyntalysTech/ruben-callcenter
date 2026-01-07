import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-red-500',
    'bg-yellow-400',
    'bg-orange-500',
    'bg-blue-500',
    'bg-green-500',
    'ring-red-500',
    'ring-yellow-400',
    'ring-orange-500',
    'ring-blue-500',
    'ring-green-500',
    'text-white',
    'text-black',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2F5F49",
          text: "#E8EDE6",
        },
        status: {
          red: "#EF4444",
          yellow: "#EAB308",
          orange: "#F97316",
          blue: "#3B82F6",
          green: "#22C55E",
        },
      },
    },
  },
  plugins: [],
};

export default config;
