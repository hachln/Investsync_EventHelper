'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { db, auth } from '../../firebase'; 
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowLeftIcon, MapPinIcon, ClockIcon, CalendarIcon, CheckCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter(); // For redirecting after delete
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Admin State

  const attendeeData = user ? event?.attendees?.[user.uid] : null;
  const isAttended = !!attendeeData?.attended;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Check Admin Role
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }

      if (params.id) {
        await fetchEventData(params.id as string, currentUser);
      }
    });

    return () => unsubscribe();
  }, [params.id]);

  const fetchEventData = async (eventId: string, currentUser: User | null) => {
    try {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const eventData = docSnap.data();
        setEvent(eventData);
        if (
          currentUser &&
          eventData.attendees &&
          eventData.attendees[currentUser.uid]?.registered
        ) {
          setIsRegistered(true);
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!user) {
      alert("Please login first to register!");
      return;
    }
    setRegistering(true);
    try {
      const docRef = doc(db, "events", params.id as string);
      await updateDoc(docRef, {
        [`attendees.${user.uid}`]: {
          registered: true,
          attended: false,
        },
      });
      setIsRegistered(true);
      alert("Success! You are registered.");
    } catch (error) {
      alert("Error registering: " + error);
    }
    setRegistering(false);
  };

  // ADMIN ACTION: DELETE
  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    
    try {
        await deleteDoc(doc(db, "events", params.id as string));
        alert("Event deleted.");
        router.push('/events');
    } catch (error) {
        alert("Error deleting event: " + error);
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-10">Loading...</div>;
  if (!event) return <div className="min-h-screen bg-black text-white p-10">Event not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      
      {/* Header */}
      <div className={`h-[45vh] bg-gradient-to-b ${event.color} to-gray-950 relative p-6 flex flex-col justify-between`}>
        <div className="flex justify-between items-start">
            <Link href="/events" className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
                <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            
            {/* ADMIN CONTROLS */}
            {isAdmin && (
                <div className="flex space-x-2">
                    <Link href={`/events/edit/${params.id}`} className="p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500">
                        <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button onClick={handleDelete} className="p-2 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-500">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                    {/*Attendance QR code*/}
                    <Link
                      href={`/events/${params.id}/attendance`}
                      className="p-2 bg-green-600 rounded-full text-white shadow-lg hover:bg-green-500"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </Link>
                </div>
            )}
        </div>

        <div className="mb-4">
           <h1 className="text-5xl font-black uppercase tracking-tighter drop-shadow-xl whitespace-pre-line">
             {event.title}
           </h1>
           <span className="inline-block mt-2 px-3 py-1 bg-white text-black font-bold text-xs rounded-md">
             {event.subtitle}
           </span>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        
        {/* Info Cards - Added DATE card */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 col-span-2 flex items-center">
             <CalendarIcon className="h-8 w-8 text-pink-500 mr-4" />
             <div>
                <p className="text-xs text-gray-400 uppercase">Date</p>
                <p className="font-bold text-xl">{event.date}</p>
             </div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
             <ClockIcon className="h-6 w-6 text-pink-500 mb-2" />
             <p className="text-xs text-gray-400">Time</p>
             <p className="font-bold text-lg">{event.time}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
             <MapPinIcon className="h-6 w-6 text-pink-500 mb-2" />
             <p className="text-xs text-gray-400">Location</p>
             <p className="font-bold text-sm line-clamp-2">{event.location}</p>
          </div>
        </div>

        <div className="mb-24">
           <h3 className="text-lg font-bold mb-2">Description</h3>
           <p className="text-gray-400 leading-relaxed text-sm">
             {event.description}
           </p>
        </div>

        {/* Register Button (Hidden for Admins so they don't accidentally register) */}
        {!isAdmin && (
          <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-gray-950 to-transparent">
            {isAttended ? (
              /* ATTENDED STATE */
              <button
                disabled
                className="w-full py-4 bg-blue-600 text-white font-bold text-xl rounded-full shadow-lg flex items-center justify-center gap-2 opacity-90 cursor-default"
              >
                <CheckCircleIcon className="h-6 w-6" />
                Attended
              </button>

            ) : isRegistered ? (
              /* REGISTERED BUT NOT ATTENDED */
              <button
                disabled
                className="w-full py-4 bg-green-600 text-white font-bold text-xl rounded-full shadow-lg flex items-center justify-center gap-2 opacity-90 cursor-default"
              >
                <CheckCircleIcon className="h-6 w-6" />
                Registered
              </button>

            ) : (
              /* NOT REGISTERED */
              <button
                onClick={handleRegister}
                disabled={registering}
                className={`w-full py-4 ${
                  registering ? 'bg-gray-500' : 'bg-white'
                } text-black font-bold text-xl rounded-full shadow-lg hover:scale-[1.02] transition-transform`}
              >
                {registering ? "Registering..." : "Register Now"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}