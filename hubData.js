export const SUPPORT_WHATSAPP_NUMBER = '07049111844';
export const SUPPORT_EMAIL = 'websprouthub.team@gmail.com';
export const MONTHLY_SUBSCRIPTION_NGN = 500;
export const TRIAL_DAYS_COUNT = 7;

export const WHY_WEBSPROUT = [
  {
    title: 'Structured Daily Pacing (4-Month Track Flow)',
    detail: 'Learners focus on one clear daily step at their chosen study time instead of drowning in scattered links.'
  },
  {
    title: 'Watch, Read & Practice Immediately',
    detail: 'Digital skills combine lessons/videos and reading guides with an in-portal CodePen-style live editor.'
  },
  {
    title: 'Free LearnEase Library Always Available',
    detail: 'Students can break down tricky terms or concepts and save study notes in LearnEase without paying extra.'
  },
  {
    title: 'Human Support When You Need It',
    detail: 'Stuck on a lesson? Book a call right inside the portal or tap Sprout Chatbot connected to 07049111844.'
  }
];

export const WHO_WE_SERVE = [
  {
    group: '18+ Diploma Learners',
    desc: 'Young adults building practical digital skills or preparing through ND1–ND2 diploma-style pathways.'
  },
  {
    group: '16 & Under Foundation Learners',
    desc: 'Secondary and teen learners building early tech habits, study skills, and exam readiness step by step.'
  },
  {
    group: 'Teachers & School Communities',
    desc: 'Educators with their own individual portal to explore digital learning and support students.'
  },
  {
    group: 'Parents & Guardians Nationwide',
    desc: 'Families seeking structured online home tutoring for WAEC, NECO, and JAMB across states.'
  }
];

export const HUB_SECTIONS = [
  {
    id: '01',
    key: 'digital_skills',
    status: 'Primary Focus • 4-Month Track',
    title: 'Digital Skills Academy',
    subtitle: 'Videos/files + CodePen-style practice + certificate',
    description:
      'Focused hands-on skill tracks with video/reading lessons, live CodePen-style practice, daily check-ins, and completion certificates across 18+ Diploma and 16 & Under Foundation paths.',
    tracks: ['Web Development', 'Web3', 'AI Automation', 'Animation', 'UI & UX', 'Video Editing']
  },
  {
    id: '02',
    key: 'pre_university',
    status: 'Guide & PDFs (ND1–ND2)',
    title: 'Pre-University Academy Guide',
    subtitle: 'Departments, WAEC subject fit, cut-offs & CGPA guides',
    description:
      'A clear reading and PDF/guide hub covering departments, WAEC result alignment when choosing a course, cut-off mark preparation, course credit units, and NBTE 4.00 / CGPA calculation.',
    tracks: [
      'WAEC Grade & Course Alignment Guide',
      'Departments, Credit Units & Cut-Off Guide',
      'ND1–ND2 & CGPA Calculation Guide (No HND)'
    ]
  },
  {
    id: '03',
    key: 'home_tutoring',
    status: 'Active Nationwide',
    title: 'Nationwide Online Home Tutoring',
    subtitle: 'Online exam prep for WAEC, NECO & JAMB',
    description:
      'Book online home tutoring across states for WAEC, NECO, and JAMB preparation with clear subject and schedule details.',
    tracks: ['WAEC Prep', 'NECO Prep', 'JAMB Prep']
  },
  {
    id: '04',
    key: 'arabic_fine_arts',
    status: 'Coming Soon',
    title: 'Arabic & Fine Arts',
    subtitle: 'Upcoming hub tracks in preparation',
    description:
      'Arabic and Fine Arts are marked Coming Soon as we prepare dedicated materials for future release.',
    tracks: ['Arabic (Coming Soon)', 'Fine Arts (Coming Soon)']
  }
];

export const DIGITAL_SKILLS_COURSES = [
  'Web Development',
  'Web3',
  'AI Automation',
  'Animation',
  'UI & UX',
  'Video Editing'
];

