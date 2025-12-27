"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

export default function ScannerPage() {
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [scanning, setScanning] = useState(false)
    const html5QrRef = useRef<any>(null)
    const regionId = "html5qr-reader"

    useEffect(() => {
        return () => {
            stopScanner()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startScanner = async () => {
        setError(null)
        setResult(null)
        try {
            const module = await import("html5-qrcode")
            const { Html5Qrcode } = module

            if (html5QrRef.current) {
                try {
                    await html5QrRef.current.stop()
                } catch { }
                try {
                    html5QrRef.current.clear()
                } catch { }
                html5QrRef.current = null
            }

            const html5QrInstance = new Html5Qrcode(regionId)
            html5QrRef.current = html5QrInstance

            const cameras = await Html5Qrcode.getCameras()
            const cameraId = cameras && cameras.length ? cameras[0].id : null
            if (!cameraId) {
                setError("No camera found on this device")
                return
            }

            setScanning(true)
            await html5QrInstance.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText: string) => {
                    setResult(decodedText)
                    stopScanner()
                },
                (errorMessage: string) => {
                    // per-frame decode errors are expected; ignore or log if needed
                }
            )
        } catch (e: any) {
            setError(String(e?.message ?? e))
            setScanning(false)
        }
    }

    const stopScanner = async () => {
        if (html5QrRef.current) {
            try {
                await html5QrRef.current.stop()
            } catch { }
            try {
                html5QrRef.current.clear()
            } catch { }
            html5QrRef.current = null
        }
        setScanning(false)
    }

    return (
        <div className="p-4">
            <div className="flex items-center mb-4 mt-2">
                <Link href="/" className="p-2 bg-gray-800 rounded-full mr-4 hover:bg-gray-700">
                    <ArrowLeftIcon className="h-6 w-6 text-white" />
                </Link>
                <h1 className="text-xl font-semibold">QR Scanner</h1>
            </div>

            <div id={regionId} className="w-full max-w-md h-64 bg-black mb-3" />

            <div className="flex gap-2">
                {!scanning && (
                    <button onClick={startScanner} className="px-3 py-2 bg-blue-600 text-white rounded">
                        Start scan
                    </button>
                )}
            </div>

            {result && (
                <div className="mt-4">
                    <strong>Result:</strong>
                    <div className="break-words mt-1">{result}</div>
                </div>
            )}

            {error && (
                <div className="mt-4 text-red-600">
                    <strong>Error:</strong>
                    <div className="mt-1">{error}</div>
                </div>
            )}
        </div>
    )
}
