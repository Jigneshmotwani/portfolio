/**
 * ────────────────────────────────────────────────────────────────────────
 *  ALL PORTFOLIO CONTENT LIVES IN THIS ONE FILE.
 *  Edit text here; no component changes needed. The apps (Finder, Notes,
 *  Terminal, Spotlight, Resume, the "Ask Jignesh" assistant, and the AI
 *  proxy in /api) all read from this object.
 *
 *  Sources: the "Jignesh Motwani — Master Resume" doc and one-page resume
 *  PDF (Oct 2026), the LinkedIn profile export, the previous portfolio at
 *  jigneshmotwani.github.io/personal-portfolio, and public GitHub repos.
 *  Lines the master resume marks "confirm" are left out until confirmed.
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
      'Jignesh Motwani is an AI engineer in Singapore building RAG and multi-agent systems. Explore his portfolio as an interactive macOS and iOS desktop.',
    url: 'https://jigneshmotwani.vercel.app/',
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
      'AI Engineer building RAG and multi-agent systems on AWS, Azure and GCP; lead of K2, an enterprise AI agent platform, and developer on an AIOps platform sold to enterprise clients.',
    location: 'Singapore',
    timezone: 'Asia/Singapore',
    coordinates: { latitude: 1.3521, longitude: 103.8198 },
    photo: 'photos/profile.jpg',
    summary: [
      "Hi, I'm Jignesh, an AI Engineer on the Data & AI team at Keppel Technology Solutions in Singapore, and a Computer Science and Design graduate of SUTD (Honours with Merit, minor in AI).",
      'I lead K2, an enterprise AI agent platform used by 300+ employees, as its product owner and architect, and I co-develop an AIOps platform for incident, compliance and change management that is sold to enterprise clients. I also work directly with clients, scoping and building GenAI solutions on AWS Bedrock, Azure AI Foundry and Gemini Enterprise Agent Platform: RAG assistants, agentic workflows, voice AI and computer vision.',
      'Before Keppel I grew a Figma-to-code engine at FireJet (30k to 60k users), built QuantumNFT end to end as the sole developer at pQCee, led development at the education AI startup Lenor AI, and taught 300+ students as an Algorithms TA.',
      "Always keen to exchange ideas around AI agents, developer tools and distributed systems. Let's connect and talk tech.",
    ],
    openTo: 'TODO: what you are open to (e.g. "Conversations about AI engineering and forward-deployed roles")',
    interests: ['AI agents & multi-agent systems', 'RAG and LLMOps', 'Developer tools', 'Distributed systems', 'Design-to-code systems'],
    hobbies: ['Basketball', 'Running', 'Cycling', 'Photography', 'Solo travel', 'Chess'],
    languages: ['English', 'TODO: other languages you speak'],
  },

  contact: {
    email: 'jignesh.motwani@gmail.com',
    linkedin: 'https://www.linkedin.com/in/jigneshmotwani/',
    github: 'https://github.com/Jigneshmotwani',
    githubUsername: 'Jigneshmotwani',
    website: 'https://jigneshmotwani.vercel.app/',
    phone: '+65 9297 5323',
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
      team: 'Data & AI Team',
      role: 'AI Engineer',
      start: '2026-01',
      end: null,
      location: 'Singapore',
      summary:
        'Works directly with enterprise clients across AWS, Azure and GCP, from understanding the problem to architecture, build and delivery. RAG, DAG workflows and agentic architectures are day-to-day work.',
      highlights: [
        'Lead K2, an enterprise AI agent platform used by 300+ employees, as its product owner, architect and developer: teams build, certify, release and operate AI agents across cloud agent platforms.',
        'Lead a 6-person engineering team; review and merge the team’s code and release dev → UAT → production with GitLab CI/CD on Kubernetes.',
        'Designed K2’s agent lifecycle: a guided Agent Definition generates Python (Strands) agents that are sandbox-tested, certified by a reviewer and released by an operator. Agents run on AWS Bedrock AgentCore today, with platform adapters designed for Google, Azure and sovereign clouds.',
        'Built K2’s governance on open source: OPA policy-as-code gates at submit, certify, release and deploy (fail closed), a LiteLLM gateway with budgets and spend logs, OpenTelemetry and Langfuse tracing, Grafana dashboards, a hash-chained audit log and six roles with separation of duties.',
        'Co-develop an AIOps platform sold to multiple enterprise clients for incident, compliance and change management on AWS and Azure: alerts are correlated on a service graph, Bedrock agents suggest cited root causes via RAG over runbooks, and fixes run only after human approval, with rollback.',
        'Own the AIOps service graph, compliance auto-fixes, CVE handling and ServiceNow integration, against MVP targets of 50%+ less alert noise, 80%+ top-3 root-cause accuracy and under $1 of AI cost per incident.',
        'Delivered GenAI solutions directly with 10+ enterprise clients on AWS Bedrock, Azure AI Foundry and Gemini Enterprise Agent Platform: RAG assistants, agentic workflows, voice AI and computer vision, evaluated with LLM-as-judge.',
        'Prepared Keppel’s AWS Generative AI Competency self-assessment, covering four customer use cases with go-live documentation.',
        'Built a Proposal Consolidator agent that merges solution architecture documents and concept papers into one proposal in a standard template and flags contradictions, such as a solution that misses a requirement.',
      ],
      tech: [
        'Python',
        'TypeScript',
        'Fastify',
        'React',
        'PostgreSQL',
        'Kubernetes',
        'Helm',
        'AWS Bedrock AgentCore',
        'Strands Agents',
        'LangGraph',
        'OPA',
        'LiteLLM',
        'Langfuse',
        'OpenTelemetry',
        'GitLab CI/CD',
      ],
      color: '#C8102E',
    },
    {
      id: 'firejet',
      company: 'FireJet',
      role: 'Full Stack Algorithms Engineer Intern',
      type: 'Internship',
      start: '2024-05',
      end: '2024-09',
      location: 'Singapore',
      summary:
        "Improved FireJet's one-click Figma-to-code engine and its new Website-to-Figma product, contributing to growth from 30k to 60k users.",
      highlights: [
        'Developed and optimized a one-click Figma-to-code converter (React, Vue and Tailwind output) in TypeScript and Node.js, helping grow platform users from 30k to 60k.',
        'Integrated design-to-code engine improvements into the new Website-to-Figma product, focusing on output accuracy; it reached 5k users in its first month.',
        'Added React Native support to the code generator.',
        "Used Supabase, RESTful APIs and custom algorithms to improve design-to-code conversion across FireJet's products.",
      ],
      tech: ['TypeScript', 'Node.js', 'React', 'Vue', 'Tailwind CSS', 'React Native', 'Supabase', 'Figma API'],
      color: '#FF6A13',
    },
    {
      id: 'sutd-ta',
      company: 'Singapore University of Technology and Design (SUTD)',
      role: 'Undergraduate Teaching Assistant, Algorithms',
      type: 'Teaching',
      start: '2024-01',
      end: '2024-05',
      location: 'Singapore',
      summary: 'Teaching assistant for the 50.004 Algorithms module with 300+ students.',
      highlights: [
        'Supported 300+ students of the 50.004 Algorithms module in lectures, cohort classes and office hours, and evaluated homework for accuracy and efficiency with constructive feedback.',
        'Helped students master complexity analysis, sorting, recursion, data structures (linked lists, hash maps, heaps, BSTs), graph algorithms (BFS, DFS, Dijkstra) and dynamic programming.',
      ],
      tech: ['Algorithms', 'Data structures'],
      color: '#1F4E9C',
    },
    {
      id: 'lenor',
      company: 'Lenor AI',
      role: 'Lead Software Developer',
      start: '2023-10',
      end: '2024-04',
      location: 'Singapore',
      summary: 'Lead developer at an education AI startup making personalised private tutoring accessible through AI.',
      highlights: ['Pitch results: Social Ignition Pitch 2023, 2nd place; Ground Zero 2024, Best Pitch; Hult Prize Mumbai 2024 Summit, finalist.'],
      tech: [],
      color: '#7C3AED',
    },
    {
      id: 'pqcee',
      company: 'pQCee Pte Ltd.',
      role: 'Software Engineering Intern',
      type: 'Internship',
      start: '2023-08',
      end: '2024-03',
      location: 'Singapore',
      summary:
        'Sole developer of QuantumNFT, a "Kaggle for quantum programming": built everything from the API and database architecture to blockchain integration via Web3 and MetaMask.',
      highlights: [
        'As sole developer, built QuantumNFT end to end: a Web3 platform on Bubble where developers showcase quantum programming skills through NFT-based coding challenges ("Kaggle for Quantum Programming").',
        'Wrote custom JavaScript plugins for Bubble that convert quantum circuits into uniquely minted NFTs, with MetaMask wallet integration.',
        'Took the platform from v0.1 to v0.6 and onto testnet through agile iterations with test-driven development.',
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
      summary: "Web analytics and process work for Sony's Asia Pacific websites and its new global SAP system.",
      highlights: [
        'Implemented Adobe Analytics on the Sony Thailand, Malaysia and Singapore websites to capture customer data for targeted advertising and a faster checkout.',
        'Researched omnichannel chatbots Sony could add to its websites.',
        'Took part in Harmonization / BPR activities with Sony companies for the new global SAP system, and supported business analysts in capturing local requirements.',
      ],
      tech: ['Adobe Analytics', 'SAP', 'Chatbots'],
      color: '#111111',
    },
    {
      id: 'sutd-animal-behaviour',
      company: 'Singapore University of Technology and Design (SUTD)',
      role: 'Undergraduate Researcher (Machine Learning), Animal Behaviour Analysis',
      type: 'Research',
      start: '2021-09',
      end: '2022-04',
      location: 'Singapore',
      summary: 'Computer vision research on animal behaviour analysis with AI.',
      highlights: [
        'Annotated and analysed computer vision datasets: 50 hours of video for behaviour localisation, 30K video sequences for multi-label action recognition and 33K frames for pose estimation.',
        'Developed algorithms for further study of animal behaviour using computer vision and deep learning.',
      ],
      tech: ['Computer vision', 'Deep learning'],
      color: '#1F4E9C',
    },
  ],

  education: [
    {
      id: 'sutd',
      school: 'Singapore University of Technology and Design (SUTD)',
      degree: 'Bachelor of Engineering in Computer Science and Design, Honours with Merit',
      start: '2021-09',
      end: '2025-05',
      location: 'Singapore',
      details: [
        'Minor in Artificial Intelligence; specialization tracks in Data Analytics and Financial Technology.',
        'Undergraduate Merit Scholarship (Global Merit Scholar).',
        'Best Student Project Award, Machine Learning: third-order HMM + Viterbi, top of 50+ teams.',
        'Teaching Assistant, Algorithms (300+ students).',
        'Technology Lead of the MarketWatch Club, Senior Project Member of the Google Developer Student Club, Sports Representative of SUTD, and Treasurer of the Athletics Club.',
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
      id: 'k2',
      name: 'K2',
      tagline: 'Enterprise AI agent platform at Keppel',
      description:
        'A platform where teams build, certify, release and operate AI agents across cloud agent platforms. Used by 300+ employees at Keppel and planned to be customised and sold to clients. Jignesh leads it as product owner, architect and developer.',
      highlights: [
        'Agent lifecycle: a guided Agent Definition generates the agent’s Python (Strands) code, which is test-deployed to a sandbox, certified by a reviewer and released by an operator; staff chat with released agents through K2, and agents can be suspended or rolled back.',
        'Runs on AWS Bedrock AgentCore today, designed for Google, Azure and sovereign clouds through platform adapters.',
        'Governance on open source: OPA policy-as-code checks (fail closed), a LiteLLM gateway with virtual keys and budgets, OpenTelemetry and Langfuse tracing, Grafana dashboards and OpenLineage/Marquez lineage.',
        'Hash-chained audit log, six roles with separation of duties and write-only secrets; built by a 6-person team plus AI coding agents working in parallel workstreams.',
      ],
      tech: ['TypeScript', 'Fastify', 'React', 'PostgreSQL', 'Drizzle', 'Kubernetes', 'Helm', 'Python', 'Strands Agents', 'AWS Bedrock AgentCore', 'OPA', 'LiteLLM', 'Langfuse'],
      tags: ['AI agents', 'Platform', 'Work'],
      year: '2026',
      context: 'Keppel Technology Solutions',
      role: 'Lead: product owner, architect and developer',
      links: {},
      cover: { from: '#C8102E', to: '#7C1D3A', glyph: '🛰️' },
      featured: true,
      status: 'Active',
    },
    {
      id: 'chord',
      name: 'P2P File Sharing System',
      tagline: 'Distributed file sharing on the Chord DHT, in Go',
      description:
        'A fully working distributed peer-to-peer file sharing system built from scratch in Golang with no external libraries, on the Chord DHT protocol with consistent hashing for file storage and retrieval.',
      highlights: [
        'Chord DHT with consistent hashing places and finds files on a ring of peers, with no central coordinator.',
        'Handles fault tolerance including Byzantine faults, dynamic node joins and departures, and multiple simultaneous failures.',
        'Written in Go with no external libraries.',
      ],
      tech: ['Go', 'Distributed systems', 'Chord DHT', 'Consistent hashing'],
      tags: ['Distributed systems', 'Peer-to-peer'],
      year: '2025',
      context: 'SUTD 50.041 Distributed Systems',
      links: { github: 'https://github.com/Jigneshmotwani/File-Sharing-System-Chord-50.041' },
      cover: { from: '#334155', to: '#0EA5E9', glyph: '🔗' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'sign-language',
      name: 'Live Sign-Language Translation',
      tagline: 'Real-time sign language to text with computer vision',
      description:
        'Real-time sign-language-to-text translation using computer vision and Google MediaPipe, built by a team of four led by Jignesh. It reached 99.5% accuracy in gesture-to-text conversion.',
      highlights: [
        'Led a team of 4 to build real-time sign-language-to-text translation with computer vision and Google MediaPipe, reaching 99.5% accuracy.',
        'Developed the hybrid Point-CNN and PointNet deep learning model behind the translation.',
      ],
      tech: ['Python', 'Computer vision', 'MediaPipe', 'PointNet', 'Deep learning'],
      tags: ['AI', 'Computer vision', 'Accessibility'],
      year: '2024',
      context: 'SUTD project',
      role: 'Team lead',
      links: { github: 'https://github.com/Jigneshmotwani/Sign-Language-Translator' },
      cover: { from: '#F59E0B', to: '#EF4444', glyph: '🤟' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'kiora',
      name: 'KIORA',
      tagline: 'Healthcare platform for dialysis (CAPD) care',
      description:
        'A healthcare platform for patients, doctors and clinics to manage dialysis (CAPD) sessions, vitals, medications, inventory and appointments, architected and built for Kiora Care.',
      highlights: [
        'Architected and built KIORA with FastAPI, Node.js, React (Tailwind and shadcn/ui) and PostgreSQL in Docker.',
        'Deployed on AWS (ECS/Lambda, RDS, S3) with role-based access control and modules for sessions, vitals, medications, notifications, file storage and inventory.',
      ],
      tech: ['FastAPI', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS ECS', 'AWS Lambda', 'Amazon RDS', 'Amazon S3'],
      tags: ['Healthcare', 'Full-stack', 'Cloud'],
      year: '2025',
      context: 'Kiora Care (Backend and Infra Engineer, Sep–Dec 2025)',
      links: {},
      cover: { from: '#0E9F8E', to: '#2563EB', glyph: '🩺' },
      featured: true,
      status: 'Shipped',
    },
    {
      id: 'ross',
      name: 'ROSS',
      tagline: 'Permission-aware knowledge and agent platform',
      description:
        'Built with a teammate for the Tencent Hackathon 2026 (FinTech track, Aspire): a permission-aware knowledge and agent platform that runs locally, with a visual agentic workflow builder. "Your AI only knows what you\'re allowed to know."',
      highlights: [
        'Chat to create and edit workflows, tools and MCP servers in a visual agentic workflow builder.',
        'Checks each user’s permissions on every read across Google Drive, Confluence, Jira and Slack, and returns the same "not found" for restricted and missing documents.',
        'Guardrails, a LiteLLM gateway, and OpenTelemetry with Grafana for tracing; plus an Aspire use case that automates a daily task.',
      ],
      tech: ['Python', 'FastAPI', 'PostgreSQL', 'React', 'TypeScript', 'LiteLLM', 'MCP', 'OpenTelemetry', 'Grafana', 'Docker'],
      tags: ['AI agents', 'Security', 'Hackathon'],
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
        'Workspace of crates: core, server (axum), client + bud CLI, read-through cache, and a resumable git importer.',
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
        'Shipped versions v0.1 to v0.6 with agile cycles and TDD, and took the platform to testnet.',
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
      id: 'emotion-music',
      name: 'Emotion Detection from Music',
      tagline: 'Classifying music by emotional tone',
      description:
        'A deep learning model that classifies music by emotional tone (happy, fear, sad, neutral) to reduce mood drift on streaming platforms, built by a team of three led by Jignesh.',
      highlights: [
        'Led a team of 3 to build a model that classifies music as happy, fear, sad or neutral.',
        'Designed and trained an ensemble of Transformer, VGG-CNN and CNN-RNN models, reaching 98% accuracy.',
      ],
      tech: ['Python', 'Deep learning', 'Transformers', 'CNN', 'RNN'],
      tags: ['AI', 'Audio'],
      year: '2025',
      context: 'SUTD project',
      role: 'Team lead',
      links: { github: 'https://github.com/Jigneshmotwani/moodify' },
      cover: { from: '#EC4899', to: '#F59E0B', glyph: '🎧' },
      status: 'Shipped',
    },
    {
      id: 'emergenai',
      name: 'EmergenAI',
      tagline: 'GenAI market research from documents',
      description:
        'A Streamlit app on the Azure OpenAI API that parses research papers and business documents into a comparative summary of the market, future opportunities and the skills needed to enter it. Built by a team of three led by Jignesh at the Temasek GenAI Hackathon 2024.',
      highlights: [
        'Turns research papers and business documents into a comparative market summary.',
        'Chatbot (GPT-3.5 Turbo) that answers business owners’ questions from those documents.',
      ],
      tech: ['Python', 'Streamlit', 'Azure OpenAI', 'RAG'],
      tags: ['GenAI', 'Hackathon'],
      year: '2024',
      context: 'Temasek GenAI Hackathon 2024',
      role: 'Team lead',
      links: { demo: 'https://drive.google.com/file/d/1VDOCecAwCVNvjlI1aIcmXCrcBhHIbkT2/view?usp=sharing' },
      cover: { from: '#2563EB', to: '#14B8A6', glyph: '📊' },
      status: 'Prototype',
    },
    {
      id: 'metro-pass-planner',
      name: 'Japan Metro Pass Planner',
      tagline: 'Route optimizer for Japan rail passes',
      description:
        'A full-stack web app that plans optimal train routes in Japan based on metro pass eligibility.',
      highlights: [
        'Modelled the train network in Neo4j and computed the most efficient paths with shortest-path algorithms.',
        'Route and pass recommenders, saved trips and Google OAuth sign-in, with MongoDB for user data, Node.js APIs and a React frontend.',
      ],
      tech: ['Neo4j', 'MongoDB', 'Node.js', 'React', 'Google OAuth'],
      tags: ['Full-stack', 'Graphs'],
      year: '2023',
      context: 'SUTD project',
      links: { github: 'https://github.com/Jigneshmotwani/Metro-Pass-Planner' },
      cover: { from: '#DC2626', to: '#F97316', glyph: '🚄' },
      status: 'Shipped',
    },
    {
      id: 'zen-pod',
      name: 'Zen Smart Resting Pod',
      tagline: 'Control panel and posture vision for a smart pod',
      description:
        'Entrepreneurship capstone: a smart standing resting pod with a full-stack control panel for lighting, soundscapes and ergonomic positioning.',
      highlights: [
        'Built a MERN control panel (MongoDB, Express.js, React, Node.js) for real-time control of lighting, soundscapes and ergonomic positioning.',
        'Implemented an OpenCV pipeline that analyses posture and computes a personalised optimal position.',
        'Engineered the hardware-software interface for actuators, LEDs and audio through centralised logic, reducing input-to-feedback latency.',
      ],
      tech: ['MongoDB', 'Express.js', 'React', 'Node.js', 'OpenCV', 'Hardware integration'],
      tags: ['IoT', 'Computer vision'],
      year: '2025',
      context: 'SUTD entrepreneurship capstone',
      links: { github: 'https://github.com/Zen-pod/control' },
      cover: { from: '#0D9488', to: '#6366F1', glyph: '🧘' },
      status: 'Prototype',
    },
    {
      id: 'voluntr',
      name: 'Voluntr',
      tagline: 'Volunteering sign-ups for the Singapore community',
      description:
        'An Android app in Java with Firebase that connects users to volunteering events across Singapore, with real-time sign-ups and event tracking. Built by a team of five for 50.001 Information Systems & Programming; it won an Honourable Mention (SGD 1,500) from Singtel out of 200+ students.',
      highlights: [
        'Swiping interface for choosing activities and automatic group formation on sign-up; user flows, menus and tiles designed in Figma.',
        'Custom RecyclerViews, activity transitions and efficient data handling with JSON and Firebase Realtime Database.',
        'Honourable Mention, Singtel x SUTD Information Systems & Programming Merit Award (SGD 1,500).',
      ],
      tech: ['Android', 'Java', 'Firebase', 'Figma'],
      tags: ['Mobile', 'Community', 'Award'],
      year: '2023',
      context: 'SUTD 50.001 Information Systems & Programming',
      links: { github: 'https://github.com/Jigneshmotwani/Voluntr1D' },
      cover: { from: '#10B981', to: '#3B82F6', glyph: '🤝' },
      status: 'Shipped',
    },
    {
      id: 'sentiment',
      name: 'Sentiment Analysis',
      tagline: 'Third-order HMM with Viterbi decoding',
      description:
        'A sentiment analysis system for the 50.007 Machine Learning module using a third-order Hidden Markov Model with the Viterbi algorithm to predict tag sequences for new sentences. It had the highest F1 scores in the module and won the Best Student Project Award, the top prize among 50+ teams.',
      highlights: ['Third-order Hidden Markov Model with Viterbi decoding.', 'Highest F1 scores in the module; Best Student Project Award among 50+ teams.'],
      tech: ['Python', 'NLP', 'Hidden Markov Models', 'Viterbi'],
      tags: ['AI', 'NLP', 'Award'],
      year: '2023',
      context: 'SUTD 50.007 Machine Learning',
      links: { github: 'https://github.com/Jigneshmotwani/Sentiment-Analysis-ML-50.007' },
      cover: { from: '#8B5CF6', to: '#EC4899', glyph: '💬' },
      status: 'Shipped',
    },
    {
      id: 'sia-travel-planner',
      name: 'GenAI Travel Planner',
      tagline: 'Trip planning on the OpenAI API',
      description:
        'A travel planner built on the OpenAI API with React, Node.js and TypeScript in a 4-person agile team for the Singapore Airlines AppChallenge 2023, tailored to research on SIA’s business.',
      highlights: ['User-centric layouts, form-based flows and security integrations.'],
      tech: ['OpenAI API', 'React', 'Node.js', 'TypeScript'],
      tags: ['GenAI', 'Hackathon'],
      year: '2023',
      context: 'Singapore Airlines AppChallenge 2023',
      links: { github: 'https://github.com/Jigneshmotwani/binarybros.github.io' },
      cover: { from: '#1E3A8A', to: '#F59E0B', glyph: '✈️' },
      status: 'Prototype',
    },
    {
      id: 'malloc-melee',
      name: 'Malloc Melee',
      tagline: 'A roguelike RPG written in plain C',
      description:
        'A roguelike RPG developed in vanilla C, inspired by Metroidvania games and EarthBound, using structs, basic object-oriented patterns and custom state machines.',
      highlights: ['Custom game architecture written from scratch in C.', 'Structs, basic object-oriented patterns and custom state machines.'],
      tech: ['C', 'Game development'],
      tags: ['Games', 'Systems'],
      year: '2024',
      context: 'SUTD project',
      links: { github: 'https://github.com/Jigneshmotwani/Malloc-Melee' },
      cover: { from: '#DC2626', to: '#7C2D12', glyph: '⚔️' },
      status: 'Shipped',
    },
    {
      id: 'brewlogi',
      name: 'BrewLogi',
      tagline: 'Event food and drink ordering',
      description:
        'A mobile app for event food and drink orders, with organiser tools for inventory, stall and client tracking and low-stock alerts. Built at HackSingapore 2023.',
      highlights: ['Organiser tools for inventory, stall and client tracking, with low-stock alerts.'],
      tech: ['Java', 'Android'],
      tags: ['Mobile', 'Hackathon'],
      year: '2023',
      context: 'HackSingapore 2023',
      links: {},
      cover: { from: '#92400E', to: '#F59E0B', glyph: '☕' },
      status: 'Prototype',
    },
    {
      id: 'meetup',
      name: 'MEETup',
      tagline: 'Meet like-minded people over shared interests',
      description:
        'An app concept that connects like-minded people and recommends activities from shared interests. It won IdeateSomething 2021 against 10 teams, with $1,000 in funding.',
      highlights: ['Winner of IdeateSomething 2021 (Venture, Innovation & Entrepreneurship SUTD), with $1,000 in funding.'],
      tech: ['Product design', 'Figma'],
      tags: ['Product', 'Award'],
      year: '2021',
      context: 'IdeateSomething 2021',
      links: {},
      cover: { from: '#F43F5E', to: '#A855F7', glyph: '👋' },
      status: 'Prototype',
    },
    {
      id: 'brainhack',
      name: 'SAF Check-in App',
      tagline: 'Brainhack CODE_EXP 2022',
      description:
        'A week-long hackathon project that streamlined SAF personnel check-in and check-out, prototyped in Figma and built in React Native.',
      highlights: ['Prototyped in Figma and built in React Native during a week-long hackathon.'],
      tech: ['React Native', 'Figma'],
      tags: ['Mobile', 'Hackathon'],
      year: '2022',
      context: 'Brainhack CODE_EXP 2022',
      links: {},
      cover: { from: '#166534', to: '#65A30D', glyph: '🪖' },
      status: 'Prototype',
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
      tech: ['React', 'TypeScript', 'Vite', 'Zustand', 'Vercel Functions', 'ai&'],
      tags: ['Web', 'Fun'],
      year: '2026',
      context: 'Side project',
      links: { github: 'https://github.com/Jigneshmotwani/portfolio' },
      cover: { from: '#111827', to: '#4B5563', glyph: '🖥️' },
      status: 'Active',
    },
  ],

  skills: [
    { id: 'languages', name: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'Go', 'C', 'C++', 'SQL', 'Solidity', 'Bash'] },
    {
      id: 'ai',
      name: 'AI & GenAI',
      items: ['LLMs', 'RAG', 'GraphRAG', 'Agentic AI & multi-agent systems', 'Fine-tuning (LoRA, PEFT)', 'LLM evaluation (LLM-as-judge)', 'Prompt engineering', 'Computer vision', 'NLP'],
    },
    {
      id: 'ai-platforms',
      name: 'AI platforms',
      items: [
        'AWS Bedrock (AgentCore, Agents, Knowledge Bases, Guardrails, Flows)',
        'Gemini Enterprise Agent Platform (Vertex AI)',
        'Azure AI Foundry',
        'Azure OpenAI',
        'Copilot Studio',
      ],
    },
    {
      id: 'agents',
      name: 'Agent frameworks',
      items: ['LangGraph', 'LangChain', 'Strands Agents', 'Google ADK', 'OpenAI Agents SDK', 'Microsoft Agent Framework', 'MCP (servers and clients)'],
    },
    {
      id: 'models',
      name: 'Models & serving',
      items: ['OpenAI, Claude and Gemini APIs', 'Llama, Qwen, Mistral', 'Hugging Face Transformers', 'vLLM', 'Ollama'],
    },
    {
      id: 'retrieval',
      name: 'RAG & retrieval',
      items: ['pgvector', 'OpenSearch', 'Azure AI Search', 'Hybrid search & rerankers', 'Knowledge graphs', 'Amazon Textract', 'Amazon Comprehend'],
    },
    {
      id: 'llmops',
      name: 'LLMOps & observability',
      items: ['LiteLLM', 'Langfuse', 'OpenTelemetry', 'OpenLineage', 'Marquez', 'OpenMetadata', 'OPA', 'Grafana', 'MLflow'],
    },
    {
      id: 'ml',
      name: 'ML & computer vision',
      items: ['PyTorch', 'TensorFlow', 'OpenCV', 'MediaPipe', 'PointNet', 'Transformer, CNN and RNN ensembles', 'HMM & Viterbi', 'NumPy', 'Streamlit'],
    },
    {
      id: 'data',
      name: 'Data & pipelines',
      items: ['Databricks', 'BigQuery', 'Snowflake', 'Kafka', 'Kinesis', 'EventBridge', 'AWS Step Functions', 'PostgreSQL', 'MongoDB', 'Neo4j', 'Redis'],
    },
    {
      id: 'cloud',
      name: 'Cloud',
      items: [
        'AWS (Bedrock, Lambda, Step Functions, SSM, CloudWatch, Security Hub, EKS, ECS, RDS, S3)',
        'Microsoft Azure (AI Foundry, Functions, AKS)',
        'Google Cloud (Cloud Run, GKE, BigQuery)',
        'Supabase',
        'Firebase',
        'Docker',
        'OpenTelemetry',
        'Grafana',
      ],
    },
    {
      id: 'devops',
      name: 'Platform & DevOps',
      items: ['Docker', 'Kubernetes (EKS, AKS, GKE)', 'Helm', 'Terraform', 'CDK', 'Bicep', 'GitLab CI/CD', 'GitHub Actions', 'Azure DevOps', 'Git'],
    },
    {
      id: 'web',
      name: 'Web & integrations',
      items: [
        'React',
        'Next.js',
        'React Native',
        'Node.js',
        'Express.js',
        'Fastify',
        'Vue.js',
        'FastAPI',
        'Flask',
        'Supabase',
        'Firebase',
        'REST APIs',
        'ServiceNow',
        'Selenium',
        'Cypress',
        'Android',
        'Ethereum',
        'Polygon',
      ],
    },
    { id: 'other', name: 'Also worked with', items: ['Figma', 'Adobe Analytics', 'SAP (process harmonisation)', 'Bubble', 'FPGA'] },
  ],

  credentials: [
    {
      id: 'aws-genai-pro',
      name: 'AWS Certified Generative AI Developer – Professional',
      issuer: 'Amazon Web Services',
      kind: 'Certification',
      date: '2026-10',
      url: 'https://www.credly.com/badges/79e406e1-e93d-4f57-9b58-327251efb78d/linked_in_profile',
    },
    {
      id: 'azure-ai-apps-agents',
      name: 'Microsoft Certified: Azure AI Apps and Agents Developer Associate',
      issuer: 'Microsoft',
      kind: 'Certification',
      date: '2026-08',
      url: 'https://learn.microsoft.com/en-us/users/jigneshmotwani/credentials/1b9df31636335d00',
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
      name: 'Undergraduate Merit Scholarship (Global Merit Scholar)',
      issuer: 'SUTD',
      kind: 'Scholarship',
      date: '2021–2025',
    },
    {
      id: 'best-ml-project',
      name: 'Best Student Project Award, Machine Learning',
      issuer: 'SUTD',
      kind: 'Award',
      date: '2023',
      description: 'Top prize among 50+ teams for a sentiment analysis system using a third-order HMM with Viterbi decoding.',
    },
    {
      id: 'splash-awards',
      name: 'Splash Awards 2023, Finalist',
      issuer: 'Singapore Computer Society',
      kind: 'Competition',
      date: '2023',
      description: 'One of 15 finalists out of 115 teams.',
    },
    {
      id: 'singtel-honourable-mention',
      name: 'Honourable Mention, Singtel x SUTD Information Systems & Programming Merit Award',
      issuer: 'SUTD × Singtel',
      kind: 'Award',
      date: '2023',
      description: 'For Voluntr, an Android app for community volunteering (SGD 1,500 prize, 200+ students).',
    },
    {
      id: 'ideatesomething',
      name: 'IdeateSomething 2021, Winner',
      issuer: 'Venture, Innovation & Entrepreneurship SUTD',
      kind: 'Competition',
      date: '2021',
      description: 'MEETup, an app that connects like-minded people; won against 10 teams with $1,000 in funding.',
    },
    {
      id: 'baby-shark-fund',
      name: 'Baby Shark Fund Award',
      issuer: 'Venture, Innovation & Entrepreneurship SUTD',
      kind: 'Award',
      date: 'TODO: year',
    },
    {
      id: 'lenor-pitches',
      name: 'Lenor AI pitch awards',
      issuer: 'Social Ignition, Ground Zero, Hult Prize',
      kind: 'Competition',
      date: '2023–2024',
      description: 'Social Ignition Pitch 2023, 2nd place; Ground Zero 2024, Best Pitch; Hult Prize Mumbai 2024 Summit, finalist.',
    },
  ],

  activities: [
    {
      id: 'tencent-hackathon',
      name: 'Tencent Hackathon 2026',
      role: 'Participant, FinTech track (Aspire)',
      date: '2026',
      description: 'Built ROSS, a permission-aware knowledge and agent platform, with a teammate.',
    },
    {
      id: 'temasek-genai-hackathon',
      name: 'Temasek GenAI Hackathon 2024',
      role: 'Team lead',
      date: '2024',
      description: 'Built EmergenAI, a Streamlit app on Azure OpenAI for document-driven market research.',
    },
    {
      id: 'sia-appchallenge',
      name: 'Singapore Airlines AppChallenge 2023',
      role: 'Team member',
      date: '2023',
      description: 'Built a GenAI travel planner on the OpenAI API in a 4-person team.',
    },
    {
      id: 'hacksingapore',
      name: 'HackSingapore 2023',
      role: 'Participant',
      date: '2023',
      description: 'Team project BrewLogi, an event food and drink ordering app.',
    },
    {
      id: 'brainhack',
      name: 'Brainhack CODE_EXP 2022',
      role: 'Participant',
      date: '2022',
      description: 'Week-long hackathon: a React Native app that streamlined SAF personnel check-in and check-out.',
    },
    {
      id: 'marketwatch',
      name: 'SUTD MarketWatch Club',
      role: 'Technology Lead',
      date: '2023',
      description: "Led the team building the club website's frontend and backend.",
    },
    {
      id: 'gdsc',
      name: 'Google Developer Student Club, SUTD',
      role: 'Senior Project Member',
      date: '2023–2025',
      description: 'Senior project member from Oct 2023.',
    },
    {
      id: 'sports-rep',
      name: 'Sports Representative of SUTD',
      role: 'Sports Representative',
      date: '2022–2023',
      description: 'Liaison between 38 sports clubs and the co-curricular office; organised a mixed martial arts competition.',
    },
    {
      id: 'athletics',
      name: 'SUTD Athletics Club',
      role: 'Treasurer',
      date: '2022–2023',
      description: 'Ran weekly training and the club finances; hosted SUTD Virtual Run 2022 with 300+ participants.',
    },
  ],

  notes: [
    {
      id: 'about',
      title: 'About me',
      date: '2026-10-29',
      body: `# About me

I'm **Jignesh**, an AI Engineer on the Data & AI team at **Keppel Technology Solutions** in Singapore, and a 2025 Computer Science and Design graduate of **SUTD** (Honours with Merit, minor in AI).

I build RAG and multi-agent systems on AWS, Azure and GCP, and I like owning a product end to end: talking to the people who use it, designing it, and shipping it.

## What I work on
- **K2**, an enterprise AI agent platform used by 300+ employees, which I lead as product owner and architect
- An **AIOps platform** for incident, compliance and change management, sold to enterprise clients
- **GenAI solutions** for 10+ enterprise clients: RAG assistants, agentic workflows, voice AI and computer vision

## Before Keppel
- Grew FireJet's Figma-to-code platform from 30k to 60k users
- Built QuantumNFT end to end as pQCee's sole developer
- Led development at the education AI startup Lenor AI
- Taught 300+ students as an Algorithms TA

## Outside work
Basketball, running, cycling, photography, solo travel and chess.`,
    },
    {
      id: 'journey',
      title: 'My journey',
      date: '2026-10-29',
      body: `# My journey

## 2013–2021 · School in India
CBSE 10th at Global Indian International School, then HSC (Computer Science) at Narayana Junior College with a **98%** grade.

## 2021 · SUTD
Started Computer Science and Design at SUTD as a **Global Merit Scholar**. Won **IdeateSomething 2021** with MEETup, and joined computer vision research on animal behaviour.

## 2022 · First industry taste
Interned at **Sony Electronics Asia Pacific**: Adobe Analytics across three countries' websites and omnichannel chatbot research. Built an SAF check-in app at **Brainhack CODE_EXP**.

## 2023 · Startups, Web3 and awards
Joined **pQCee** and built **QuantumNFT** solo, from v0.1 to testnet. Lead developer at **Lenor AI**. Won the **Best Student Project Award** in Machine Learning and an **Honourable Mention** from Singtel for Voluntr.

## 2024 · Algorithms and design-to-code
TA for **50.004 Algorithms** (300+ students). Summer at **FireJet**, helping grow the Figma-to-code platform from 30k to 60k users. Led a team at the **Temasek GenAI Hackathon**.

## 2025 · Graduation
Graduated with **Honours with Merit** and a minor in AI. Built **KIORA**, a dialysis-care platform on AWS, for Kiora Care.

## 2026 · AI engineering
Joined **Keppel Technology Solutions** as an **AI Engineer**: leading **K2** and building an AIOps platform. Earned the **AWS Certified Generative AI Developer – Professional** and Microsoft Azure AI certifications. Built **ROSS** at the Tencent Hackathon and **Budwood** on the side.`,
    },
    {
      id: 'now',
      title: 'Now',
      date: '2026-10-29',
      body: `# Now

- **Work:** AI Engineer at Keppel Technology Solutions, leading K2 and co-developing an AIOps platform
- **Building:** Budwood, a Rust VCS for huge monorepos
- **Recently:** ROSS, a permission-aware knowledge and agent platform (Tencent Hackathon 2026)
- **Certified:** AWS Certified Generative AI Developer – Professional (Oct 2026); Microsoft Azure AI Apps and Agents Developer Associate (Aug 2026)`,
    },
    {
      id: 'this-site',
      title: 'About this site',
      date: '2026-10-29',
      body: `# About this site

This portfolio is a small operating system written in **React + TypeScript** and bundled with **Vite**.

- Laptops get a macOS-style desktop, phones get an iOS-style home screen
- All content comes from one file: \`src/data/content.ts\`
- "Ask Jignesh" streams answers from an LLM through a rate-limited Vercel Function (ai&), and falls back to keyword search when offline
- Games: Tetris and Chess (alpha-beta search in a Web Worker)

Source: [github.com/Jigneshmotwani/portfolio](https://github.com/Jigneshmotwani/portfolio)`,
    },
  ],

  albums: [
    {
      id: 'projects',
      name: 'Projects',
      photos: [
        { id: 'p-k2', src: 'cover:k2', caption: 'K2: enterprise AI agent platform' },
        { id: 'p-chord', src: 'cover:chord', caption: 'P2P file sharing on the Chord DHT' },
        { id: 'p-sign', src: 'cover:sign-language', caption: 'Live Sign-Language Translation' },
        { id: 'p-kiora', src: 'cover:kiora', caption: 'KIORA: dialysis-care platform' },
        { id: 'p-ross', src: 'cover:ross', caption: 'ROSS: permission-aware agent platform' },
        { id: 'p-budwood', src: 'cover:budwood', caption: 'Budwood: VCS for huge monorepos' },
        { id: 'p-quantumnft', src: 'cover:quantumnft', caption: 'QuantumNFT: quantum coding challenges as NFTs' },
        { id: 'p-emotion', src: 'cover:emotion-music', caption: 'Emotion Detection from Music' },
        { id: 'p-emergenai', src: 'cover:emergenai', caption: 'EmergenAI: Temasek GenAI Hackathon' },
        { id: 'p-metro', src: 'cover:metro-pass-planner', caption: 'Japan Metro Pass Planner' },
        { id: 'p-zen', src: 'cover:zen-pod', caption: 'Zen Smart Resting Pod' },
        { id: 'p-voluntr', src: 'cover:voluntr', caption: 'Voluntr: volunteering made easy' },
        { id: 'p-sentiment', src: 'cover:sentiment', caption: 'Sentiment Analysis (Best Student Project)' },
        { id: 'p-malloc', src: 'cover:malloc-melee', caption: 'Malloc Melee: roguelike RPG in C' },
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
    { title: 'AWS GenAI cert', url: 'https://www.credly.com/badges/79e406e1-e93d-4f57-9b58-327251efb78d/linked_in_profile', glyph: '☁️', color: '#FF9900' },
    { title: 'P2P File Sharing', url: 'https://github.com/Jigneshmotwani/File-Sharing-System-Chord-50.041', glyph: '🔗', color: '#0EA5E9' },
    { title: 'Budwood', url: 'https://github.com/Jigneshmotwani/Bud', glyph: '🌱', color: '#16A34A' },
    { title: 'ROSS', url: 'https://github.com/Jigneshmotwani/Tencent-AI-2026', glyph: '🧠', color: '#4F46E5' },
    { title: 'Old portfolio', url: 'https://jigneshmotwani.github.io/personal-portfolio/', glyph: 'JM', color: '#7C3AED' },
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
      'What did he build at Keppel?',
      'What cloud platforms has he worked on?',
      'Tell me about K2',
      'What is his hardest project?',
      'What did he do at FireJet?',
      'Which certifications does he have?',
    ],
    unknownAnswer: "I don't have that info — try Mail to ask him directly.",
    // The Vercel function in api/chat.ts, relative to the site root. VITE_ASSISTANT_API_URL overrides it.
    apiUrl: 'api',
  },

  // The one-page resume. Mirrors public/resume.pdf (your own PDF); keep the two in step.
  resume: {
    education: [
      {
        id: 'sutd',
        bullets: [
          'Bachelor of Engineering in **Computer Science and Design**, Honours with Merit',
          '**Minor in Artificial Intelligence**, Specialization Tracks: Data Analytics, Financial Technology',
          '**Awards & Leadership:** Undergraduate Merit Scholarship; Best Student Project Award, SUTD Machine Learning (third-order HMM + Viterbi, top of 50+ teams); Teaching Assistant, SUTD Algorithms (300+ students)',
        ],
      },
    ],
    skills: [
      { label: 'Languages', items: 'Python, TypeScript, JavaScript, Java, Golang, C++, SQL' },
      {
        label: 'AI & GenAI',
        items: 'LLMs, RAG, Agentic AI & Multi-Agent Systems, Fine-tuning (LoRA/PEFT), LLM Evaluation, Computer Vision, PyTorch, LangGraph, LangChain, MCP',
      },
      {
        label: 'AI Platforms & LLMOps',
        items:
          'AWS Bedrock (AgentCore, Knowledge Bases), Gemini Enterprise Agent Platform (Vertex AI), Azure AI Foundry, LiteLLM, Langfuse, OpenTelemetry, OPA, pgvector',
      },
      { label: 'Technologies & Tools', items: 'React, Node.js, FastAPI, Docker, Kubernetes, Terraform, PostgreSQL, AWS, Azure, GCP, GitLab CI/CD' },
    ],
    experience: [
      {
        id: 'keppel',
        bullets: [
          'Lead a 6-person engineering team on K2, an enterprise AI agent platform used by **300+ employees**, as its **product owner and architect**; review and merge code and deploy via GitLab CI/CD to UAT and production on Kubernetes.',
          "Build K2's platform-agnostic **agent lifecycle and governance**: generate, sandbox-test, certify and release Python (Strands) agents, today on AWS Bedrock AgentCore, with OPA policy gates, LiteLLM budgets and Langfuse tracing.",
          'Co-develop an **AIOps platform** for incident, compliance and change management on AWS and Azure, **sold to multiple clients**: correlates alerts, suggests root causes via RAG over runbooks and applies human-approved fixes with rollback.',
          'Own its service graph, compliance auto-fixes, CVE handling and ServiceNow integration, against MVP targets of **50%+ less alert noise**, 80%+ top-3 root-cause accuracy and **under $1** of AI cost per incident.',
          'Deliver GenAI solutions directly with enterprise clients (**10+ to date**) on AWS Bedrock, Azure AI Foundry and Gemini Enterprise Agent Platform: RAG assistants, agentic workflows, voice AI and computer vision, with **LLM-as-judge evals**.',
        ],
      },
      {
        id: 'firejet',
        bullets: [
          'Developed and optimized a one-click **Figma-to-code converter** (React, Vue and Tailwind output) in TypeScript and Node.js, helping grow platform users **from 30k to 60k**.',
          'Integrated design-to-code engine improvements into the new Website-to-Figma product, focusing on output accuracy; it reached **5k users in its first month**.',
          "Used Supabase, RESTful APIs and custom algorithms to improve design-to-code conversion across FireJet's products.",
        ],
      },
      {
        id: 'pqcee',
        bullets: [
          'As **sole developer**, built **QuantumNFT** end to end: a Web3 platform on Bubble where developers showcase quantum programming skills through NFT-based coding challenges ("Kaggle for Quantum Programming").',
          'Wrote custom **JavaScript plugins** for Bubble that convert quantum circuits into uniquely minted NFTs, with MetaMask wallet integration.',
          'Took the platform from **v0.1 to v0.6 and onto testnet** through agile iterations with test-driven development.',
        ],
      },
    ],
    projects: [
      {
        id: 'chord',
        bullets: [
          'Built a **distributed peer-to-peer file sharing system** from scratch in Golang with no external libraries, on the Chord DHT protocol with consistent hashing for file storage and retrieval.',
          'Handled fault tolerance, including **Byzantine faults**, dynamic node joins and departures, and simultaneous failures.',
        ],
      },
      {
        id: 'sign-language',
        title: 'Live Sign-Language Translation using Computer Vision',
        bullets: [
          '**Led a team of 4** to build real-time sign-language-to-text translation with computer vision and Google MediaPipe, reaching **99.5% accuracy**.',
          'Developed the hybrid Point-CNN and PointNet deep learning model behind the translation.',
        ],
      },
      {
        id: 'kiora',
        title: 'Kiora Care',
        bullets: [
          '**Architected and built KIORA**, a healthcare platform for patients, doctors and clinics to manage dialysis (CAPD) sessions, vitals, medications, inventory and appointments.',
          'Built with FastAPI, Node.js, React and PostgreSQL in Docker, deployed on AWS (ECS/Lambda, RDS, S3) with role-based access control and notifications.',
        ],
      },
    ],
    certifications: ['aws-genai-pro', 'azure-ai-apps-agents'],
  },
}

export default content
