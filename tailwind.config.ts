/* eslint-disable import/no-anonymous-default-export */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wonderland: {
          // Individual colors
          'rose-petal': '#da62a0',
          'pastel-pink': '#edbbd5',
          'sugar-pink': '#f5dae8',
          'mint-tea': '#a5cdc2',
          'clear-blue': '#d3ecfb',
          'baked-brown': '#bc8c7f',
          'scone-brown': '#caae85',
          'agate': '#a00f20',
          
          // Preset combinations
          'dreamy': {
            primary: '#edbbd5',    // Pastel Pink
            secondary: '#da62a0',  // Rose Petal
            tertiary: '#f5dae8',   // Sugar Pink
            accent: '#a5cdc2',     // Mint Tea
            neutral: '#caae85',    // Scone Brown
          },
          'queen': {
            primary: '#da62a0',    // Rose Petal
            secondary: '#edbbd5',  // Pastel Pink
            tertiary: '#d3ecfb',   // Clear Blue
            accent: '#bc8c7f',     // Baked Brown
            neutral: '#caae85',    // Scone Brown
            highlight: '#a00f20',  // Agate
          },
          'dual': {
            'soft': {
              primary: '#f5dae8',  // Sugar Pink
              secondary: '#da62a0' // Rose Petal
            },
            'cool': {
              primary: '#edbbd5',  // Pastel Pink
              secondary: '#d3ecfb' // Clear Blue
            },
            'contrast': {
              primary: '#f5dae8',  // Sugar Pink
              secondary: '#a00f20' // Agate
            }
          },
          'trio': {
            'vibrant': {
              primary: '#da62a0',  // Rose Petal
              secondary: '#d3ecfb', // Clear Blue
              tertiary: '#a00f20'  // Agate
            },
            'earthy': {
              primary: '#a00f20',  // Agate
              secondary: '#d3ecfb', // Clear Blue
              tertiary: '#bc8c7f'  // Baked Brown
            }
          }
        }
      }
    },
  },
  plugins: [],
}