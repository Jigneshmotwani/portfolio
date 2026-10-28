# JigneshOS: Jignesh Motwani's portfolio

My portfolio as a small operating system you can actually use. Laptops and desktops get a macOS-style
desktop, and phones get an iOS-style home screen. The switch happens at 768px viewport width.

- **Live site:** https://jigneshmotwani.github.io/portfolio/
- **Plain resume (for recruiters):** https://jigneshmotwani.github.io/portfolio/resume/

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
- After changing experience/education, regenerate the resume PDF with `npm run resume:pdf`.
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

## Deploy the site to GitHub Pages

The build uses relative URLs, so it works at `/portfolio/`, at a custom domain, or under any sub-path
with no config changes.

1. Push to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the tests, builds,
   and publishes `dist/`. The site appears at `https://<user>.github.io/<repo>/`.
4. Update `site.url` in `content.ts` if the URL differs; it's used for the resume share link and social
   previews.

## Deploy the "Ask Jignesh" AI proxy

The assistant calls an LLM through a small Cloudflare Worker in [`api/`](api), so the API key never
reaches the browser. The worker builds its system prompt from the same `content.ts`, limits answers to
that data, and rate-limits each visitor. Full steps are in [`api/README.md`](api/README.md):

```bash
cd api && npm install
```

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

```bash
npx wrangler deploy
```

Then point the site at it. Either set `assistant.apiUrl` in `content.ts`, or add a repository variable
`VITE_ASSISTANT_API_URL` (Settings → Secrets and variables → Actions → Variables), which the deploy
workflow passes to the build.

Without a proxy, or when it's down, the assistant answers from a keyword search over `content.ts`. It
never makes things up. Questions it can't answer get: *"I don't have that info — try Mail to ask him
directly."*

## Project structure

```
api/              Cloudflare Worker: LLM proxy with CORS, validation and rate limiting
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
