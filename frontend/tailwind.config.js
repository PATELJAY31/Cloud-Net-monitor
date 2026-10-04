/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cloudnet: {
          ink: '#102033',
          panel: '#f7fafc',
          line: '#d8e2ec',
          blue: '#2563eb',
          cyan: '#0891b2',
          green: '#16a34a',
          amber: '#d97706',
          red: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
