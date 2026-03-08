"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="text-f1-red text-6xl font-heading">DNF</div>
      <h2 className="text-xl text-f1-white">Something went wrong</h2>
      <p className="text-f1-gray text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-f1-red text-white rounded hover:bg-red-700 transition"
      >
        Try Again
      </button>
    </div>
  );
}
