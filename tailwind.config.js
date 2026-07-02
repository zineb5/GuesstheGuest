/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'surface-tint': '#d2bbff',
        'tertiary-container': '#c4aa01',
        'on-surface': '#dae2fd',
        'on-secondary-fixed-variant': '#005234',
        'outline': '#958da1',
        'on-primary-fixed-variant': '#5a00c6',
        'surface-container-highest': '#2d3449',
        'on-secondary': '#003822',
        'secondary-container': '#00ffab',
        'tertiary-fixed-dim': '#e2c62d',
        'on-tertiary-container': '#4a3f00',
        'primary-container': '#7c3aed',
        'inverse-surface': '#dae2fd',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'on-tertiary': '#393000',
        'on-primary': '#3f008e',
        'on-primary-container': '#ede0ff',
        'on-secondary-container': '#007149',
        'background': '#0b1326',
        'inverse-on-surface': '#283044',
        'outline-variant': '#4a4455',
        'on-error-container': '#ffdad6',
        'primary-fixed': '#eaddff',
        'surface-container-high': '#222a3d',
        'on-tertiary-fixed-variant': '#524600',
        'error': '#ffb4ab',
        'on-tertiary-fixed': '#211b00',
        'tertiary': '#e2c62d',
        'on-error': '#690005',
        'on-background': '#dae2fd',
        'on-secondary-fixed': '#002112',
        'secondary-fixed': '#4dffb2',
        'inverse-primary': '#732ee4',
        'surface-container-lowest': '#060e20',
        'secondary-fixed-dim': '#00e297',
        'secondary': '#f4fff5',
        'error-container': '#93000a',
        'surface': '#0b1326',
        'surface-bright': '#31394d',
        'primary-fixed-dim': '#d2bbff',
        'surface-variant': '#2d3449',
        'tertiary-fixed': '#ffe24c',
        'primary': '#d2bbff',
        'on-primary-fixed': '#25005a',
        'surface-dim': '#0b1326',
        'on-surface-variant': '#ccc3d8'
      },
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
        'jakarta': ['Plus Jakarta Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
