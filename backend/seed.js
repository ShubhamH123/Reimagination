/**
 * Demo data for the real backend:   npm run seed
 * Creates a mentor, two programs, mentees, resources and some progress so every
 * dashboard (and the AI profile page) has something to show.
 *
 * Demo logins after seeding
 *   Mentor : mentor@techneeds.dev / mentor123
 *   Mentee : TN2026001 / demo123   (…TN2026008)
 *   Admin  : ADMIN_EMAIL / ADMIN_PASSWORD from your .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Mentor = require('./models/Mentor');
const Mentee = require('./models/Mentee');
const Program = require('./models/Program');
const Resource = require('./models/Resource');
const Quiz = require('./models/Quiz');

const DAY = 86400000;
const daysFromNow = (d) => new Date(Date.now() + d * DAY);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing previous demo data…');
  await Promise.all([Mentor.deleteMany({ email: 'mentor@techneeds.dev' }), Mentee.deleteMany({ enrollmentNumber: /^TN2026/ })]);
  await Program.deleteMany({ name: { $in: ['Web Development Cohort', 'DSA Sprint'] } });

  const mentor = await Mentor.create({
    name: 'Aanya Sharma',
    email: 'mentor@techneeds.dev',
    password: await bcrypt.hash('mentor123', 10)
  });

  const web = await Program.create({ name: 'Web Development Cohort', mentors: [mentor._id] });
  const dsa = await Program.create({ name: 'DSA Sprint', mentors: [mentor._id] });
  mentor.programs = [web._id, dsa._id];
  await mentor.save();

  const mk = (program, data) => Resource.create({ program: program._id, addedBy: mentor._id, ...data });
  const v1 = await mk(web, { title: 'HTML & CSS Crash Course', type: 'video', url: 'https://www.youtube.com/watch?v=G3e-cpL7ofc', maxScore: 100, deadline: daysFromNow(-3) });
  const v2 = await mk(web, { title: 'JavaScript Essentials', type: 'video', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', maxScore: 100, deadline: daysFromNow(4) });
  const v3 = await mk(web, { title: 'React in 60 Minutes', type: 'video', url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', maxScore: 100, deadline: daysFromNow(9) });
  const q1 = await mk(web, { title: 'Web Fundamentals Quiz', type: 'quiz', maxScore: 5, deadline: daysFromNow(5), isLocked: false });
  const p1 = await mk(web, { title: 'Build a Portfolio Site', type: 'project', maxScore: 300, deadline: daysFromNow(12) });
  const v4 = await mk(dsa, { title: 'Arrays & Hashing', type: 'video', url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA', maxScore: 100, deadline: daysFromNow(6) });

  const quiz = await Quiz.create({
    resource: q1._id,
    startTime: daysFromNow(-1),
    endTime: daysFromNow(5),
    questions: [
      { questionText: 'Which HTML tag is used for the largest heading?', options: ['<h6>', '<h1>', '<head>', '<header>'], correctOptionIndex: 1, marks: 1 },
      { questionText: 'Which CSS property controls text colour?', options: ['font-style', 'text-color', 'color', 'foreground'], correctOptionIndex: 2, marks: 1 },
      { questionText: 'What does `===` check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Reference only'], correctOptionIndex: 2, marks: 1 },
      { questionText: 'Which hook manages state in React?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correctOptionIndex: 1, marks: 1 },
      { questionText: 'What does the "C" in CSS stand for?', options: ['Creative', 'Cascading', 'Computed', 'Coded'], correctOptionIndex: 1, marks: 1 }
    ]
  });
  q1.quiz = quiz._id;
  await q1.save();
  web.resources = [v1._id, v2._id, v3._id, q1._id, p1._id];
  dsa.resources = [v4._id];
  await Promise.all([web.save(), dsa.save()]);

  const people = [
    ['Riya Verma', 'riya@example.com', 7, ['Web Dev', 'UI/UX'], [[v1, 100], [v2, 100], [q1, 5], [p1, 270, true]]],
    ['Ishita Gupta', 'ishita@example.com', 5, ['AI/ML', 'Data Science'], [[v1, 100], [v2, 100], [q1, 4]]],
    ['Meera Nair', 'meera@example.com', 4, ['Web Dev'], [[v1, 100], [q1, 3], [p1, 0, false]]],
    ['Kavya Singh', 'kavya@example.com', 3, ['DSA', 'Competitive Coding'], [[v1, 100], [v2, 98]]],
    ['Tanvi Joshi', 'tanvi@example.com', 2, ['Cloud'], [[v1, 100]]],
    ['Sana Khan', 'sana@example.com', 1, ['Cybersecurity'], [[v1, 96]]],
    ['Diya Patel', 'diya@example.com', 0, [], []],
    ['Pooja Rao', 'pooja@example.com', 0, ['App Dev'], []]
  ];

  const password = await bcrypt.hash('demo123', 10);
  for (let i = 0; i < people.length; i++) {
    const [name, email, streak, interests, done] = people[i];
    await Mentee.create({
      name,
      email,
      enrollmentNumber: `TN2026${String(i + 1).padStart(3, '0')}`,
      password,
      programs: [web._id, dsa._id],
      interests,
      streak,
      lastActiveDate: streak ? new Date() : undefined,
      createdBy: mentor._id,
      completedResources: done.map(([resource, score, verified]) => ({
        resource: resource._id,
        score,
        completedOn: daysFromNow(-Math.floor(Math.random() * 6)),
        ...(resource.type === 'project'
          ? { githubLink: 'https://github.com/demo/portfolio', deployedLink: 'https://demo-portfolio.vercel.app', description: 'A responsive personal portfolio with project showcase and dark mode.', submittedOn: daysFromNow(-1), verified: !!verified }
          : {})
      }))
    });
  }

  console.log('Seeded ✔  Mentor: mentor@techneeds.dev / mentor123  |  Mentee: TN2026001 / demo123');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
