/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c2434',
        paper: '#f6f7f9',
        navy: '#0f2744',
        // Admin workspace palette (docs/design/linuxdocs_article_manager_redesign.html).
        // Muted, green and amber are a shade darker than the mockup so small text meets WCAG AA.
        adm: {
          ink: '#172033',
          muted: '#5f6b80',
          line: '#e5eaf1',
          canvas: '#f5f7fb',
          blue: '#3157d5',
          'blue-dark': '#2447bd',
          'blue-soft': '#eef2ff',
          green: '#12704d',
          'green-bg': '#e9f8f0',
          amber: '#8a5206',
          'amber-bg': '#fff5df',
          red: '#b93838',
          'red-bg': '#fdecec',
          side: '#101a2d',
          'side-active': '#26365a',
          'side-hover': '#1a2943',
          'side-text': '#c3cde0',
          'side-muted': '#8f9db6',
          'side-line': '#29364e'
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        admin: ['"DM Sans"', 'system-ui', 'sans-serif'],
        'admin-mono': ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      fontSize: {
        body: ['18px', { lineHeight: '1.75' }]
      },
      boxShadow: {
        adm: '0 8px 24px rgba(20, 35, 65, 0.05)'
      },
      screens: {
        // Mockup breakpoints: sidebar collapses at 720px, two-column stats below 1100px.
        nav: '721px',
        wide: '1101px'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};
