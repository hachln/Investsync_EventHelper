'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../BottomNav';
import { auth, db, googleProvider } from '../firebase'; // Import db here
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'; // Import Firestore query tools
import Link from 'next/link'; // Import Link to make cards clickable

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]); // State for the list
  const [realName, setRealName] = useState('');
  const [realNameInput, setRealNameInput] = useState('');
  const [savingRealName, setSavingRealName] = useState(false);
  const [debugMsg, setDebugMsg] = useState<string[]>([]); // Debug messages visible on screen

  // 1. Listen for Auth State Changes
  useEffect(() => {
    // Check for redirect result first (for mobile login)
    const handleRedirect = async () => {
      try {
        setDebugMsg(prev => [...prev, "Checking for redirect result..."]);
        const result = await getRedirectResult(auth);
        setDebugMsg(prev => [...prev, `Redirect result: ${result ? 'Found user' : 'No user'}`]);
        if (result?.user) {
          // User successfully signed in via redirect
          setDebugMsg(prev => [...prev, `Signed in: ${result.user.email}`]);
        } else {
          setDebugMsg(prev => [...prev, "No redirect result found"]);
        }
      } catch (error: any) {
        setDebugMsg(prev => [...prev, `Error: ${error.code} - ${error.message}`]);
        if (error.code !== 'auth/popup-closed-by-user') {
          alert("Sign-in error: " + error.message);
        }
      }
    };

    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setDebugMsg(prev => [...prev, `Auth state: ${currentUser?.email || 'Not logged in'}`]);
      setUser(currentUser);
      if (currentUser) {
        // Fetch real name from database
        fetchRealName(currentUser.uid);
        // If logged in, fetch their events immediately
        fetchRegisteredEvents(currentUser.uid);
      } else {
        setRegisteredEvents([]); // Clear events if logged out
        setRealName('');
        setRealNameInput('');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Events from Firestore
  // ... inside app/account/page.tsx

  const fetchRealName = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists() && userDoc.data().realName) {
        setRealName(userDoc.data().realName);
        setRealNameInput(userDoc.data().realName);
      }
    } catch (error) {
      console.error("Error fetching real name:", error);
    }
  };

  const handleSaveRealName = async () => {
    if (!user || !realNameInput.trim()) {
      alert("Please enter a valid name");
      return;
    }

    setSavingRealName(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { realName: realNameInput.trim() },
        { merge: true }
      );
      setRealName(realNameInput.trim());
      alert("Real name saved successfully!");
    } catch (error) {
      alert("Error saving real name: " + error);
    }
    setSavingRealName(false);
  };

  const fetchRegisteredEvents = async (userId: string) => {
    try {
      const q = query(collection(db, "events"));
      const querySnapshot = await getDocs(q);

      let eventsList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // ✅ FILTER BY NEW STRUCTURE
        .filter((event: any) => {
          return event.attendees?.[userId]?.registered === true;
        });

      // ✅ SORT (UNCHANGED)
      eventsList.sort((a: any, b: any) => {
        const dateA = a.sortableDate?.seconds ?? 0;
        const dateB = b.sortableDate?.seconds ?? 0;
        return dateA - dateB;
      });

      setRegisteredEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    try {
      setDebugMsg(prev => [...prev, "Starting login..."]);
      // Detect if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setDebugMsg(prev => [...prev, `Device: ${isMobile ? 'Mobile' : 'Desktop'}`]);
      
      if (isMobile) {
        setDebugMsg(prev => [...prev, "Using redirect method..."]);
        // Use redirect for mobile (doesn't throw errors, just redirects)
        await signInWithRedirect(auth, googleProvider);
        // Note: execution won't continue here because page redirects
      } else {
        setDebugMsg(prev => [...prev, "Using popup method..."]);
        // Use popup for desktop
        await signInWithPopup(auth, googleProvider);
        setDebugMsg(prev => [...prev, "Popup login successful"]);
      }
    } catch (error: any) {
      const errorMsg = `Login error: ${error.code} - ${error.message}`;
      setDebugMsg(prev => [...prev, errorMsg]);
      // Only show error alert if it's not a user-cancelled action
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        alert("Login failed: " + (error.message || "Please try again."));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      
      {/* Debug Panel - Remove after testing */}
      {debugMsg.length > 0 && (
        <div className="bg-yellow-900 text-yellow-200 p-4 text-xs overflow-auto max-h-40">
          <strong>Debug Log:</strong>
          {debugMsg.map((msg, i) => (
            <div key={i}>{i + 1}. {msg}</div>
          ))}
          <button onClick={() => setDebugMsg([])} className="mt-2 px-2 py-1 bg-yellow-700 rounded text-xs">
            Clear Log
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gray-900 p-8 rounded-b-3xl shadow-2xl flex flex-col items-center">
        <div className="w-28 h-28 bg-gray-800 rounded-full mb-4 border-4 border-gray-700 overflow-hidden flex items-center justify-center">
           {user?.photoURL ? (
             <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
           ) : (
             <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
           )}
        </div>

        <h2 className="text-2xl font-bold">
          {user ? user.displayName : "Not Logged In"}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          {user ? user.email : "Guest User"}
        </p>

        {user ? (
          <button onClick={handleLogout} className="px-6 py-2 border border-red-500 text-red-400 rounded-full text-sm hover:bg-red-500/10 transition">
            Unbind Account
          </button>
        ) : (
          <button onClick={handleLogin} className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-blue-500 transition">
            Login with Google
          </button>
        )}
      </div>

      {/* Real Name Section - Only visible when logged in */}
      {user && (
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <span className="w-2 h-8 bg-purple-500 mr-3 rounded-full"></span>
            Your Real Name
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={realNameInput}
              onChange={(e) => setRealNameInput(e.target.value)}
              placeholder="Enter your real name"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={handleSaveRealName}
              disabled={savingRealName}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-500 transition disabled:bg-gray-600"
            >
              {savingRealName ? "Saving..." : "Save"}
            </button>
          </div>
          {realName && (
            <p className="mt-2 text-sm text-gray-400">Currently saved: <span className="text-white font-semibold">{realName}</span></p>
          )}
        </div>
      )}

      {/* Registered Events Section */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <span className="w-2 h-8 bg-cyan-500 mr-3 rounded-full"></span>
          Events Registered
        </h3>

        {!user ? (
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-center text-gray-500 text-sm">
            Please login to view your registered events.
          </div>
        ) : registeredEvents.length === 0 ? (
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-center text-gray-500 text-sm">
            No upcoming events found. Go register for one!
          </div>
        ) : (
          <div className="space-y-4">
            {/* Map through the fetched events */}
            {registeredEvents.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <div className="bg-gray-900 p-4 rounded-xl flex items-center border border-gray-800 shadow-md hover:border-cyan-500 transition-colors cursor-pointer">
                  
                  {/* Date Box */}
                  <div className="bg-gray-800 p-3 rounded-lg text-center mr-4 min-w-[60px]">
                      {/* Extract Month/Day roughly from string, or simplify display */}
                      <span className="block text-xs text-gray-400">DATE</span>
                      <span className="block text-sm font-bold text-white truncate max-w-[50px]">
                        {event.date ? event.date.split(',')[0] : 'TBA'}
                      </span>
                  </div>
                  
                  {/* Event Info */}
                  <div className="flex-1">
                      <h4 className="font-bold text-lg text-white">{event.title}</h4>
                      <p className="text-sm text-gray-400">{event.subtitle}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                  </div>
                  
                  {/* Category Badge (Optional) */}
                  <div className={`w-3 h-12 rounded-r ml-2 bg-gradient-to-b ${event.color || 'from-gray-700 to-gray-800'}`}></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}