# Assumptions & open questions

I built this without stopping to ask questions. This file lists every guess I made. Fix anything here in
`src/data/content.ts` (all content lives there) and remove the matching line.

## Where the content came from

| Source | What it gave |
|---|---|
| LinkedIn profile export (`Profile.pdf`, Oct 2026) | Headline, summary, all experience entries and dates, education, certifications, honors, top skills |
| Previous site (`jigneshmotwani.github.io/personal-portfolio`) | Project descriptions, skills list, award years, profile photo, HSC grade (98%) |
| Public GitHub repos (`github.com/Jigneshmotwani`) | ROSS (Tencent Hackathon 2026) and Budwood READMEs, repo list for the GitHub app's offline cache |

LinkedIn itself blocks automated access, so the PDF export was the only LinkedIn source.

## Missing info: marked with `TODO:` placeholders

These strings start with `TODO:` in `content.ts`. While `site.showPlaceholders` is `true` they show with a
dashed yellow outline. Set it to `false` to hide them. The resume and the AI assistant always ignore them.

- **Keppel Technology Solutions**: what you build there (2–3 highlight bullets) and the tech stack. LinkedIn
  has no description for this role, so the assistant answers "What did he build at Keppel?" with your title
  and start date and then says it doesn't have the details.
  - Hint: your repo `IT_SUPPORT_BOT_Servicenow-Backup` (Feb 2026) looks like Keppel work. I did not assume it.
- **Kiora Care**: highlights, tech stack, location, employment type.
- **Certification dates** for Azure AI Apps and Agents Developer Associate and AWS Certified Generative AI
  Developer – Professional, plus credential URLs.
- **IdeateSomething 2021 (Winner)**: organiser and a one-line description.
- **Sentiment Analysis project**: one line on the model/approach.
- **profile.openTo**: what kinds of roles or conversations you're open to.
- **profile.languages**: languages you speak besides English.

## Judgement calls

- **Phone number**: your old site listed `+65 9297 5323`. I left `contact.phone` empty so it isn't published
  again. Add it back if you want it on the contact card.
- **LinkedIn URL**: the old site linked `linkedin.com/in/jignesh-motwani`. Your export says
  `linkedin.com/in/jigneshmotwani`, so I used that.
- **Award years**: "Best Machine Learning Project" and the Singtel × SUTD "Honourable Mention" use 2022, the
  year your old site gave. A public post suggests the Honourable Mention ceremony was in 2023.
- **Best ML Project ↔ Sentiment Analysis**: I linked them based on a public LinkedIn snippet saying the
  sentiment-analysis module project won the award.
- **Employment types**: none are shown for Keppel or Kiora Care. FireJet, pQCee and Sony are marked
  "Internship". LinkedIn calls FireJet "Full Stack Algorithms Engineer" without "Intern", but the old site said
  "Intern".
- **Activities**: the Tencent Hackathon 2026, HackSingapore 2023 (BrewLogi) and SUTD MarketWatch are inferred
  from GitHub repos. Your old site also had logos for GDSC SUTD, Athena EduAI, Ground-Up Initiative and Udemy
  but never said what they were for, so I left them out.
- **"Currently building"** shows **Budwood**, your most recently updated repo. Change `currentlyBuilding` to
  update the desktop widget.
- **Company logos**: I used coloured monogram tiles instead of company logos (trademark-safe). Add a `logo`
  path to any experience entry to use a real image.
- **Project images**: the old site used stock photos. Projects now get generated cover art until you add
  real screenshots (`screenshots: ['projects/ross-1.png']`, files in `public/projects/`).
- **"Tetris"**: named as you asked. The name is a trademark of The Tetris Company, which has filed takedowns
  against clones. Rename it in `src/apps/registry.ts` (e.g. "Blocks") if you'd rather not take that risk.
- **Apple look-alike**: the UI imitates macOS/iOS, but every icon, wallpaper and logo is original. The
  Apple logo is replaced by a "j" mark. App names (Finder, Safari, …) are the ones you specified.
- **Breakpoint**: below 768px wide you get iOS, at 768px and above you get macOS. That means iPads get macOS.
- **Boot / lock screens** show once per browser session. Reloading in the same tab goes straight to the
  desktop or home screen. Add `?skipboot` to any URL to skip them.
- **AI model and costs**: the proxy defaults to Claude Opus 5.5 at low effort, with short answers and
  per-visitor rate limiting. For a cheaper public bot set `ANTHROPIC_MODEL = "claude-haiku-5-5"` in
  `api/wrangler.toml`. See `api/README.md`.
- **Chess and Tetris share one Dynamic Island slot**: if both games run at once, the island shows whichever
  updated last.
