'use client'

import { useEffect, useState } from 'react'

const PaymentPendingPage = () => {
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    if (seconds === 0) return

    const timer = setTimeout(() => {
      setSeconds(s => s - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [seconds])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1022] px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full border-4 border-indigo-500 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-indigo-500 animate-pulse" />
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-3">
          Payment Processing
        </h1>

        {seconds > 0 ? (
          <p className="text-white/80 text-base">
            Please wait… opening the app in{' '}
            <span className="text-indigo-400 font-bold">
              {seconds}s
            </span>
          </p>
        ) : (
          <p className="text-white/80 text-base leading-relaxed">
            You can now safely close this page and open the app.
            <br />
            Your payment is being verified.
          </p>
        )}

        <p className="mt-6 text-xs text-white/40">
          Do not refresh this page
        </p>
      </div>
    </div>
  )
}

export default PaymentPendingPage
