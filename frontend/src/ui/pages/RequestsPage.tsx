import { useEffect, useState } from 'react'
import { api, RequestDto } from '../api'

export default function RequestsPage() {
  const [items, setItems] = useState<RequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .listRequests()
      .then((r) => setItems(r.items))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <h1>Requests</h1>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && items.length === 0 && <p className="muted">No requests yet.</p>}

      <ul className="list">
        {items.map((r) => (
          <li key={r.id} className="card">
            <div className="row">
              <strong>{r.title}</strong>
              <span className={`badge badge-${r.priority.toLowerCase()}`}>{r.priority}</span>
            </div>
            {r.description && <p className="muted">{r.description}</p>}
            <div className="row">
              <span className="badge">{r.status}</span>
              <span className="muted">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
