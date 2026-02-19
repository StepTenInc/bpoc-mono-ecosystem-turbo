'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PageError]', error.message, error.stack);
  }, [error]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: '#9ca3af', marginBottom: '1rem', maxWidth: '500px' }}>
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
