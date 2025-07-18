'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  onToggleDrawer: () => void;
}

export default function Header({ onToggleDrawer }: HeaderProps) {
  return (
    <header className="w-full py-4 px-6 bg-blue-600 text-white flex justify-between items-center shadow">
      {/* Left Section: Logo and Breadcrumbs */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center" title="Home Disabled">
          <Image src="/icons/Logo.svg" alt="Logo" width={32} height={32} className="mr-2" />
          <span className="text-2xl font-bold">Nourose</span>
        </Link>
        <span className="text-2xl font-bold">/</span>
        <span className="text-xl">Gentsefeest 2025</span>
      </div>

      {/* Right Section: Drawer Toggle */}
      <div className="flex items-center space-x-4">
        {/* Hamburger Icon for Drawer */}
        <button onClick={onToggleDrawer} className="p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}
