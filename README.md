# Semantic Search API

A simple Express.js API to add courses to a [Pinecone](https://www.pinecone.io/) vector database and search them by meaning, not just keywords.

Pinecone generates the embeddings itself (integrated inference with `llama-text-embed-v2`), so the only key you need is a Pinecone API key.

## Requirements

- Node.js 20+
- A Pinecone account and API key ([get one here](https://app.pinecone.io/))

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable           | Required | Default   | Description                  |
| ------------------ | -------- | --------- | ---------------------------- |
| `PINECONE_API_KEY` | Yes      | —         | Your Pinecone API key        |
| `PINECONE_INDEX`   | No       | `courses` | Name of the Pinecone index   |
| `PORT`             | No       | `3000`    | Port the server listens on   |

## Run

```bash
npm start      # start the server
npm run dev    # start with auto-restart on file changes
```

On first start, the index is created automatically (AWS `us-east-1`), which can take a short while.

## API

CORS is open, so requests are accepted from any domain.

### Add a course

`POST /courses`

```json
{
  "title": "Intro to JavaScript",
  "description": "Learn variables, functions and the DOM",
  "level": "beginner"
}
```

- `title` — required
- `description` — optional
- `id` — optional; generated if omitted. Sending an existing `id` updates that course.
- Any extra fields (e.g. `level`, `price`) are stored and returned in search results.

Response `201`:

```json
{ "id": "3f1c2a9e-..." }
```

### Search courses

`GET /courses/search?q=learn web programming&limit=5`

- `q` — required, the search text
- `limit` — optional, number of results (default `5`, max `50`)

Response `200`:

```json
[
  {
    "id": "3f1c2a9e-...",
    "score": 0.42,
    "title": "Intro to JavaScript",
    "description": "Learn variables, functions and the DOM",
    "level": "beginner"
  }
]
```

Search uses the course `title` and `description`. Newly added courses can take a few seconds to appear in results.

### Delete a course

`DELETE /courses/:id`

Response `200`:

```json
{ "id": "3f1c2a9e-...", "deleted": true }
```

Returns `404` if no course has that id.

### Errors

Errors return a JSON body: `{ "error": "message" }` with status `400` (bad input), `404` (not found) or `500` (server/Pinecone error).

## Seeding sample data

With the server running, add 20 sample courses (programming, data science, design, business and more):

```bash
npm run seed
```

Seeded courses have fixed ids (`seed-01` to `seed-20`), so running it again updates them instead of creating duplicates.

It sends requests to `http://localhost:3000`. To seed a different server, change `BASE_URL` at the top of `seed.js`.

## Testing

Tests are written in plain JavaScript (no framework) and call the running API.

```bash
npm start      # in one terminal
npm test       # in another
```

Tests run against `http://localhost:3000`. To test a different server, change `BASE_URL` at the top of `test.js`:

```js
const BASE_URL = 'https://my-api.example.com';
```

Tests add real courses to your Pinecone index, then delete them at the end of the run.

## Project structure

```
index.js       # the API
test.js        # API tests (plain JS)
seed.js        # adds 20 sample courses
.env.example   # environment variables template
```
