import pg from 'pg'

const { Pool } = pg

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var ${name}`)
  return v
}

export const pool = new Pool({
  host: process.env.PGHOST ?? 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER ?? required('PGUSER'),
  password: process.env.PGPASSWORD ?? required('PGPASSWORD'),
  database: process.env.PGDATABASE ?? required('PGDATABASE'),
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined
})

export async function query(text, params) {
  return pool.query(text, params)
}
