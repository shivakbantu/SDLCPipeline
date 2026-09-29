import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { listRequests, createRequest } from './requestsRepo.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hbw-backend' })
})

app.get('/api/requests', async (_req, res) => {
  const items = await listRequests()
  res.json({ items })
})

const CreateRequestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM')
})

app.post('/api/requests', async (req, res) => {
  const parsed = CreateRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parsed.error.flatten()
    })
  }

  const created = await createRequest(parsed.data)
  res.status(201).json(created)
})

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
})

const port = process.env.PORT ? Number(process.env.PORT) : 3000
app.listen(port, () => {
  console.log(`HBW backend listening on :${port}`)
})
