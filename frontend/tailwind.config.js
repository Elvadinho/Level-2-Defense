/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vichy: {
          teal: {
            DEFAULT: '#05AD98',
            50: '#F0FDFB',
            100: '#E0F8F5',
            200: '#B8EFE8',
            300: '#8AE3D7',
            400: '#45D1C0',
            500: '#05AD98',
            600: '#049381',
            700: '#037667',
            800: '#035D52',
            900: '#024D44',
            950: '#012B26',
          },
          silver: {
            DEFAULT: '#BBBFBF',
            light: '#E2E5E5',
            50: '#F8F9F9',
            100: '#F1F3F3',
            200: '#E2E5E5',
            300: '#D1D5D5',
            400: '#BBBFBF',
            500: '#A1A7A7',
            600: '#899090',
            700: '#717878',
            800: '#5C6262',
            900: '#4B5050',
          },
          gray: {
            DEFAULT: '#878787',
            50: '#F7F7F7',
            100: '#EFEFEF',
            200: '#DCDCDC',
            300: '#C4C4C4',
            400: '#A6A6A6',
            500: '#878787',
            600: '#6E6E6E',
            700: '#565656',
            800: '#424242',
            900: '#2A2A2A',
            950: '#171717',
          },
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(5, 173, 152, 0.25)',
      },
    },
  },
  plugins: [],
}
