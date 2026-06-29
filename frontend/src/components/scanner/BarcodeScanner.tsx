'use client'
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'initializing' | 'scanning' | 'error'>('initializing')
  const [errorMessage, setErrorMessage] = useState('')
  const scannedRef = useRef(false)
  const isRunningRef = useRef(false)

  // Safe stop: only stop if scanner is actually running
  const safeStop = async (scanner: Html5Qrcode) => {
    if (!isRunningRef.current) return
    isRunningRef.current = false
    try {
      await scanner.stop()
    } catch {
      // Ignore errors from stopping
    }
  }

  useEffect(() => {
    const elementId = 'barcode-scanner-element-' + Math.random().toString(36).substring(2, 9)
    const el = containerRef.current
    if (!el) return

    // Create a dedicated div for the scanner
    const scannerDiv = document.createElement('div')
    scannerDiv.id = elementId
    scannerDiv.style.width = '100%'
    scannerDiv.style.height = '100%'
    el.appendChild(scannerDiv)

    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    const config = {
      fps: 15,
      qrbox: { width: 280, height: 180 },
      formatsToSupport: [
        0,   // QR_CODE
        1,   // CODABAR
        2,   // CODE_39
        4,   // CODE_128
        8,   // DATA_MATRIX
        16,  // EAN_8
        32,  // EAN_13
        64,  // ITF
        128, // MAXICODE
        256, // PDF_417
        512, // RSS_14
        1024, // RSS_EXPANDED
        2048, // UPC_A
        4096, // UPC_E
      ] as number[],
    }

    scanner.start(
      { facingMode: 'environment' },
      config,
      async (decodedText) => {
        // Prevent multiple scans
        if (scannedRef.current) return
        scannedRef.current = true

        // Stop scanner before callback
        await safeStop(scanner)
        
        // Callback with the decoded barcode value
        onScan(decodedText)
      },
      () => {
        // Ignore scan errors — they happen every frame
      }
    ).then(() => {
      isRunningRef.current = true
      setStatus('scanning')
    }).catch((err) => {
      console.error('Barcode scanner error:', err)
      setStatus('error')
      setErrorMessage(typeof err === 'string' ? err : err?.message || 'Không thể khởi tạo camera')
    })

    return () => {
      safeStop(scanner).then(() => {
        try { scanner.clear() } catch {}
      })
      scannerRef.current = null
      if (scannerDiv.parentNode === el) {
        el.removeChild(scannerDiv)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    scannedRef.current = false
    setStatus('initializing')
    setErrorMessage('')

    const scanner = scannerRef.current
    if (!scanner) return

    safeStop(scanner).then(() => {
      try { scanner.clear() } catch {}

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        formatsToSupport: [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096] as number[],
      }

      scanner.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          if (scannedRef.current) return
          scannedRef.current = true
          await safeStop(scanner)
          onScan(decodedText)
        },
        () => {}
      ).then(() => {
        isRunningRef.current = true
        setStatus('scanning')
      }).catch((err) => {
        setStatus('error')
        setErrorMessage(typeof err === 'string' ? err : err?.message || 'Không thể khởi tạo camera')
      })
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Quét mã vạch</h3>
              <p className="text-xs text-gray-400">Đưa mã vạch vào khung hình</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black">
          <div
            ref={containerRef}
            className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden"
          >
            {status === 'initializing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary-300" />
                <p className="text-sm text-gray-300">Đang khởi tạo camera...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 px-6 text-center gap-4">
                <CameraOff className="w-10 h-10 text-red-400" />
                <div>
                  <p className="text-white font-bold">Không thể truy cập camera</p>
                  <p className="text-sm text-gray-400 mt-1">{errorMessage}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 text-white rounded-xl text-sm font-bold hover:bg-gray-600 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scan overlay */}
          {status === 'scanning' && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[180px] border-2 border-primary/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
              </div>
              <div className="absolute top-[calc(50%+90px)] left-1/2 -translate-x-1/2 mt-3 text-center pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white font-medium">Đang quét...</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Hỗ trợ: QR Code, Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E
          </p>
        </div>
      </div>
    </div>
  )
}
