// Seeds sample courses through the API. Start the server first (npm start), then run: npm run seed
// Ids are fixed, so running it again updates the same courses instead of adding duplicates.
const BASE_URL = 'http://localhost:3000';

const courses = [
  { title: 'JavaScript Fundamentals', description: 'Variables, functions, arrays, objects and the basics of programming in JavaScript.', category: 'Web Development', level: 'beginner' },
  { title: 'Modern React with Hooks', description: 'Build interactive user interfaces with components, state, effects and custom hooks.', category: 'Web Development', level: 'intermediate' },
  { title: 'Node.js and Express Backend', description: 'Create REST APIs, handle routing, middleware and connect to databases on the server.', category: 'Web Development', level: 'intermediate' },
  { title: 'HTML and CSS for Beginners', description: 'Structure web pages with HTML and style them with CSS, flexbox and grid layouts.', category: 'Web Development', level: 'beginner' },
  { title: 'TypeScript in Practice', description: 'Add static types to JavaScript projects to catch bugs early and scale codebases.', category: 'Web Development', level: 'intermediate' },
  { title: 'Python for Absolute Beginners', description: 'Learn to code from scratch with Python: loops, conditions, functions and files.', category: 'Programming', level: 'beginner' },
  { title: 'Data Structures and Algorithms', description: 'Linked lists, trees, graphs, sorting and Big-O analysis to ace coding interviews.', category: 'Programming', level: 'intermediate' },
  { title: 'Machine Learning Foundations', description: 'Regression, classification, model evaluation and training predictive models with scikit-learn.', category: 'Data Science', level: 'intermediate' },
  { title: 'Deep Learning with Neural Networks', description: 'Understand neural networks, backpropagation and build image and text models with PyTorch.', category: 'Data Science', level: 'advanced' },
  { title: 'Data Analysis with Pandas', description: 'Clean, transform and explore datasets, then visualize insights with charts.', category: 'Data Science', level: 'beginner' },
  { title: 'SQL and Relational Databases', description: 'Write queries, joins and aggregations, and design normalized database schemas.', category: 'Databases', level: 'beginner' },
  { title: 'Docker and Kubernetes Essentials', description: 'Containerize applications and deploy, scale and manage them in a cluster.', category: 'DevOps', level: 'intermediate' },
  { title: 'Cloud Computing on AWS', description: 'Servers, storage, networking and serverless functions on Amazon Web Services.', category: 'DevOps', level: 'intermediate' },
  { title: 'Cybersecurity Basics', description: 'Protect systems and networks from attacks: passwords, encryption, phishing and firewalls.', category: 'Security', level: 'beginner' },
  { title: 'Mobile Apps with Flutter', description: 'Build beautiful cross-platform iOS and Android apps from a single Dart codebase.', category: 'Mobile Development', level: 'intermediate' },
  { title: 'UI/UX Design Principles', description: 'Design user-friendly interfaces with wireframes, prototypes, typography and color theory.', category: 'Design', level: 'beginner' },
  { title: 'Digital Marketing Strategy', description: 'Grow an audience with SEO, social media, email campaigns and paid advertising.', category: 'Business', level: 'beginner' },
  { title: 'Personal Finance and Investing', description: 'Budgeting, saving, the stock market, index funds and planning for retirement.', category: 'Business', level: 'beginner' },
  { title: 'Public Speaking with Confidence', description: 'Overcome stage fright and deliver clear, engaging presentations to any audience.', category: 'Personal Development', level: 'beginner' },
  { title: 'Photography Masterclass', description: 'Camera settings, composition, lighting and editing photos like a professional.', category: 'Creative Arts', level: 'beginner' },
];

console.log(`Seeding ${courses.length} courses to ${BASE_URL}\n`);

let failed = 0;
for (const [i, course] of courses.entries()) {
  const id = `seed-${String(i + 1).padStart(2, '0')}`;
  try {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...course }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.json().catch(() => ({}))).error ?? ''}`);
    console.log(`  ✔ ${id}  ${course.title}`);
  } catch (err) {
    failed++;
    console.log(`  ✘ ${id}  ${course.title} (${err.message})`);
  }
}

console.log(`\n${courses.length - failed} seeded, ${failed} failed`);
process.exit(failed ? 1 : 0);
