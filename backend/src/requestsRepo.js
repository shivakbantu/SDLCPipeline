import { query } from './db.js'

export async function listRequests() {
  const { rows } = await query(
    `select id, title, description, priority, status, created_at as "createdAt"
     from requests
     order by created_at desc
     limit 200`
  )
  return rows
}

export async function createRequest({ title, description, priority }) {
  const { rows } = await query(
    `insert into requests (title, description, priority, status)
     values ($1, $2, $3, 'NEW')
     returning id, title, description, priority, status, created_at as "createdAt"`,
    [title, description ?? null, priority]
  )
  return rows[0]
}
