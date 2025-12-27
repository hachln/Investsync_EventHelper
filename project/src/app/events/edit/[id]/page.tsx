'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '../../../firebase'; // Check path ../../../
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function EditEvent() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    dateInput: '', 
    timeInput: '', 
    location: '',
    description: '',
    category: 'tech'
  });

  useEffect(() => {
    // 1. Verify Admin
    const checkAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
          // 2. If Admin, Fetch Event Data
          if (params.id) fetchEventData(params.id as string);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    });
    return () => checkAuth();
  }, [params.id]);

  const fetchEventData = async (id: string) => {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Convert Sortable Timestamp back to Input Strings
        // Input type="date" needs YYYY-MM-DD
        // Input type="time" needs HH:MM
        let dateStr = '';
        let timeStr = '';
        
        if (data.sortableDate) {
            const dateObj = data.sortableDate.toDate();
            // Need to manually format to avoid timezone shifts
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;

            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            timeStr = `${hours}:${minutes}`;
        }

        setFormData({
            title: data.title || '',
            subtitle: data.subtitle || '',
            location: data.location || '',
            description: data.description || '',
            category: data.category || 'tech',
            dateInput: dateStr,
            timeInput: timeStr,
        });
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const combinedDate = new Date(`${formData.dateInput}T${formData.timeInput}`);
      
      const prettyDate = combinedDate.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric' 
      }).toUpperCase();

      const prettyTime = combinedDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit' 
      });

      let colorGradient = "from-pink-500 via-purple-600 to-indigo-800";
      if (formData.category === 'sport') colorGradient = "from-blue-500 via-indigo-600 to-purple-800";
      if (formData.category === 'music') colorGradient = "from-yellow-400 to-orange-500";

      // UPDATE existing document
      const docRef = doc(db, "events", params.id as string);
      await updateDoc(docRef, {
        title: formData.title,
        subtitle: formData.subtitle,
        location: formData.location,
        description: formData.description,
        category: formData.category,
        color: colorGradient,
        sortableDate: Timestamp.fromDate(combinedDate),
        date: prettyDate,
        time: prettyTime
      });

      alert("Event Updated Successfully!");
      router.push(`/events/${params.id}`); // Go back to details page
    } catch (error) {
      console.error("Error updating event: ", error);
      alert("Error saving event.");
    }
    setLoading(false);
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex items-center mb-8">
        <button onClick={() => router.back()} type="button" className="p-2 bg-gray-800 rounded-full mr-4 hover:bg-gray-700 transition">
           <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Edit Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto pb-20">
        
        {/* Same fields as Add Page, but inputs are pre-filled by formData state */}
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold ml-1">Event Title</label>
          <input name="title" value={formData.title} required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none" />
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Subtitle</label>
           <input name="subtitle" value={formData.subtitle} required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold ml-1">Date</label>
            <input type="date" name="dateInput" value={formData.dateInput} required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none text-white [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold ml-1">Time</label>
            <input type="time" name="timeInput" value={formData.timeInput} required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none text-white [color-scheme:dark]" />
          </div>
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Location</label>
           <input name="location" value={formData.location} required onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none" />
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Category</label>
           <div className="relative">
             <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none appearance-none">
               <option value="tech">Tech (Pink/Purple)</option>
               <option value="sport">Sport (Blue/Indigo)</option>
               <option value="music">Music (Yellow/Orange)</option>
             </select>
           </div>
        </div>

        <div>
           <label className="text-xs text-gray-400 uppercase font-bold ml-1">Description</label>
           <textarea name="description" value={formData.description} required rows={4} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg focus:border-cyan-500 outline-none"></textarea>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-cyan-600 font-bold rounded-xl shadow-lg hover:bg-cyan-500 transition-colors text-white mt-6">
          {loading ? "Updating..." : "Save Changes"}
        </button>

      </form>
    </div>
  );
}