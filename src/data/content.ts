/**
 * ────────────────────────────────────────────────────────────────────────
 *  ALL PORTFOLIO CONTENT LIVES IN THIS ONE FILE.
 *  Edit text here; no component changes needed. The apps (Finder, Notes,
 *  Terminal, Spotlight, Resume, the "Ask Jignesh" assistant, and the AI
 *  proxy in /api) all read from this object.
 *
 *  Sources: LinkedIn profile export (Oct 2026), the previous portfolio at
 *  jigneshmotwani.github.io/personal-portfolio, and public GitHub repos.
 *
 *  Placeholders: strings starting with "TODO:" mark missing info.
 *  See types.ts for the conventions, and ASSUMPTIONS.md for what was guessed.
 * ────────────────────────────────────────────────────────────────────────
 */
import type { Content } from './types.ts'

export const content: Content = {
  site: {
    title: 'Jignesh Motwani',
    description:
      'Jignesh Motwani is an AI engineer in Singapore. Explore his portfolio as an interactive macOS and iOS desktop.',
    url: 'https://jigneshmotwani.github.io/portfolio/',
    resumePdf: 'resume.pdf',
    showPlaceholders: true,
    welcomeNotificationDelay: 20,
    welcomeMessage: {
      title: 'Jignesh Motwani',
      body: 'Jignesh sent you a message 👋',
      subject: 'Hi Jignesh 👋',
    },
  },

  profile: {
    name: 'Jignesh Motwani',
    firstName: 'Jignesh',
    initials: 'JM',
    headline: 'AI Engineer @ Keppel Tech',
    tagline:
      'Full-stack and AI engineer who likes building tools that empower developers, automate workflows, and scale real-world applications.',
    location: 'Singapore',
    timezone: 'Asia/Singapore',
    coordinates: { latitude: 1.3521, longitude: 103.8198 },
    photo: 'photos/profile.jpg',
    summary: [
      "Hi, I'm Jignesh, a recent Computer Science graduate from the Singapore University of Technology and Design (SUTD) with a minor in Artificial Intelligence. I'm passionate about architecting full-stack systems where complex ideas meet elegant execution.",
      "At FireJet, I worked as a Full Stack Algorithms Engineer, enhancing the Figma-to-code engine by refining backend logic and adding React Native support, which contributed to the platform's growth from around 30,000 to 60,000 users. Before that, at pQCee, I was the sole developer of QuantumNFT, a platform envisioned as a \"Kaggle for quantum programming\", where I built everything from the API and database architecture to blockchain integration via Web3 and MetaMask.",
      'With TypeScript, JavaScript, React, React Native, Node.js, and PostgreSQL in my toolkit, I thrive on building tools that empower developers, automate workflows, and scale real-world applications.',
      "Always keen to exchange ideas around AI, developer tools, and design-to-code systems. Let's connect and talk tech.",
    ],
    openTo: 'TODO: what you are open to (e.g. "Conversations about AI engineering and developer-tools roles")',
    interests: ['AI agents & LLM apps', 'Developer tools', 'Design-to-code systems', 'Distributed systems', 'Version control internals'],
    languages: ['English', 'TODO: other languages you speak'],
  },

  contact: {
    email: 'jignesh.motwani@gmail.com',
    linkedin: 'https://www.linkedin.com/in/jigneshmotwani/',
    github: 'https://github.com/Jigneshmotwani',
    githubUsername: 'Jigneshmotwani',
    website: 'https://jigneshmotwani.github.io/portfolio/',
    phone: '',
    formEndpoint: '',
  },

  currentlyBuilding: {
    title: 'Budwood',
    description:
      'An open-source version control system in Rust for very large monorepos with very high commit rates: lock-free commits, lazy object fetching, and server-side rebases.',
    stack: ['Rust', 'axum', 'SQLite', 'BLAKE3'],
    link: 'https://github.com/Jigneshmotwani/Bud',
    progress: 0.35,
    updated: '2026-10',
  },

  experience: [
    {
      id: 'keppel',
      company: 'Keppel Technology Solutions',
      role: 'AI Engineer',
      start: '2026-01',
      end: null,
      location: 'Singapore',
      summary: 'AI Engineer at Keppel Technology Solutions, the technology arm of Keppel.',
      highlights: [
        'TODO: 2–3 bullets on what you have built at Keppel (systems, stack, users, impact)',
      ],
      // TODO: add the stack you use at Keppel (e.g. Azure AI Foundry) once confirmed.
      tech: [],
      color: '#C8102E',
    },
    {
      id: 'kiora',
      company: 'Kiora Care',
      role: 'Backend and Infra Engineer',
      start: '2025-09',
      end: '2025-12',
      summary: 'Backend and infrastructure engineering for Kiora Care.',
      highlights: ['TODO: 2–3 bullets on the backend/infra work you did at Kiora Care'],
      tech: [],
      color: '#0E9F8E',
    },
    {
      id: 'sutd-ta',
      company: 'Singapore University of Technology and Design (SUTD)',
      role: 'Undergraduate Teaching Assistant, Algorithms',
      type: 'Teaching',
      start: '2024-01',
      end: '2025-04',
      location: 'Singapore',
      summary: 'Teaching assistant for the 50.004 Algorithms module with 300+ students.',
      highlights: [
        'Teaching assistant for the 50.004 Algorithms module with 300+ students.',
        'Helped students master complexity analysis, sorting, recursion, data structures (linked lists, hash maps, heaps, BSTs), graph algorithms (BFS, DFS, Dijkstra), and dynamic programming.',
      ],
      tech: ['Algorithms', 'Data structures'],
      color: '#1F4E9C',
    },
    {
      id: 'firejet',
      company: 'FireJet',
      role: 'Full Stack Algorithms Engineer',
      type: 'Internship',
      start: '2024-05',
      end: '2024-09',
      location: 'Singapore',
      summary:
        "Enhanced the Figma-to-code engine by refining backend logic and adding React Native support, contributing to the platform's growth from around 30,000 to 60,000 users.",
      highlights: [
        'Developed and optimized the Figma-to-Code converter, implementing one-click design-to-code transformation using TypeScript and Node.js.',
        'Added React Native support to the code generator.',
        'Contributed significantly to the new Website-to-Figma Design product, focusing on output accuracy.',
        'Used Supabase and advanced algorithms to improve design-to-code conversion across projects, boosting overall product performance.',
      ],
      tech: ['TypeScript', 'Node.js', 'React', 'React Native', 'Supabase', 'Figma API'],
      color: '#FF6A13',
    },
    {
      id: 'pqcee',
      company: 'pQCee',
      role: 'Software Engineer Intern',
      type: 'Internship',
      start: '2023-08',
      end: '2024-05',
      location: 'Singapore',
      summary:
        'Sole developer of QuantumNFT, a "Kaggle for quantum programming": built everything from the API and database architecture to blockchain integration via Web3 and MetaMask.',
      highlights: [
        'Spearheaded end-to-end development of QuantumNFT, a Web3 platform on Bubble where developers showcase skills through NFT-based quantum coding challenges.',
        'Built custom JavaScript plugins for Bubble that convert quantum circuits into uniquely minted NFTs.',
        'Took the platform from v0.1 to v0.6 and into the testnet phase.',
      ],
      tech: ['JavaScript', 'Web3', 'MetaMask', 'Bubble', 'Quantum circuits'],
      color: '#6D28D9',
    },
    {
      id: 'sutd-research',
      company: 'Singapore University of Technology and Design (SUTD)',
      role: 'Research Assistant, Hand Gesture to Speech Conversion Glove',
      type: 'Research',
      start: '2023-08',
      end: '2023-12',
      location: 'Singapore',
      summary:
        'Worked on a glove that interprets hand gestures into real-time speech to support people with speech impairments.',
      highlights: [
        'Developed a hand-gesture-to-speech conversion glove to make communication more independent and accessible for people with speech impairments.',
        'Focused on accurately interpreting hand gestures into real-time speech output.',
      ],
      tech: [],
      color: '#1F4E9C',
    },
    {
      id: 'sony',
      company: 'Sony Electronics Asia Pacific',
      role: 'Student Intern',
      type: 'Internship',
      start: '2022-05',
      end: '2022-09',
      location: 'Singapore',
      summary: "Supported Sony's new global SAP implementation and web analytics rollout.",
      highlights: [
        'Took part in Harmonization / BPR activities with Sony companies for the new global SAP system implementation.',
        'Assisted with process-flow review updates and supported business analysts in capturing local requirements.',
        'Implemented Adobe Analytics on the Sony Thailand, Malaysia, and Singapore websites.',
        'Researched omnichannel chatbots.',
      ],
      tech: ['SAP', 'Adobe Analytics', 'Chatbots'],
      color: '#111111',
    },
  ],

  education: [
    {
      id: 'sutd',
      school: 'Singapore University of Technology and Design (SUTD)',
      degree: 'Bachelor of Engineering, Computer Science and Design, Minor in AI',
      start: '2021',
      end: '2025',
      location: 'Singapore',
      details: [
        'Undergraduate Merit Scholarship (2021–2025).',
        'Best Machine Learning Project Award and an Honourable Mention at the Singtel x SUTD ISP Merit Awards.',
      ],
      color: '#1F4E9C',
    },
    {
      id: 'narayana',
      school: 'Narayana Junior College',
      degree: 'Higher Secondary Certificate (Maharashtra HSC Board), Computer Science',
      start: '2019-04',
      end: '2021-06',
      location: 'India',
      details: ['Graduated with a 98% grade.'],
      color: '#0F766E',
    },
    {
      id: 'giis',
      school: 'Global Indian International School',
      degree: 'CBSE 10th, PCM Computer Science',
      start: '2013-04',
      end: '2019-03',
      location: 'India',
      details: [],
      color: '#B45309',
    },
  ],

  projects: [
    {
      id: 'ross',
      name: 'ROSS',
      tagline: 'Permission-aware enterprise knowledge assistant',
      description:
        'ROSS answers questions across Google Drive, Confluence, Jira and Slack while only using content the asking user is allowed to open. Built for the Tencent Hackathon 2026 (FinTech track, "Internal Brain" challenge) with the tagline "Your AI only knows what you\'re allowed to know."',
      highlights: [
        'Checks each user\'s permissions on every read via their own delegated OAuth token, so there is no index to rebuild and revocations apply within seconds.',
        'Returns the same "not found" for restricted and nonexistent documents, so it never leaks that restricted content exists.',
        'Guardrails for PII masking, prompt-injection quarantine, and output grounding, plus an HMAC hash-chained audit trail you can query in plain English.',
        'Agent Studio builds governed agents that run with the user\'s access and need human approval before writing to Jira or Slack.',
      ],
      tech: ['Python', 'FastAPI', 'PostgreSQL', 'React', 'TypeScript', 'LiteLLM', 'MCP', 'OpenTelemetry', 'Grafana', 'Docker'],
      tags: ['AI', 'Security', 'Hackathon'],
      year: '2026',
      context: 'Tencent Hackathon 2026',
      links: { github: 'https://github.com/Jigneshmotwani/Tencent-AI-2026' },
      cover: { from: '#0EA5E9', to: '#6366F1', glyph: '🧠' },
      featured: true,
      status: 'Prototype',
    },
    {
      id: 'budwood',
      name: 'Budwood',
      tagline: 'Version control for huge, busy monorepos',
      description:
        'An open-source version control system for very large monorepos with very high commit rates. Instead of replacing git for offline work, it targets a single authoritative history with always-online clients.',
      highlights: [
        'Lock-free commits: the server rebases non-conflicting commits onto newer history and appends with optimistic compare-and-swap.',
        'Clients fetch content-addressed (BLAKE3) objects lazily and keep a bounded local cache.',
        'Derived data such as root trees, a path-history index and incremental line blame are computed from the changeset log.',
        'Workspace of crates: core, server (axum), client + `bud` CLI, read-through cache, and a resumable git importer.',
      ],
      tech: ['Rust', 'axum', 'SQLite', 'BLAKE3', 'HTTP/JSON'],
      tags: ['Systems', 'Developer tools', 'Open source'],
      year: '2026',
      context: 'Side project',
      links: { github: 'https://github.com/Jigneshmotwani/Bud' },
      cover: { from: '#16A34A', to: '#0F766E', glyph: '🌱' },
      featured: true,
      status: 'Active',
    },
    {
      id: 'quantumnft',
      name: 'QuantumNFT',
      tagline: 'A "Kaggle for quantum programming" on Web3',
      description:
        'A Web3 platform where developers showcase their skills through NFT-based quantum coding challenges. Built end to end as the sole developer during an internship at pQCee.',
      highlights: [
        'Designed the API and database architecture and integrated the blockchain through Web3 and MetaMask.',
        'Wrote custom JavaScript plugins for Bubble that turn quantum circuits into uniquely minted NFTs.',
        'Shipped versions v0.1 to v0.6 and took the platform to testnet.',
      ],
      tech: ['JavaScript', 'Web3', 'MetaMask', 'Bubble'],
      tags: ['Web3', 'Quantum', 'Internship'],
      year: '2023–24',
      context: 'pQCee internship',
      links: {},
      cover: { from: '#7C3AED', to: '#DB2777', glyph: '⚛️' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'sign-language',
      name: 'Live Sign-Language Translator',
      tagline: 'Real-time sign language to text and speech',
      description:
        'A real-time sign language translation app that uses computer vision and machine learning to convert sign language gestures into text and speech.',
      highlights: [
        'Recognises hand gestures from a live camera feed with a computer-vision model.',
        'Turns recognised signs into text and synthesised speech in real time.',
      ],
      tech: ['Python', 'Computer vision', 'Machine learning'],
      tags: ['AI', 'Accessibility'],
      year: '2024',
      context: 'SUTD project',
      links: { github: 'https://github.com/Jigneshmotwani/Sign-Language-to-Text-Translator' },
      cover: { from: '#F59E0B', to: '#EF4444', glyph: '🤟' },
      featured: true,
      status: 'Prototype',
    },
    {
      id: 'chord',
      name: 'Chord File Sharing',
      tagline: 'Peer-to-peer file sharing on the Chord protocol',
      description:
        'A decentralized peer-to-peer file sharing system built on the Chord protocol with consistent hashing, optimised for fault tolerance, scalability, and performance in dynamic networks.',
      highlights: [
        'Consistent hashing places files on a ring of peers so nodes can join and leave without a central coordinator.',
        'Designed for fault tolerance and scalability as peers churn.',
      ],
      tech: ['Go', 'Distributed systems', 'Consistent hashing'],
      tags: ['Distributed systems', 'Peer-to-peer'],
      year: '2025',
      context: 'SUTD 50.041 Distributed Systems',
      links: { github: 'https://github.com/Jigneshmotwani/File-Sharing-System-Chord-50.041' },
      cover: { from: '#334155', to: '#0EA5E9', glyph: '🛰️' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'malloc-melee',
      name: 'Malloc Melee',
      tagline: 'A roguelike RPG written in plain C',
      description:
        'A roguelike RPG developed in vanilla C, inspired by Metroidvania games and EarthBound, with a custom architecture that applies object-oriented design principles in C.',
      highlights: [
        'Custom game architecture written from scratch in C.',
        'Applies object-oriented programming principles in plain C.',
      ],
      tech: ['C', 'Game development'],
      tags: ['Games', 'Systems'],
      year: '2024',
      context: 'SUTD project',
      links: { github: 'https://github.com/Jigneshmotwani/Malloc-Melee' },
      cover: { from: '#DC2626', to: '#7C2D12', glyph: '⚔️' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'voluntr',
      name: 'Voluntr',
      tagline: 'Volunteering sign-ups for the Singapore community',
      description:
        'An Android app that makes it easier to discover and sign up for volunteering initiatives in Singapore, with a friendly interface and smooth sign-up flow. It received an Honourable Mention at the Singtel x SUTD ISP Merit Awards.',
      highlights: [
        'Browse and sign up for volunteering initiatives in a few taps.',
        'Honourable Mention, Singtel x SUTD Information Systems & Programming Merit Award.',
      ],
      tech: ['Android', 'Java', 'Firebase'],
      tags: ['Mobile', 'Community', 'Award'],
      year: '2023',
      context: 'SUTD project',
      links: { github: 'https://github.com/Jigneshmotwani/Voluntr1D' },
      cover: { from: '#10B981', to: '#3B82F6', glyph: '🤝' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'sentiment',
      name: 'Sentiment Analysis',
      tagline: 'Machine learning project for SUTD 50.007',
      description:
        'A sentiment analysis project for the 50.007 Machine Learning module. The team received the Best Machine Learning Project award.',
      highlights: ['Best Machine Learning Project Award (SUTD).', 'TODO: one line on the model/approach you used'],
      tech: ['Python', 'Machine learning', 'NLP'],
      tags: ['AI', 'Award'],
      year: '2023',
      context: 'SUTD 50.007 Machine Learning',
      links: { github: 'https://github.com/Jigneshmotwani/Sentiment-Analysis-ML-50.007' },
      cover: { from: '#EC4899', to: '#8B5CF6', glyph: '💬' },
      status: 'Shipped',
    },
    {
      id: 'jignesh-os',
      name: 'JigneshOS',
      tagline: 'This portfolio, as a tiny operating system',
      description:
        'The site you are using right now: a macOS-style desktop on large screens and an iOS-style home screen on phones, with a window manager, Spotlight, an AI assistant grounded in this portfolio, and two games.',
      highlights: [
        'Window manager with drag, resize, minimise, zoom and Mission Control.',
        '"Ask Jignesh" assistant behind a rate-limited serverless proxy, with an offline keyword-search fallback.',
        'Everything is driven by one content file.',
      ],
      tech: ['React', 'TypeScript', 'Vite', 'Zustand', 'Cloudflare Workers'],
      tags: ['Web', 'Fun'],
      year: '2026',
      context: 'Side project',
      links: { github: 'https://github.com/Jigneshmotwani/portfolio' },
      cover: { from: '#111827', to: '#4B5563', glyph: '🖥️' },
      status: 'Active',
    },
  ],

  skills: [
    { id: 'languages', name: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C', 'C++', 'Go', 'Rust', 'SQL'] },
    { id: 'frontend', name: 'Frontend & Mobile', items: ['React', 'React Native', 'HTML/CSS', 'Tailwind CSS', 'Android'] },
    { id: 'backend', name: 'Backend & Data', items: ['Node.js', 'FastAPI', 'PostgreSQL', 'Supabase', 'Firebase', 'SQLite', 'REST APIs'] },
    {
      id: 'ai',
      name: 'AI & ML',
      items: ['LLM applications & agents', 'Azure AI Foundry', 'Azure AI Studio', 'MCP', 'LiteLLM', 'Machine learning', 'Computer vision', 'NLP'],
    },
    {
      id: 'cloud',
      name: 'Cloud & DevOps',
      items: ['Microsoft Azure', 'AWS (Certified Generative AI Developer – Professional)', 'Supabase', 'Firebase', 'Docker', 'OpenTelemetry', 'Grafana', 'Git'],
    },
    { id: 'other', name: 'Also worked with', items: ['Web3 & MetaMask', 'Bubble', 'SAP (process harmonisation)', 'Adobe Analytics', 'Figma API'] },
  ],

  credentials: [
    {
      id: 'azure-ai-apps-agents',
      name: 'Microsoft Certified: Azure AI Apps and Agents Developer Associate',
      issuer: 'Microsoft',
      kind: 'Certification',
      date: 'TODO: month/year earned',
      url: '',
    },
    {
      id: 'aws-genai-pro',
      name: 'AWS Certified Generative AI Developer – Professional',
      issuer: 'Amazon Web Services',
      kind: 'Certification',
      date: 'TODO: month/year earned',
      url: '',
    },
    {
      id: 'ai4i',
      name: 'AI4I® – Literacy in AI',
      issuer: 'AI Singapore',
      kind: 'Certification',
      date: '2022',
    },
    {
      id: 'merit-scholarship',
      name: 'Undergraduate Merit Scholarship',
      issuer: 'SUTD',
      kind: 'Scholarship',
      date: '2021–2025',
    },
    {
      id: 'ideatesomething',
      name: 'IdeateSomething 2021, Winner',
      issuer: 'TODO: organiser',
      kind: 'Competition',
      date: '2021',
      description: 'TODO: one line on the idea that won',
    },
    {
      id: 'best-ml-project',
      name: 'Best Machine Learning Project Award',
      issuer: 'SUTD',
      kind: 'Award',
      date: '2022',
      description: 'For a sentiment analysis project in the 50.007 Machine Learning module.',
    },
    {
      id: 'singtel-honourable-mention',
      name: 'Honourable Mention, Singtel x SUTD Information Systems & Programming Merit Award',
      issuer: 'SUTD × Singtel',
      kind: 'Award',
      date: '2022',
      description: 'For Voluntr, an Android app for community volunteering.',
    },
  ],

  activities: [
    {
      id: 'tencent-hackathon',
      name: 'Tencent Hackathon 2026',
      role: 'Participant, FinTech track',
      date: '2026',
      description: 'Built ROSS, a permission-aware enterprise knowledge assistant.',
    },
    {
      id: 'hacksingapore',
      name: 'HackSingapore 2023',
      role: 'Participant',
      date: '2023',
      description: 'Team project BrewLogi.',
    },
    {
      id: 'marketwatch',
      name: 'SUTD MarketWatch',
      role: 'Website contributor',
      date: '2023',
      description: "Contributed to the club's website.",
    },
  ],

  notes: [
    {
      id: 'about',
      title: 'About me',
      date: '2026-10-28',
      body: `# About me

I'm **Jignesh**, an AI engineer at **Keppel Technology Solutions** in Singapore and a 2025 Computer Science and Design graduate of **SUTD** (minor in AI).

I like architecting full-stack systems where complex ideas meet elegant execution, especially tools that empower developers, automate workflows, and scale.

## Things I've shipped
- Helped grow FireJet's Figma-to-code platform from ~30k to ~60k users
- Built QuantumNFT end to end as pQCee's sole developer
- Taught 300+ students as an Algorithms TA

## Ask me about
- AI agents and LLM apps (Azure AI Foundry, MCP)
- Developer tools and version control internals
- Design-to-code systems`,
    },
    {
      id: 'journey',
      title: 'My journey',
      date: '2026-10-28',
      body: `# My journey

## 2013–2021 · School in India
CBSE 10th at Global Indian International School, then HSC (Computer Science) at Narayana Junior College with a **98%** grade.

## 2021 · SUTD
Started Computer Science and Design at SUTD on an **Undergraduate Merit Scholarship**. Won **IdeateSomething 2021** in my first year.

## 2022 · First industry taste
Interned at **Sony Electronics Asia Pacific** on a global SAP rollout and Adobe Analytics. Won SUTD's **Best Machine Learning Project** award.

## 2023 · Research and Web3
Research assistant on a **hand-gesture-to-speech glove**. Joined **pQCee** and built **QuantumNFT** solo, from v0.1 to v0.6.

## 2024 · Algorithms and design-to-code
TA for **50.004 Algorithms** (300+ students). Summer at **FireJet** improving the Figma-to-code engine and adding React Native output.

## 2025 · Graduation
Graduated with a minor in AI. Backend and infra engineering at **Kiora Care**.

## 2026 · AI engineering
Joined **Keppel Technology Solutions** as an **AI Engineer**. Earned Azure AI and AWS Generative AI certifications. Building **ROSS** at the Tencent Hackathon and **Budwood** on the side.`,
    },
    {
      id: 'now',
      title: 'Now',
      date: '2026-10-28',
      body: `# Now

- **Work:** AI Engineer at Keppel Technology Solutions
- **Building:** Budwood, a Rust VCS for huge monorepos
- **Recently:** ROSS, a permission-aware knowledge assistant (Tencent Hackathon 2026)
- **Certified:** Azure AI Apps and Agents Developer Associate; AWS Generative AI Developer – Professional`,
    },
    {
      id: 'this-site',
      title: 'About this site',
      date: '2026-10-28',
      body: `# About this site

This portfolio is a small operating system written in **React + TypeScript** and bundled with **Vite**.

- Laptops get a macOS-style desktop, phones get an iOS-style home screen
- All content comes from one file: \`src/data/content.ts\`
- "Ask Jignesh" streams answers from an LLM through a rate-limited Cloudflare Worker, and falls back to keyword search when offline
- Games: Tetris and Chess (minimax with alpha-beta pruning)

Source: [github.com/Jigneshmotwani/portfolio](https://github.com/Jigneshmotwani/portfolio)`,
    },
  ],

  albums: [
    {
      id: 'projects',
      name: 'Projects',
      photos: [
        { id: 'p-ross', src: 'cover:ross', caption: 'ROSS: permission-aware knowledge assistant' },
        { id: 'p-budwood', src: 'cover:budwood', caption: 'Budwood: VCS for huge monorepos' },
        { id: 'p-quantumnft', src: 'cover:quantumnft', caption: 'QuantumNFT: quantum coding challenges as NFTs' },
        { id: 'p-sign', src: 'cover:sign-language', caption: 'Live Sign-Language Translator' },
        { id: 'p-chord', src: 'cover:chord', caption: 'Chord peer-to-peer file sharing' },
        { id: 'p-malloc', src: 'cover:malloc-melee', caption: 'Malloc Melee: roguelike RPG in C' },
        { id: 'p-voluntr', src: 'cover:voluntr', caption: 'Voluntr: volunteering made easy' },
        { id: 'p-sentiment', src: 'cover:sentiment', caption: 'Sentiment Analysis (Best ML Project)' },
        { id: 'p-os', src: 'cover:jignesh-os', caption: 'JigneshOS: this website' },
      ],
    },
    {
      id: 'me',
      name: 'Me',
      photos: [{ id: 'me-1', src: 'photos/profile.jpg', caption: "Hi, I'm Jignesh 👋" }],
    },
    {
      id: 'wallpapers',
      name: 'Wallpapers',
      photos: [
        { id: 'w-dunes', src: 'wallpapers/dunes.svg', caption: 'Dunes' },
        { id: 'w-lagoon', src: 'wallpapers/lagoon.svg', caption: 'Lagoon' },
        { id: 'w-aurora', src: 'wallpapers/aurora.svg', caption: 'Aurora' },
        { id: 'w-bloom', src: 'wallpapers/bloom.svg', caption: 'Bloom' },
        { id: 'w-skyline', src: 'wallpapers/skyline.svg', caption: 'Skyline' },
        { id: 'w-graphite', src: 'wallpapers/graphite.svg', caption: 'Graphite' },
      ],
    },
  ],

  bookmarks: [
    { title: 'GitHub', url: 'https://github.com/Jigneshmotwani', glyph: 'GH', color: '#24292F' },
    { title: 'LinkedIn', url: 'https://www.linkedin.com/in/jigneshmotwani/', glyph: 'in', color: '#0A66C2' },
    { title: 'Old portfolio', url: 'https://jigneshmotwani.github.io/personal-portfolio/', glyph: 'JM', color: '#7C3AED' },
    { title: 'Budwood', url: 'https://github.com/Jigneshmotwani/Bud', glyph: '🌱', color: '#16A34A' },
    { title: 'ROSS', url: 'https://github.com/Jigneshmotwani/Tencent-AI-2026', glyph: '🧠', color: '#4F46E5' },
    { title: 'SUTD', url: 'https://www.sutd.edu.sg/', glyph: 'S', color: '#1F4E9C' },
  ],

  music: [
    { title: 'Late-Night Commit', artist: 'JigneshOS Radio', bpm: 74, root: 57, progression: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 8], [-4, 0, 3, 7]] },
    { title: 'Merge Conflict Blues', artist: 'JigneshOS Radio', bpm: 82, root: 60, progression: [[0, 4, 7, 11], [-3, 0, 4, 7], [2, 5, 9, 12], [-5, -1, 2, 5]] },
    { title: 'Deploy on Friday', artist: 'JigneshOS Radio', bpm: 90, root: 62, progression: [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 7], [7, 11, 14, 17]] },
  ],

  assistant: {
    name: 'Ask Jignesh',
    greeting:
      "Hi! I'm Jignesh's portfolio assistant. Ask me about his work, projects, skills or background. I only answer from what's on this site.",
    starters: [
      'What does Jignesh do at Keppel?',
      'What cloud platforms has he worked on?',
      'Tell me about QuantumNFT',
      'What is he building right now?',
      'What did he do at FireJet?',
      'Which certifications does he have?',
    ],
    unknownAnswer: "I don't have that info — try Mail to ask him directly.",
    apiUrl: '',
  },
}

export default content
