'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from './BottomNav';
import { db, auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CameraIcon, ListBulletIcon, PlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Image from "next/image";
import logo from "./Pics/logo.png";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        // Check if the 'role' field exists and equals 'admin'
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col p-6 relative pb-24">
      
      {/* 1. Header / Logo */}
      <div className="mt-10 mb-8 flex flex-col items-center justify-center">
        <div className="w-24 h-24  rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] mb-4 overflow-hidden relative">
        <Image 
          src={logo}   
          alt="InvestSync Logo" 
          className="object-cover" 
          fill 
        />
      </div>
        <h1 className="text-3xl font-bold tracking-widest">INVESTSYNC</h1>
        
        {/* Admin Indicator Badge */}
        {isAdmin && (
          <div className="mt-2 flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/50">
             <ShieldCheckIcon className="w-4 h-4 mr-1" />
             ADMIN MODE
          </div>
        )}
      </div>

      {/* 2. Main Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-auto">
        
        {/* Event List */}
        <Link href="/events" className="group">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-36 flex flex-col items-center justify-center hover:border-cyan-500 transition-all shadow-lg">
            <ListBulletIcon className="h-10 w-10 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm text-gray-300">Event List</span>
          </div>
        </Link>

        {/* Scanner */}
        <Link href="/scanner" className="group">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-36 flex flex-col items-center justify-center hover:border-green-500 transition-all shadow-lg">
            <div className="bg-green-500 p-2 rounded-full mb-2 shadow-[0_0_15px_rgba(34,197,94,0.6)]">
               <CameraIcon className="h-6 w-6 text-black" />
            </div>
            <span className="font-bold text-sm text-gray-300">Scanner</span>
          </div>
        </Link>

        {/* ADMIN ONLY: Add Event Button */}
        {isAdmin && (
          <Link href="/events/add" className="col-span-2 group">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-4 h-24 flex items-center justify-center hover:border-yellow-500 transition-all shadow-lg">
              <PlusIcon className="h-8 w-8 text-yellow-500 mr-3 group-hover:rotate-90 transition-transform" />
              <div className="text-left">
                <span className="block font-bold text-lg text-white">Create Event</span>
                <span className="block text-xs text-gray-400">Add new activity to feed</span>
              </div>
            </div>
          </Link>
        )}

      </div>

      <BottomNav />
    </div>
  );
}