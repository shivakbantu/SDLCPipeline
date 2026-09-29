import { useEffect, useState } from 'react'
import { api } from '../api'

export default function HomePage() {
  const [status, setStatus] = useState<string>('Checking…')

  useEffect(() => {
    api
      .health()
      .then((r) => setStatus(r.ok ? `API OK (${r.service})` : 'API not OK'))
      .catch((e) => setStatus(`API error: ${String(e.message ?? e)}`))
  }, [])

  return (
    <section>
      <h1>HBW</h1>
      <p>Minimal UI to create and view Requests.</p>
      <p className="muted">{status}</p>
    </section>
  )
}
