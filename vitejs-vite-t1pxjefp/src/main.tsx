import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom';
import App from './App';
import Weekly from './routes/Weekly';

function Shell() {
  return (
    // ONE parent element
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/" style={{ marginRight: 12 }}>Dashboard</Link>
        <Link to="/weekly">Weekly</Link>
      </nav>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <App /> },
      { path: '/weekly', element: <Weekly /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
