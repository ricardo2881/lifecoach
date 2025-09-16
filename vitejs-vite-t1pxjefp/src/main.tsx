import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import Weekly from './routes/Weekly';

function Root() {
  return (
    <HashRouter>
      <div>
        <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
          <Link to="/" style={{ marginRight: 12, fontWeight: 600 }}>Weekly Focus</Link>
          <a href="https://google.com" style={{ opacity: 0.6 }}>Test Link</a>
        </nav>

        <Routes>
          {/* Home shows Weekly */}
          <Route path="/" element={<Weekly />} />
          {/* Keep a direct weekly route too */}
          <Route path="/weekly" element={<Weekly />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
