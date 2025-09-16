import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App';
import Weekly from './routes/Weekly';

function Root() {
  return (
    <BrowserRouter>
      {/* ONE parent element wraps nav + routes */}
      <div>
        <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
          <Link to="/" style={{ marginRight: 12 }}>Dashboard</Link>
          <Link to="/weekly">Weekly</Link>
        </nav>

        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/weekly" element={<Weekly />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
