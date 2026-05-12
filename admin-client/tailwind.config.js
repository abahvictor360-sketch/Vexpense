/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0b',
          card: '#13131a',
          hover: '#1a1a24',
          input: '#0f0f15',
        },
        line: '#23232e',
        ink: {
          DEFAULT: '#e8e8ee',
          dim: '#9a9aa6',
          muted: '#5e5e6b',
        },
        accent: {
          DEFAULT: '#6366f1',
          soft: '#4f46e5',
        },
        ok: '#22c55e',
        warn: '#f59e0b',
        err: '#ef4444',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
