'use client'; // <--- This line is required for components that use hooks

import Link from 'next/link';
import { HomeIcon, UserIcon } from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation'; // <--- Changed from next/router

export default function BottomNav() {
  const pathname = usePathname(); // <--- This replaces router.pathname

  // Helper to check if the link is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 h-20 flex items-center justify-around z-50 rounded-t-3xl">
      {/* Home Button */}
      <Link href="/" className={`flex flex-col items-center ${isActive('/') ? 'text-cyan-400' : 'text-gray-500'}`}>
        <div className={`p-2 rounded-full ${isActive('/') ? 'bg-gray-800' : ''}`}>
           <HomeIcon className="h-8 w-8" />
        </div>
        <span className="text-xs font-bold mt-1">Home</span>
      </Link>

      {/* Account Button */}
      <Link href="/account" className={`flex flex-col items-center ${isActive('/account') ? 'text-cyan-400' : 'text-gray-500'}`}>
         <div className={`p-2 rounded-full ${isActive('/account') ? 'bg-gray-800' : ''}`}>
           <UserIcon className="h-8 w-8" />
         </div>
         <span className="text-xs font-bold mt-1">Account</span>
      </Link>
    </nav>
  );
}