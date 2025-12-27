'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { db } from '../firebase'; 
// IMPORT orderBy and query HERE:
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 

export default function EventList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Create a query that orders by 'sortableDate' ascending (Oldest -> Newest)
        // If you want Newest -> Oldest, change "asc" to "desc"
        const q = query(collection(db, "events"), orderBy("sortableDate", "asc"));

        const querySnapshot = await getDocs(q);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="min-h-screen bg-black text-white p-10">Loading events...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex items-center mb-8 mt-2">
        <Link href="/" className="p-2 bg-gray-800 rounded-full mr-4 hover:bg-gray-700">
           <ArrowLeftIcon className="h-6 w-6 text-white" />
        </Link>
        <h1 className="text-2xl font-bold">Upcoming Events</h1>
      </div>

      <div className="space-y-8">
        {events.map((event) => (
          <Link href={`/events/${event.id}`} key={event.id}>
            <div className="block relative h-64 rounded-3xl overflow-hidden shadow-2xl transform transition hover:scale-[1.02] mb-6">
              <div className={`absolute inset-0 bg-gradient-to-br ${event.color}`}></div>
              <div className="relative p-6 h-full flex flex-col justify-between">
                <div>
                   <h2 className="text-4xl font-black uppercase text-white leading-none drop-shadow-md">
                     {event.title}
                   </h2>
                   <p className="text-white/80 mt-2 font-bold">{event.subtitle}</p>
                </div>
                <div className="border-t border-white/20 pt-4 flex justify-between items-end">
                  <p className="font-bold text-lg tracking-wider">{event.date}</p>
                  <span className="bg-white/20 px-4 py-1 rounded-full text-xs font-bold backdrop-blur-sm">INFO</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {/* Helper message if no events found (or if older events without timestamps are filtered out) */}
        {events.length === 0 && (
            <p className="text-center text-gray-500">No upcoming events found.</p>
        )}
      </div>
    </div>
  );
}