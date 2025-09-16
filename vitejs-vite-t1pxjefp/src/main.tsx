import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom';
import Weekly from './routes/Weekly';

function Shell() {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/weekly" style={{ marginRight: 12, fontWeight: 600 }}>Weekly Focus</Link>
        <Link to="/" style={{ opacity: 0.7 }}>Home</Link>
      </nav>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      // Show Weekly at the home page too (so you can't miss it)
      { path: '/', element: <Weekly /> },
      { path: '/weekly', element: <Weekly /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
