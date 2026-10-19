import { Link, NavLink, Route, Routes } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import HostPage from './pages/HostPage';

export default function App() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          AI Coaching Office Hours
        </Link>
        <nav aria-label="Main">
          <NavLink to="/" end>Book a session</NavLink>
          <NavLink to="/host">Coach view</NavLink>
        </nav>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/host" element={<HostPage />} />
          <Route path="*" element={<p className="empty">This page does not exist. <Link to="/">Go to the booking page</Link>.</p>} />
        </Routes>
      </main>
    </>
  );
}
