'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 px-6 bg-gray-800 text-white text-center text-sm mt-8">
      <p>&copy; {new Date().getFullYear()} Nourose. All rights reserved.</p>
      <p>Designed with ❤️ by Nourose</p>
      <div className="flex justify-center space-x-4 mt-2">
        <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
      </div>
    </footer>
  );
}
