/**
 * Types for the portfolio content. You normally only edit `content.ts`;
 * this file just documents the shape so TypeScript can catch typos.
 *
 * Conventions used in content.ts
 * - Dates are "YYYY-MM" (or "YYYY") strings. `end: null` means "Present".
 * - Any string starting with "TODO:" is a placeholder for info that is still
 *   missing. Placeholders are shown with a dashed outline while
 *   `site.showPlaceholders` is true, hidden when it is false, and the
 *   "Ask Jignesh" assistant always treats them as unknown.
 * - Image paths without "http" are relative to the `public/` folder.
 */

export interface Profile {
  name: string
  firstName: string
  initials: string
  /** Short professional headline, e.g. "AI Engineer @ Keppel Tech". */
  headline: string
  /** One-line positioning statement used on the lock screen, resume, etc. */
  tagline: string
  location: string
  /** IANA timezone used by the clock widget. */
  timezone: string
  coordinates: { latitude: number; longitude: number }
  /** Profile photo, relative to public/. */
  photo: string
  /** About-me paragraphs (LinkedIn summary). */
  summary: string[]
  /** What kind of opportunities you are open to. */
  openTo: string
  interests: string[]
  /** Life outside work (shown in Notes and answered by the assistant). */
  hobbies: string[]
  languages: string[]
}

export interface Contact {
  email: string
  linkedin: string
  github: string
  githubUsername: string
  website?: string
  /** Leave empty to keep your phone number off the public site. */
  phone?: string
  /**
   * Optional form backend (e.g. https://formspree.io/f/xxxx). When set, the
   * Mail app POSTs messages there; otherwise it opens the visitor's mail
   * client with a pre-filled mailto: link.
   */
  formEndpoint?: string
}

export interface Experience {
  id: string
  company: string
  /** Optional sub-team / business unit. */
  team?: string
  role: string
  type?: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Research' | 'Teaching'
  start: string
  end: string | null
  location?: string
  summary: string
  highlights: string[]
  tech: string[]
  /** Monogram tile colour (used instead of a company logo). */
  color: string
  /** Optional logo image relative to public/ (overrides the monogram). */
  logo?: string
}

export interface Education {
  id: string
  school: string
  degree: string
  start: string
  end: string
  location: string
  details: string[]
  color: string
}

export interface ProjectLinks {
  github?: string
  demo?: string
  article?: string
}

export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  highlights: string[]
  tech: string[]
  tags: string[]
  year: string
  /** Where it came from: internship, hackathon, course, side project... */
  context: string
  role?: string
  links: ProjectLinks
  /** Set true only if `links.demo` can be shown inside an iframe. */
  embeddable?: boolean
  /** Generated cover art colours (used until real screenshots exist). */
  cover: { from: string; to: string; glyph: string }
  /** Real screenshots relative to public/, e.g. "projects/ross-1.png". */
  screenshots?: string[]
  featured?: boolean
  status: 'Active' | 'Shipped' | 'Prototype' | 'Archived'
}

export interface SkillGroup {
  id: string
  name: string
  items: string[]
}

export interface Credential {
  id: string
  name: string
  issuer: string
  kind: 'Certification' | 'Award' | 'Scholarship' | 'Competition'
  date: string
  description?: string
  url?: string
}

export interface Note {
  id: string
  title: string
  date: string
  /** Lightweight markdown: #/## headings, - bullets, **bold**, [links](url). */
  body: string
}

export interface Photo {
  id: string
  /** Image path relative to public/, or "cover:<projectId>" for generated project art. */
  src: string
  caption: string
  date?: string
}

export interface PhotoAlbum {
  id: string
  name: string
  photos: Photo[]
}

export interface Bookmark {
  title: string
  url: string
  /** Optional emoji/letter shown in the Safari favourites grid. */
  glyph?: string
  color?: string
}

export interface CurrentlyBuilding {
  title: string
  description: string
  stack: string[]
  link?: string
  /** 0..1, shown as a progress ring. Omit to hide. */
  progress?: number
  updated: string
}

export interface Track {
  title: string
  artist: string
  /** Generated in the browser with WebAudio; these tune the synth. */
  bpm: number
  root: number
  progression: number[][]
}

export interface AssistantConfig {
  name: string
  greeting: string
  starters: string[]
  /** Exact reply when the answer isn't in this file. */
  unknownAnswer: string
  /**
   * URL of the deployed AI proxy (see /api). Leave empty to use only the
   * offline keyword-search mode. VITE_ASSISTANT_API_URL overrides this.
   */
  apiUrl: string
}

export interface SiteConfig {
  title: string
  description: string
  /** Public URL of the deployed site (used for the resume share link). */
  url: string
  /** Resume PDF relative to public/. Regenerate with `npm run resume:pdf`. */
  resumePdf: string
  /** Show TODO placeholders with a dashed outline (turn off before launch). */
  showPlaceholders: boolean
  /** Seconds after the desktop loads before the welcome notification. */
  welcomeNotificationDelay: number
  welcomeMessage: { title: string; body: string; subject: string }
}

/** One entry on the one-page resume: an id from experience / projects / education plus its exact bullets. */
export interface ResumeEntry {
  id: string
  /** Heading override (defaults to the entry's own name / role). */
  title?: string
  /** Bullets as printed; wrap words in **double asterisks** to bold them. */
  bullets: string[]
}

/**
 * The one-page resume (overlay, /resume page, Preview). It mirrors the PDF in
 * public/resume.pdf, so keep the two in step when you edit either.
 */
export interface ResumeConfig {
  education: ResumeEntry[]
  skills: { label: string; items: string }[]
  experience: ResumeEntry[]
  projects: ResumeEntry[]
  /** Credential ids, in order. */
  certifications: string[]
}

export interface Content {
  site: SiteConfig
  profile: Profile
  contact: Contact
  currentlyBuilding: CurrentlyBuilding
  experience: Experience[]
  education: Education[]
  projects: Project[]
  skills: SkillGroup[]
  credentials: Credential[]
  activities: { id: string; name: string; role: string; date: string; description: string }[]
  notes: Note[]
  albums: PhotoAlbum[]
  bookmarks: Bookmark[]
  music: Track[]
  assistant: AssistantConfig
  resume: ResumeConfig
}
