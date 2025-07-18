import { off } from "process";

// Custom color constants
export const colors = {
  primarydark_custom: '#2A363B',
  danger_custom: '#E84A5F', 
  green_custom: '#99B898',
  off_white_custom: '#F1EFEB',

};
/*
export const colors = {
  primarydark_custom: '#2A363B',
  danger_custom: '#E84A45F', 
  green_custom: '#99B898',

};
*/

const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
