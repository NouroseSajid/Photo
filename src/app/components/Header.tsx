'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  onToggleDrawer: () => void;
}

export default function Header({ onToggleDrawer }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="w-full py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-xl sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex justify-between items-center w-full">
        {/* Left Section: Logo and Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="group flex items-center hover:scale-105 transition-transform duration-200" title="Home">
            <div className="relative p-2 rounded-lg bg-white group-hover:bg-gray-100 transition-all duration-200">
              <Image src="/icons/Logo.svg" alt="Logo" width={32} height={32} />
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Nourose
            </span>
          </Link>
          
          <div className="hidden sm:flex items-center space-x-2 text-blue-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className="hidden sm:flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-white/10 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Gentsefeest 2025</span>
          </div>
        </div>

        {/* Right Section: User info and Drawer Toggle */}
        <div className="flex items-center space-x-4">
          {/* User greeting */}
          {session && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                Welcome, {session.user?.name?.split(' ')[0] || 'Admin'}
              </span>
            </div>
          )}

          {/* Hamburger Icon for Drawer */}
          <button 
            onClick={onToggleDrawer} 
            className="group p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 transform hover:scale-105"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Subtle bottom border for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </header>
  );
}