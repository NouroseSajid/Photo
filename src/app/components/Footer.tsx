'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-8 px-6 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white text-center text-sm mt-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <p className="text-lg font-semibold mb-2">&copy; {new Date().getFullYear()} Nourose. All rights reserved.</p>
          <p className="text-gray-300 flex items-center justify-center gap-1">
            Designed with <span className="text-red-400 animate-pulse">❤️</span> by Nourose
          </p>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <a 
              href="#" 
              className="text-gray-300 hover:text-blue-400 transition-all duration-300 transform hover:scale-105 hover:underline"
              aria-label="Privacy Policy"
            >
              Privacy Policy
            </a>
            <span className="hidden sm:inline text-gray-500">•</span>
            <a 
              href="#" 
              className="text-gray-300 hover:text-blue-400 transition-all duration-300 transform hover:scale-105 hover:underline"
              aria-label="Terms of Service"
            >
              Terms of Service
            </a>
            <span className="hidden sm:inline text-gray-500">•</span>
            <a 
              href="mailto:contact@nourose.com" 
              className="text-gray-300 hover:text-green-400 transition-all duration-300 transform hover:scale-105 hover:underline"
              aria-label="Contact Us"
            >
              Contact
            </a>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-400">
          <p>Gentsefeest 2025 Gallery • Built with Next.js</p>
        </div>
      </div>
    </footer>
  );
}