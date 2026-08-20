# CrisisBoard — Emergency Resource Coordination Dashboard

A browser-based dashboard for coordinating emergency requests (medical, food,
shelter, rescue, transport) during floods, fires, earthquakes, or other
mass-casualty events. Coordinators log incoming requests; the app automatically
scores and ranks them by priority so the most critical cases surface first.

Pure HTML / CSS / JS — no backend, no build step, no dependencies beyond
Google Fonts (loaded via CDN). Data lives in memory for the session.

## Run it

Just open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

- `index.html` — page structure (request form, stats bar, ranked board)
- `style.css` — all styling and design tokens
- `script.js` — priority scoring logic, rendering, event handlers
- `README.md` — this file

## Priority scoring

Defined in `calcPriority()` in `script.js`:

```
score = urgencyWeight × 0.62 + peopleAffectedScore × 0.32 + typeBoost
```

- **Urgency weight**: low = 25, medium = 55, high = 78, critical = 100
- **People affected score**: scaled 0–100, capped at 60 people
- **Type boost**: +6 for Medical/Rescue, +2 for Shelter, +0 for Food/Transport
- Final score is capped at 100

Adjust the `URGENCY_WEIGHT` and `TYPE_BOOST` constants at the top of
`script.js` to change the weighting.

## Core features

- Log a new request with location, people affected, assistance type, and urgency
- Requests are automatically scored and ranked highest-priority first
- Mark requests as resolved to move them out of the active list
- Live counters: active requests, resolved requests, people affected, top priority ID
