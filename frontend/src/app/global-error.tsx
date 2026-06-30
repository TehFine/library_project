'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[GlobalError]', error)

  return (
    <html lang="vi">
      <body className="bg-amber-50">
        <div className="min-h-screen w-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
            {/* Error icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử tải lại trang.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-glow hover:brightness-105 transition-all active:scale-[0.97]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Tải lại trang
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.97]"
              >
                Thử lại
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 font-medium select-none">
                  Chi tiết lỗi
                </summary>
                <pre className="mt-2 p-3 bg-red-50 rounded-xl text-xs text-red-700 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
