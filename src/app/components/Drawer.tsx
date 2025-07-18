'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    setIsVisible(isOpen);
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
      setTimeout(() => firstFocusableElementRef.current?.focus(), 100);
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isVisible || !drawerRef.current) return;
    const focusableElements = drawerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    drawerRef.current.addEventListener('keydown', handleTabKey);
    return () => drawerRef.current?.removeEventListener('keydown', handleTabKey);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && 
          !drawerRef.current.contains(e.target as Node) &&
          isVisible) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible]);

  return (
    <div 
      className={`fixed inset-0 z-50 ${isVisible ? 'visible' : 'invisible'}`}
      aria-hidden={!isVisible}
    >
      {/* Overlay with smooth transition */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-label="Close drawer"
      />

      {/* Drawer Content */}
      <div
        ref={drawerRef}
        className={`absolute right-0 h-full w-80 bg-white shadow-xl p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation menu"
      >
        <button 
          ref={firstFocusableElementRef}
          onClick={handleClose}
          className="absolute top-5 right-5 text-gray-600 hover:text-gray-900 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close drawer"
        >
          &times;
        </button>

        <nav className="mt-16 flex flex-col space-y-3">
          <Link 
            href="/" 
            onClick={handleClose}
            className={`text-lg px-4 py-3 rounded-lg transition-all flex items-center ${
              pathname === '/' 
                ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-100 hover:pl-5'
            }`}
          >
            Home
          </Link>
          
          <a
            href="https://cv.nourose.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className={`text-lg px-4 py-3 rounded-lg transition-all flex items-center ${
              pathname === '/cv' 
                ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-100 hover:pl-5'
            }`}
          >
            CV
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              External
            </span>
          </a>
          
          <Link 
            href="/about" 
            onClick={handleClose}
            className={`text-lg px-4 py-3 rounded-lg transition-all flex items-center ${
              pathname === '/about' 
                ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-100 hover:pl-5'
            }`}
          >
            About me
          </Link>
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-4">
          {session ? (
            <div className="flex flex-col space-y-2">
              <p className="text-gray-700">Welcome, {session?.user?.name ?? 'User'}</p>
              <button onClick={() => signOut()} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => signIn('github')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
              Admin Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}