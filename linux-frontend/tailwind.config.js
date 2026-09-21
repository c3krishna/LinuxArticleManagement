/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c2434',
        paper: '#f6f7f9',
        navy: '#0f2744'
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      fontSize: {
        body: ['18px', { lineHeight: '1.75' }]
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};
