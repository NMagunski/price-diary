/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — driven by CSS variables (see globals.css)
        // Dark mode works automatically via .dark class on <html>
        bg:          "var(--color-bg)",
        surface:     "var(--color-surface)",
        fg:          "var(--color-fg)",
        "fg-2":      "var(--color-fg-secondary)",
        accent:      "var(--color-accent)",
        "accent-h":  "var(--color-accent-hover)",
        "accent-l":  "var(--color-accent-light)",
        stroke:      "var(--color-border)",
        muted:       "var(--color-muted)",
        "muted-fg":  "var(--color-muted-fg)",
        danger:      "var(--color-error)",
        "danger-l":  "var(--color-error-light)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
