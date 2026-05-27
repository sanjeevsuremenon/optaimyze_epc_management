module.exports = {
  darkMode:'class',
  i18n: {
    locales: ["en-US"],
    defaultLocale: "en-US",
  },
  content: [
    
    "./pages/**/*.{html,js,ts,jsx,tsx}",
    "./components/**/*.{html,js,ts,jsx,tsx}",
    './node_modules/tw-elements/dist/js/**/*.js',
  ],
  theme: {
    extend: {
      colors:{
        'light-primary':'#E5E7EB',
        'light-secondary':'#D1D5DB',
        'dark-primary':'#1F2937',
        'dark-secondary':'#111827'
      },
      fontFamily:{
        Rampart:['"Rampart One"', "Helvetica", "Arial", "sans-serif"],
        Montserrat:["Montserrat", "Helvetica", "Arial", "sans-serif"],
        Lato:["Lato", "Helvetica", "Arial", "sans-serif"],
        Ubuntu:["Ubuntu","Arial","sans-serif"],
        Freehand:["Freehand","Arial"],
        Poppins: ["Poppins", "sans-serif"],
        Roboto:["Roboto", "Arial"],
        OpenSans: ['"Open sans"', "sans-serif"],
        
    },
  },
  plugins: [require('tw-elements/plugin.cjs'), require("daisyui"),require("@tailwindcss/forms"),],
  future: {
    purgeLayersByDefault: true,
  },
}
}
