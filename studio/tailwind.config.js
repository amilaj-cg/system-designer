/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f1320',
        panel: '#161b2d',
        panel2: '#1c2238',
        line: '#2a3350',
        ink: '#e8ecf6',
        muted: '#97a1bd',
        accent: '#6ea8fe',
        accent2: '#5fd0c3',
        good: '#5bd98a',
        warn: '#ffcf66',
        bad: '#ff7a7a',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
