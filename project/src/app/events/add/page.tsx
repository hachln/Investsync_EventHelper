'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../../firebase';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore'; // Added Timestamp
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function AddEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // New Form State uses raw inputs for date/time pickers
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    dateInput: '', // YYYY-MM-DD (from calendar picker)
    timeInput: '', // HH:MM (from time picker)
    location: '',
    description: '',
    category: 'tech'
  });

  // 1. Verify Admin Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            router.push('/');
          }
        } catch (error) {
          router.push('/');
        }
      } else {
        router.push('/');
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create a Javascript Date object from the inputs
      // This combines "2025-07-21" and "11:00" into a single sortable moment
      const combinedDate = new Date(`${formData.dateInput}T${formData.timeInput}`);

      // 2. Generate the "Pretty Strings" for the UI (keeping your existing design)
      // Example: "SUNDAY, JULY 21"
      const prettyDate = combinedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }).toUpperCase();

      // Example: "11:00 AM"
      const prettyTime = combinedDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });

      // 3. Determine Color
      let colorGradient = "from-pink-500 via-purple-600 to-indigo-800";
      if (formData.category === 'sport') colorGradient = "from-blue-500 via-indigo-600 to-purple-800";
      if (formData.category === 'music') colorGradient = "from-yellow-400 to-orange-500";

      // 4. Save to Firebase
      await addDoc(collection(db, "events"), {
        title: formData.title,
        subtitle: formData.subtitle,
        location: formData.location,
        description: formData.description,
        category: formData.category,
        color: colorGradient,
        attendees: [],
        
        // SAVE BOTH FORMATS:
        sortableDate: Timestamp.fromDate(combinedDate), // For computer sorting
        date: prettyDate,                               // For "SUNDAY, JULY 21" display
        time: prettyTime                                // For "11:00 AM" display
      });

      alert("Event Created Successfully!");
      router.push('/events'); 
    } catch (error) {
      console.error("Error adding event: ", error);
      alert("Error saving event.");
    }
    setLoading(false);
  };

  if (checkingAuth) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Verifying...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex items-center mb-8">
        <button onClick={() => router.back()} type="button" className="p-2 bg-gray-800 rounded-full mr-4 hover:bg-gray-700 transition">
           <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Create New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto pb-20">
        
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold ml-1">Event Title</label>
          <input name="title" required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none transition-colors" placeholder="e.g. TECH EVENT" />
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Subtitle</label>
           <input name="subtitle" required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none transition-colors" placeholder="e.g. Alumni Sharing" />
        </div>

        {/* NEW: Date and Time Pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold ml-1">Date</label>
            {/* type="date" gives the native calendar picker */}
            <input 
              type="date" 
              name="dateInput" 
              required 
              onChange={handleChange} 
              className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none transition-colors text-white [color-scheme:dark]" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold ml-1">Time</label>
            {/* type="time" gives the native clock dropdown */}
            <input 
              type="time" 
              name="timeInput" 
              required 
              onChange={handleChange} 
              className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none transition-colors text-white [color-scheme:dark]" 
            />
          </div>
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Location</label>
           <input name="location" required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none transition-colors" placeholder="e.g. Willow Oaks Lane" />
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Category</label>
           <div className="relative">
             <select name="category" onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none appearance-none transition-colors">
               <option value="tech">Tech (Pink/Purple)</option>
               <option value="sport">Sport (Blue/Indigo)</option>
               <option value="music">Music (Yellow/Orange)</option>
             </select>
           </div>
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Description</label>
           <textarea name="description" required rows={4} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none transition-colors" placeholder="Enter full event details..."></textarea>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-cyan-600 font-bold rounded-xl shadow-lg hover:bg-cyan-500 transition-colors text-white mt-6">
          {loading ? "Creating..." : "Post Event"}
        </button>

      </form>
    </div>
  );
}