// Plain JS API tests. Start the server first (npm start), then run: npm test
const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✘ ${name}\n      ${err.message}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(method, path, body) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, headers: res.headers, data: await res.json().catch(() => null) };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Every course a test creates is tracked here and deleted at the end
const createdIds = [];

// Unique id so repeated runs don't collide
const courseId = `test-${Date.now()}`;
const course = {
  id: courseId,
  title: 'Underwater Basket Weaving Masterclass',
  description: 'Learn to weave baskets while scuba diving in coral reefs',
  level: 'advanced',
};

console.log(`Testing ${BASE_URL}\n`);

await test('POST /courses adds a course', async () => {
  const { status, data } = await request('POST', '/courses', course);
  expect(status === 201, `expected 201, got ${status}`);
  createdIds.push(data.id);
  expect(data.id === courseId, `expected id "${courseId}", got "${data.id}"`);
});

await test('POST /courses generates an id when none is given', async () => {
  const { status, data } = await request('POST', '/courses', { title: 'Course without id' });
  expect(status === 201, `expected 201, got ${status}`);
  createdIds.push(data.id);
  expect(typeof data.id === 'string' && data.id.length > 0, 'expected a generated id');
});

await test('POST /courses rejects a course without title', async () => {
  const { status, data } = await request('POST', '/courses', { description: 'No title' });
  expect(status === 400, `expected 400, got ${status}`);
  expect(data.error, 'expected an error message');
});

await test('GET /courses/search rejects a missing query', async () => {
  const { status } = await request('GET', '/courses/search');
  expect(status === 400, `expected 400, got ${status}`);
});

await test('GET /courses/search finds the added course by meaning', async () => {
  // Pinecone indexes new records within a few seconds, so retry for a while
  let hit;
  for (let attempt = 0; attempt < 15 && !hit; attempt++) {
    if (attempt > 0) await sleep(2000);
    const { status, data } = await request('GET', '/courses/search?q=diving%20and%20crafts&limit=10');
    expect(status === 200, `expected 200, got ${status}`);
    expect(Array.isArray(data), 'expected an array of results');
    hit = data.find((c) => c.id === courseId);
  }
  expect(hit, 'added course was not found in search results');
  expect(hit.title === course.title, 'title does not match');
  expect(hit.level === course.level, 'extra field "level" was not returned');
  expect(typeof hit.score === 'number', 'expected a numeric score');
  expect(!('text' in hit), 'internal "text" field should not be returned');
});

await test('GET /courses/search respects limit', async () => {
  const { data } = await request('GET', '/courses/search?q=course&limit=1');
  expect(data.length <= 1, `expected at most 1 result, got ${data.length}`);
});

await test('CORS allows any origin', async () => {
  const res = await fetch(`${BASE_URL}/courses/search?q=test`, { headers: { Origin: 'https://example.com' } });
  const origin = res.headers.get('access-control-allow-origin');
  expect(origin === '*', `expected "*", got "${origin}"`);
});

await test('DELETE /courses/:id returns 404 for an unknown course', async () => {
  const { status } = await request('DELETE', `/courses/does-not-exist-${Date.now()}`);
  expect(status === 404, `expected 404, got ${status}`);
});

// Cleanup: delete every course the tests added (this also tests DELETE)
await test('DELETE /courses/:id deletes the added courses', async () => {
  for (const id of createdIds) {
    const { status, data } = await request('DELETE', `/courses/${encodeURIComponent(id)}`);
    expect(status === 200, `deleting "${id}": expected 200, got ${status}`);
    expect(data.deleted === true, `deleting "${id}": expected deleted: true`);
  }
});

await test('deleted course is gone', async () => {
  // Deletes take a moment to apply, so retry for a while
  let status;
  for (let attempt = 0; attempt < 10 && status !== 404; attempt++) {
    if (attempt > 0) await sleep(1000);
    ({ status } = await request('DELETE', `/courses/${courseId}`));
  }
  expect(status === 404, `expected 404, got ${status}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
