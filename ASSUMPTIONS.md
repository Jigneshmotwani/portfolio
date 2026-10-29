# Assumptions & open questions

I built this without stopping to ask questions. This file lists what is still missing and every guess I
made. Fix anything here in `src/data/content.ts` (all content lives there) and remove the matching line.

## Where the content came from

| Source | What it gave |
|---|---|
| "Jignesh Motwani — Master Resume" doc (Oct 2026) | The source of truth: Keppel (K2, AIOps, client work), every role and date, projects, skills, education, CCAs, achievements |
| One-page resume PDF (Oct 2026) | The resume shown in the app (`content.resume`) and the downloadable `public/resume.pdf` |
| LinkedIn profile export (Oct 2026) | Kiora Care role title and dates, the hand-gesture glove research role, Sony SAP work |
| Previous site (`jigneshmotwani.github.io/personal-portfolio`) | Profile photo, HSC grade (98%), older project wording |
| Public GitHub repos | ROSS and Budwood details, the GitHub app's offline cache |

## Rules I followed from the master resume

- Lines marked **confirm** are left out: the Claude audit-logging work, the ROSS result, the BrewLogi order
  count, and ShopliftSense (it has no end date or outcome yet).
- The "interview talking point, not for the resume" line and the Interview prep / To fill in sections are left out.
- Client names are left out ("name a client only when allowed"). Client builds are described at the
  resume's level: RAG assistants, agentic workflows, voice AI and computer vision.

## Missing info: marked with `TODO:` placeholders

These strings start with `TODO:` in `content.ts`. While `site.showPlaceholders` is `true` they show with a
dashed yellow outline. Set it to `false` to hide them. The resume and the AI assistant always ignore them.

- **Azure AI Apps and Agents Developer Associate**: month and year earned.
- **Baby Shark Fund Award**: year.
- **profile.openTo**: what kinds of roles or conversations you're open to.
- **profile.languages**: languages you speak besides English.

## Judgement calls

- **Phone number**: your resume PDF lists your mobile, and the PDF is the download, so it is public there.
  The site itself (Contacts, the HTML resume, the assistant) leaves it out because `contact.phone` is empty.
  Add it there if you want it everywhere.
- **Kiora Care** is shown as a project (KIORA), as in your master resume, not as a job. Its context line
  keeps the LinkedIn title and dates (Backend and Infra Engineer, Sep–Dec 2025).
- **Hand-gesture glove research** (Aug–Dec 2023) comes from LinkedIn; the master resume doesn't list it.
  Delete the `sutd-research` entry if you dropped it on purpose.
- **Teaching assistant dates**: Jan–May 2024, from the master resume. LinkedIn says Jan 2024 – Apr 2025.
- **Years the docs don't give**: Best Student Project Award and the Singtel Honourable Mention are dated 2023
  (Voluntr ran Jan–Apr 2023). Zen Smart Resting Pod is 2025, as a final-year capstone. Emotion Detection
  from Music is 2025 (repo activity). Sign-language translation, Malloc Melee and Metro Pass Planner use their
  repo years.
- **Budwood** isn't in the master resume, but it's your most active public repo, so it stays as "Currently
  building". Change `currentlyBuilding` to show K2 or something else.
- **Company logos**: coloured monogram tiles instead of company logos (trademark-safe). Add a `logo` path to
  any experience entry to use a real image.
- **Project images**: projects get generated cover art until you add real screenshots
  (`screenshots: ['projects/ross-1.png']`, files in `public/projects/`).
- **"Tetris"**: named as you asked. The name is a trademark of The Tetris Company, which has filed takedowns
  against clones. Rename it in `src/apps/registry.ts` (e.g. "Blocks") if you'd rather not take that risk.
- **Apple look-alike**: the UI imitates macOS/iOS, but every icon, wallpaper and logo is original. The Apple
  logo is replaced by a "j" mark. App names (Finder, Safari, …) are the ones you specified.
- **Breakpoint**: below 768px wide you get iOS, at 768px and above you get macOS, so iPads get macOS.
- **Boot / lock screens** show once per browser session. Reloading in the same tab goes straight to the
  desktop or home screen. Add `?skipboot` to any URL to skip them.
- **AI model and costs**: the proxy defaults to Claude Opus 5.5 at low effort, with short answers and
  per-visitor rate limiting. For a cheaper public bot set `ANTHROPIC_MODEL = "claude-haiku-5-5"` in
  `api/wrangler.toml`. See `api/README.md`.
- **Chess and Tetris share one Dynamic Island slot**: if both games run at once, the island shows whichever
  updated last.
