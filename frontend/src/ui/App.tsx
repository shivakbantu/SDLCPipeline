import { Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RequestsPage from './pages/RequestsPage'
import NewRequestPage from './pages/NewRequestPage'

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <div className="brand">HBW</div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/requests">Requests</Link>
          <Link to="/requests/new">New Request</Link>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/requests/new" element={<NewRequestPage />} />
        </Routes>
      </main>
    </div>
  )
}
