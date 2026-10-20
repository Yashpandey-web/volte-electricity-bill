export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'ui-monospace', 'monospace'] },
    colors: { ink: '#0A1020', navy: '#0F1A33', charcoal: '#1A2238', paper: '#FAF8F4', volt: '#3B82F6' }
  } },
  plugins: []
}
