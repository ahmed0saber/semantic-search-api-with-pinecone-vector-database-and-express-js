import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { Pinecone } from '@pinecone-database/pinecone';

const { PINECONE_API_KEY, PINECONE_INDEX = 'courses', PORT = 3000 } = process.env;

if (!PINECONE_API_KEY) {
  console.error('Missing PINECONE_API_KEY in .env');
  process.exit(1);
}

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

// Create the index once if it doesn't exist. Pinecone embeds the `text` field itself.
await pc.indexes.createForModel({
  name: PINECONE_INDEX,
  cloud: 'aws',
  region: 'us-east-1',
  embed: { model: 'llama-text-embed-v2', fieldMap: { text: 'text' } },
  suppressConflicts: true,
  waitUntilReady: true,
});

const index = pc.index({ name: PINECONE_INDEX, namespace: 'courses' });

const app = express();
app.use(cors());
app.use(express.json());

// Add a course: { title, description, ...anyOtherFields }
app.post('/courses', async (req, res, next) => {
  try {
    const { id = randomUUID(), title, description = '', ...rest } = req.body ?? {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const course = { _id: String(id), title, description, ...rest, text: `${title}\n${description}` };
    await index.upsertRecords({ records: [course] });

    res.status(201).json({ id: course._id });
  } catch (err) {
    next(err);
  }
});

// Search courses: GET /courses/search?q=javascript&limit=5
app.get('/courses/search', async (req, res, next) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.status(400).json({ error: 'q is required' });
    const topK = Math.min(Number(req.query.limit) || 5, 50);

    const { result } = await index.searchRecords({ query: { topK, inputs: { text: q } } });
    res.json(
      result.hits.map(({ _id, _score, fields }) => {
        const { text, ...course } = fields;
        return { id: _id, score: _score, ...course };
      }),
    );
  } catch (err) {
    next(err);
  }
});

// Delete a course: DELETE /courses/:id
app.delete('/courses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { records } = await index.fetch({ ids: [id] });
    if (!records[id]) return res.status(404).json({ error: 'course not found' });

    await index.deleteOne({ id });
    res.json({ id, deleted: true });
  } catch (err) {
    next(err);
  }
});

app.get('/', async (req, res, next) => {
  try {
    res.json({ message: 'Welcome to the Courses API. Use /courses/search?q=your+query to search courses, POST /courses to add new courses and DELETE /courses/:id to delete them. See the documentation at README.md for more details.' });
  } catch (err) {
    next(err);
  }
});

app.get('/README.md', async (req, res, next) => {
  try {
    res.sendFile('README.md', { root: '.' });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
