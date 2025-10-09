/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    // This line tells Tailwind to scan all files in 'src' that end with
    // .js, .ts, .jsx, or .tsx for utility classes.
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
