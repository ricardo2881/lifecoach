import React from 'react';

export default function Weekly() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Weekly Focus</h1>
      <p style={{ opacity: 0.7 }}>
        If you can see this, the route is wired correctly.
      </p>
      <p style={{ marginTop: 12 }}>
        Next we can re-enable data (Dexie) and the timer.
      </p>
      <a href="/#/" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'underline' }}>
        Back to Home
      </a>
    </div>
  );
}
