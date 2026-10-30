# JigneshOS: Jignesh Motwani's portfolio

My portfolio as a small operating system you can actually use. Laptops and desktops get a macOS-style
desktop, and phones get an iOS-style home screen. The switch happens at 768px viewport width.

- **Live site:** https://jigneshmotwani.vercel.app/
- **Plain resume (for recruiters):** https://jigneshmotwani.vercel.app/resume/

## What's inside

| | macOS mode | iOS mode |
|---|---|---|
| Shell | Boot and login screens, menu bar, Dock with magnification, desktop folders and widgets | Lock screen, swipeable home screen with widgets, dock, Dynamic Island |
| Windows | Drag, resize, minimise, zoom, focus, open/close animations, Mission Control (F3 / Ctrl+↑) | Full-screen apps with zoom animations, swipe-up home gesture, App Switcher (swipe up and hold) |
| Search | Spotlight (⌘/Ctrl+Space or ⌘/Ctrl+K) | Pull down on the home screen |
| System | Control Center, Notification Center (click the clock), notification banners | Swipe down from top-right / top-left |
| Recruiter escape hatch | "Resume" button in the menu bar | "Resume" pill on the lock screen and in the status bar |

**Apps:** Finder/Files, Preview, Photos, Safari, Contacts, Mail, Terminal, GitHub, System Settings, Notes,
Chess (vs AI), Tetris, and **Ask Jignesh**, an AI assistant that only answers from my portfolio data.

## Editing the content

Everything (bio, experience, projects, skills, education, certifications, notes, photos, bookmarks, music,
assistant starter questions) lives in **one file: [`src/data/content.ts`](src/data/content.ts)**. The types
in [`src/data/types.ts`](src/data/types.ts) document every field.

- Strings starting with `TODO:` are placeholders for missing info. They show with a dashed outline until you
  set `site.showPlaceholders: false`. See [ASSUMPTIONS.md](ASSUMPTIONS.md) for what is still missing.
- Images go in `public/` and are referenced by relative path (e.g. `photos/profile.jpg`).
- The one-page resume (Resume button, `/resume/`, Preview) is the `resume` block at the end of
  `content.ts`. It mirrors `public/resume.pdf`, which is your own PDF. When you update your resume, replace
  that file and edit the `resume` block to match. `npm run resume:pdf` can instead generate the PDF from the
  HTML version, but it overwrites `public/resume.pdf`.
- Refresh the GitHub app's offline fallback with `npm run cache:github`.

## Develop

```bash
npm install
```

```bash
npm run dev
```

Useful URL flags while developing:

- `?skipboot` skips the boot, login and lock screens.
- `?open=chess` launches an app on load.
- `?harness=terminal` renders one app full-page with no shell around it.
- `#resume` opens the plain resume.

```bash
npm test          # unit tests (search, knowledge base, terminal, games)
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

## Deploy to Vercel

The site and the "Ask Jignesh" API deploy together as one Vercel project: the Vite build is the static
site, and [`api/chat.ts`](api/chat.ts) becomes the function at `/api/chat`.

1. Go to [vercel.com/new](https://vercel.com/new) and import the `Jigneshmotwani/portfolio` GitHub repo.
2. Set **Project Name** to `jigneshmotwani`, which gives the URL `https://jigneshmotwani.vercel.app`.
   Vercel reads `vercel.json`, so leave the framework (Vite), build command and output directory as detected.
3. Under **Environment Variables**, add `AIAND_API_KEY` with your key from
   [console.aiand.com](https://console.aiand.com/).
4. Click **Deploy**. Every push to the production branch redeploys; other branches get preview URLs.

To check the API after a deploy, open `https://jigneshmotwani.vercel.app/api/chat`. It should show
`"configured": true`.

If you deploy under a different URL, update `site.url` in `content.ts`; it's used for the resume share
link and social previews.

## Ask Jignesh (AI chat)

The chat calls [ai&](https://console.aiand.com/) through the Vercel function, so the API key never reaches
the browser. The function builds its system prompt from `content.ts`, answers only from that data,
validates input, and rate-limits each visitor. The code is in [`server/chatProxy.ts`](server/chatProxy.ts).

| Variable | Default | What it does |
|---|---|---|
| `AIAND_API_KEY` | (required) | Your ai& API key. |
| `AIAND_MODEL` | `google/gemma-4-31b-it` | Any model id from `https://api.aiand.com/v1/models`. |
| `AIAND_REASONING_EFFORT` | model default | For reasoning models, e.g. `none` or `low` for faster answers. |
| `ALLOWED_ORIGINS` | same origin only | Extra sites allowed to call the API, comma-separated, `*` wildcards (e.g. `https://*.vercel.app`). |
| `PER_MINUTE_LIMIT` / `PER_DAY_LIMIT` | `8` / `60` | Questions per visitor (IP) per minute / per day. |
| `DAILY_LIMIT` | `1500` | Questions per day across all visitors (`0` = unlimited). |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | unset | Optional. Shares the limits across all function instances. Add Upstash from the Vercel Marketplace and it sets these (or `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which also work). Without them, limits are kept per instance. |

Without a working API (no key, an outage, or a static host with no `/api`), the assistant answers from a
keyword search over `content.ts`. It never makes things up. Questions it can't answer get: *"I don't have
that info — try Mail to ask him directly."*

The function speaks the OpenAI Chat Completions format, so another compatible provider works by setting
`AIAND_BASE_URL` (default `https://api.aiand.com/v1`).

## Project structure

```
api/              Vercel Function entry: /api/chat
server/           Chat proxy: ai& streaming, validation, CORS, rate limiting (+ tests)
public/           Static files: wallpapers, profile photo, resume.pdf, icons
scripts/          resume PDF generator, GitHub cache refresher
src/
  apps/           One folder per app (finder, safari, mail, terminal, chess, tetris, assistant, ...)
  assets/         Original SVG app, folder and file icons
  components/
    macos/        Menu bar, Dock, window manager, Mission Control, boot/login
    ios/          Lock screen, home screen, Dynamic Island, app switcher, gestures
    shared/       Spotlight, Control Center, Notification Center, banners, app frame
    resume/       The plain one-page resume (overlay + /resume page)
  data/           content.ts (all content), knowledge base for the assistant, virtual file system
  lib/            launch(), sounds, fuzzy search, theme, helpers
  state/          Zustand stores: windows, iOS apps, settings, notifications, Dynamic Island
  widgets/        Clock + weather, GitHub contributions, "Currently building"
```

## Credits

All icons, wallpapers, chess pieces and sounds are original, made for this site. Sounds and music are
synthesised in the browser with Web Audio. Weather comes from [Open-Meteo](https://open-meteo.com/).
Contribution data comes from [github-contributions-api](https://github.com/grubersjoe/github-contributions-api).
