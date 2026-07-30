'use client';

import { Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = (user?.name as string) || 'Admin';

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
            {/* User avatar - cartoon face from Figma */}
            <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#FBBF24"/>
              <circle cx="15" cy="17" r="2" fill="#1F2937"/>
              <circle cx="25" cy="17" r="2" fill="#1F2937"/>
              <path d="M14 25 Q20 30 26 25" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M10 12 Q20 5 30 12" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex flex-col text-left"
          >
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
              {displayName}
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </span>
            <span className="text-xs text-gray-500">{(user?.role as string) || 'Admin'}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 w-40 py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
