"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"
import { auth, db } from "../firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"

export default function ScannerPage() {
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const html5QrRef = useRef<any>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const hasHandledScanRef = useRef(false)

    const regionId = "html5qr-reader"

    const handleAttendanceScan = async (decodedText: string) => {
        // ✅ prevent multiple alerts / executions
        if (hasHandledScanRef.current) return
        hasHandledScanRef.current = true

        try {
            if (!auth.currentUser) {
                alert("Please login first")
                return
            }

            const data = JSON.parse(decodedText)

            if (data.type !== "ATTENDANCE" || !data.eventId) {
                alert("Invalid QR code")
                return
            }

            const eventRef = doc(db, "events", data.eventId)
            const eventSnap = await getDoc(eventRef)

            if (!eventSnap.exists()) {
                alert("Event not found")
                return
            }

            const attendees = eventSnap.data().attendees || {}

            if (!attendees[auth.currentUser.uid]?.registered) {
            alert("You are not registered for this event")
            return
            }

            await updateDoc(eventRef, {
            [`attendees.${auth.currentUser.uid}.attended`]: true,
            [`attendees.${auth.currentUser.uid}.attended_timestamp`]: new Date(),
            })

            setResult("Attendance marked ✅")
            stopScanner()
            alert("Attendance marked successfully")
        } catch (err) {
            alert("Failed to process QR code")
        }
    }

    /* ============================
       CAMERA LIFECYCLE
    ============================ */
    useEffect(() => {
        startScanner()

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopScannerImmediate()
            }
        }

        const handlePageHide = () => {
            stopScannerImmediate()
        }

        window.addEventListener("pagehide", handlePageHide)
        window.addEventListener("beforeunload", handlePageHide)
        window.addEventListener("unload", handlePageHide)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            window.removeEventListener("pagehide", handlePageHide)
            window.removeEventListener("beforeunload", handlePageHide)
            window.removeEventListener("unload", handlePageHide)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            stopScannerImmediate()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startScanner = async () => {
        setError(null)
        setResult(null)
        hasHandledScanRef.current = false

        try {
            const { Html5Qrcode } = await import("html5-qrcode")

            if (html5QrRef.current) {
                await stopScanner()
            }

            const scanner = new Html5Qrcode(regionId)
            html5QrRef.current = scanner

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                async (decodedText: string) => {
                    await handleAttendanceScan(decodedText)
                },
                () => {}
            )

            // Store the media stream reference
            const video = document.querySelector(`#${regionId} video`) as HTMLVideoElement
            if (video?.srcObject instanceof MediaStream) {
                mediaStreamRef.current = video.srcObject
            }
        } catch (e: any) {
            setError(e?.message || String(e))
        }
    }

    const stopScanner = async () => {
        if (!html5QrRef.current) return

        const scanner = html5QrRef.current
        html5QrRef.current = null

        try {
            await scanner.stop()
            await scanner.clear()
        } catch {}
    }

    const stopScannerImmediate = () => {
        if (!html5QrRef.current) return
        
        const scanner = html5QrRef.current
        html5QrRef.current = null
        
        // Stop all media tracks directly
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop()
            })
            mediaStreamRef.current = null
        }

        // Then stop the scanner
        try {
            scanner.stop().catch(() => {})
            scanner.clear().catch(() => {})
        } catch {}
    }

    return (
        <div className="p-4">
            <div className="flex items-center mb-4 mt-2">
                <Link href="/" className="p-2 bg-gray-800 rounded-full mr-4 hover:bg-gray-700">
                <ArrowLeftIcon className="h-6 w-6 text-white" />
                </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-4 px-4">
                {/* Header */}
                <h1 className="text-xl font-semibold mb-4">QR Scanner</h1>

                {/* Scanner Box */}
                <div
                    id={regionId}
                    className="
                        w-full
                        max-w-sm
                        sm:max-w-md
                        bg-black
                        rounded-lg
                        overflow-hidden
                        aspect-square
                        sm:aspect-video
                    "
                />

                {result && (
                    <div className="mt-4 text-center max-w-sm break-words">
                        <strong>Result</strong>
                        <div className="mt-1">{result}</div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 text-red-600 text-center max-w-sm">
                        <strong>Error</strong>
                        <div className="mt-1">{error}</div>
                    </div>
                )}
            </div>
        </div>
    )
}