export const PRE_UNI_GUIDES = [
  {
    code: 'PDF-GUIDE-01',
    title: 'Choosing a Course Based on Your WAEC Grades & Subjects',
    summary:
      'How to match your O’Level/WAEC credit passes and core subjects to realistic polytechnic/ND1–ND2 and university tracks before applying.',
    readingText:
      'When choosing a course, start with your WAEC grades and required subject combinations. Ensure your core subjects have strong passes and match the department entry rules so you do not waste time or application fees on mismatched tracks.'
  },
  {
    code: 'PDF-GUIDE-02',
    title: 'Understanding Departments, Credit Units & Cut-Off Marks',
    summary:
      'How departments organize courses, what credit units mean for workload, and how cut-off mark preparation works before admission.',
    readingText:
      'Every academic course carries credit units based on lecture and practical hours. Understanding cut-off marks early helps you set a realistic target score and build a daily study timetable ahead of exams.'
  },
  {
    code: 'PDF-GUIDE-03',
    title: 'How GPA & CGPA Are Calculated (Including NBTE 4.00 Polytechnic Scale)',
    summary:
      'Step-by-step guide to weighted grade points, semester GPA, cumulative CGPA, and how ND1–ND2 / diploma grading differs from a 5.00 scale.',
    readingText:
      'To calculate GPA for a semester, multiply each course grade point by its credit units, sum the quality points, and divide by total credit units. For CGPA, divide cumulative quality points across semesters by cumulative credit units. On the NBTE polytechnic 4.00 scale, Distinction is 3.50 to 4.00, Upper Credit is 3.00 to 3.49, Lower Credit is 2.00 to 2.99, and Pass is 1.00 to 1.99.'
  },
  {
    code: 'PDF-GUIDE-04',
    title: 'Higher Institution Structure, Academic Calendar & Exam Readiness',
    summary:
      'What to expect across semesters, continuous assessments, practicals, and study habits before entering higher education.',
    readingText:
      'Higher institution study relies on self-discipline across semesters, continuous assessments, and end-of-semester exams. Building consistent daily notes and review habits early makes the transition much smoother.'
  }
];

export const DAILY_LESSONS = [
  {
    day: 1,
    title: 'Day 1: Structured Foundations & Clean Markup',
    summary:
      'Learn how structured sections organize content on the web and how clean headings and paragraphs make pages readable on mobile.',
    videoUrl: 'https://www.youtube.com/embed/UB1O30fR-EE',
    practicePrompt:
      'In the CodePen-style editor below, create a heading and a short paragraph introducing your learning goal in WebSprout Hub, and style it with emerald/dark colors.',
    starterHtml: `<div class="card">
  <h2>Hello WebSprout Hub!</h2>
  <p>Day 1 practice: learning step by step on mobile.</p>
</div>`,
    starterCss: `body { font-family: sans-serif; padding: 16px; background: #0f172a; color: #f8fafc; }
.card { border: 1px solid #10b981; border-radius: 12px; padding: 16px; background: #022c22; }
h2 { color: #34d399; margin-top: 0; }`,
    starterJs: `console.log('WebSprout Day 1 practice active');`
  },
  {
    day: 2,
    title: 'Day 2: Mobile-First Layout & Spacing',
    summary:
      'Practice spacing, padding, and responsive buttons so learners on small screens can tap easily without crowded text.',
    videoUrl: 'https://www.youtube.com/embed/yfoY53QXEnI',
    practicePrompt:
      'Edit the CSS to give the badge a pill shape and add clear spacing around the button.',
    starterHtml: `<div class="box">
  <span class="badge">Digital Skills</span>
  <h3>Mobile Layout Practice</h3>
  <button class="btn">Next Step</button>
</div>`,
    starterCss: `body { font-family: sans-serif; padding: 16px; background: #0f172a; color: #f8fafc; }
.box { background: #1e293b; padding: 18px; border-radius: 14px; }
.badge { background: #10b981; color: #022c22; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
.btn { margin-top: 12px; background: #34d399; color: #022c22; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; }`,
    starterJs: `console.log('WebSprout Day 2 layout check');`
  }
];

export const FAQS = [
  {
    q: 'How does the 7-day trial and ₦500/month subscription work?',
    a: 'New portals start with a 7-day starter window. After the trial ends, full daily lesson/practice access requires an active ₦500/month subscription—while LearnEase stays free for looking up terms and saving study notes.'
  },
  {
    q: 'Why is there a one-lesson-per-day pace?',
    a: 'Steady daily practice builds real retention over a 4-month course track instead of rushing through lessons without practicing.'
  },
  {
    q: 'Can I book a call if I am not clear on a lesson?',
    a: 'Yes. Inside your portal, fill the Book a Call form with your name, course, department/track, and phone number—it logs right in the hub without leaving your portal and connects with 07049111844.'
  },
  {
    q: 'Is Pre-University Guide focused on PDFs/guides rather than videos?',
    a: 'Yes. Pre-University Guide focuses on departments, WAEC grade/course fit, cut-off mark readiness, credit units, and CGPA calculation guides.'
  }
];
