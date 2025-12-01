/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strix color palette from tui_styles.tcss
        strix: {
          bg: '#1a1a1a',
          surface: '#0a0a0a',
          border: '#262626',
          'text-primary': '#d4d4d4',
          'text-secondary': '#737373',
          'text-muted': '#525252',
        },
        accent: {
          green: '#22c55e',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          yellow: '#fbbf24',
          orange: '#f59e0b',
          purple: '#a855f7',
          red: '#ef4444',
          teal: '#10b981',
        },
        severity: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
          info: '#6b7280',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
