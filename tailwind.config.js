/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5aa0',
              },
            },
          },
        },
        dark: {
          css: {
            color: '#d1d5db',
            '[class~="lead"]': {
              color: '#9ca3af',
            },
            a: {
              color: '#60a5fa',
              '&:hover': {
                color: '#93c5fd',
              },
            },
            strong: {
              color: '#f9fafb',
            },
            'ol > li::marker': {
              color: '#9ca3af',
            },
            'ul > li::marker': {
              color: '#9ca3af',
            },
            hr: {
              borderColor: '#374151',
            },
            blockquote: {
              color: '#9ca3af',
              borderLeftColor: '#4b5563',
            },
            h1: {
              color: '#f9fafb',
            },
            h2: {
              color: '#f9fafb',
            },
            h3: {
              color: '#f9fafb',
            },
            h4: {
              color: '#f9fafb',
            },
            'figure figcaption': {
              color: '#9ca3af',
            },
            code: {
              color: '#f9fafb',
              backgroundColor: '#374151',
            },
            'pre code': {
              backgroundColor: 'transparent',
            },
            pre: {
              color: '#f9fafb',
              backgroundColor: '#1f2937',
            },
            thead: {
              color: '#f9fafb',
              borderBottomColor: '#4b5563',
            },
            'tbody tr': {
              borderBottomColor: '#374151',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 