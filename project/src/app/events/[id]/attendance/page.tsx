"use client"

import { useParams, useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"
import Link from "next/link"

export default function AttendanceQRPage() {
  const { id } = useParams()
  const router = useRouter()

  const qrValue = JSON.stringify({
    type: "ATTENDANCE",
    eventId: id,
  })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <Link
        href={`/events/${id}`}
        className="absolute top-4 left-4 p-2 bg-gray-800 rounded-full"
      >
        <ArrowLeftIcon className="h-6 w-6" />
      </Link>

      <h1 className="text-2xl font-bold mb-6 text-center">
        Attendance QR Code
      </h1>

      <div className="bg-white p-6 rounded-xl">
        <QRCode value={qrValue} size={256} />
      </div>

      <p className="mt-6 text-gray-400 text-sm text-center">
        Participants scan this QR to mark attendance
      </p>
    </div>
  )
}
