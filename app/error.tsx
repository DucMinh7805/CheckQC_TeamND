"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="p-10 text-red-500">
      <h2>Something went wrong!</h2>
      <pre className="mt-4 p-4 bg-red-100 rounded text-sm text-black">
        {error.message}
      </pre>
      <pre className="mt-4 p-4 bg-slate-900 rounded text-xs text-white">
        {error.stack}
      </pre>
      <button onClick={() => reset()} className="mt-4 bg-black text-white px-4 py-2 rounded">
        Try again
      </button>
    </div>
  );
}
