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

- `index.html` — page structure (auth screen, request form, stats bar, ranked board)
- `style.css` — all styling and design tokens
- `auth.js` — responder login, registration, and forgot-password logic
- `script.js` — priority scoring logic, rendering, event handlers
- `README.md` — this file

## Responder access

Before reaching the dashboard, a responder must log in.

- **Log In** — username + password.
- **Register** — full name, email, username, password, confirm password. New accounts
  land in an in-memory `responders` array (see `auth.js`).
- **Forgot password** — enter the email used at registration, then set a new password.
  No email is actually sent (there's no backend); it's a self-serve reset for demo purposes.
- A demo account is seeded so you can log in immediately: username `responder1`,
  password `demo123`.

**Note:** this is a session-only simulation for a hackathon prototype — passwords are
kept in plain JS memory, not hashed, and nothing persists once the tab is closed or
refreshed. Don't reuse this pattern for real credentials.

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
