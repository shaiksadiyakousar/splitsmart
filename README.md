# SplitSmart — Kawaii Expense Splitter 🌸

[Live Demo](https://splitsmart-sadiya.netlify.app)

## Description

A cute kawaii aesthetic expense splitter web app built with pure HTML, CSS and JavaScript. No frameworks, no backend, no installation needed.

## Features

- Add an expense title and total amount.
- Add participant names and split totals evenly per person.
- Dynamic participant count and quick number controls.
- Save calculated results to a searchable history.
- Responsive, single-page UI (works on desktop and mobile).
- Local storage to save all expense history.
- XSS protection for user inputs (basic sanitization before storage/display).

## Tech Stack

| Technology | Purpose |
| --- | --- |
| HTML5 | Markup and semantic structure |
| CSS3 | Kawaii pastel styling, responsive layout |
| Vanilla JavaScript | App logic, validation, UI updates |
| LocalStorage API | Persisting user history & theme preference |

## How to run

Just open `index.html` in browser — no installation needed.

Or run from a simple static server (optional):

```bash
# from the project root
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

## Security & Data

- LocalStorage is used for storing saved expenses and the user's theme preference locally in the browser.
- Basic XSS protection: user-provided text fields are sanitized before being persisted and rendered to mitigate script injection risks. For production use, consider stricter sanitization libraries.

## Project Structure

| File | Description |
| --- | --- |
| `index.html` | App markup and main UI elements |
| `style.css` | All styles (kawaii pastel pink/lavender theme) |
| `script.js` | Calculation logic, validation, storage, and DOM updates |

## 👩‍💻 Developer

**Shaik Sadiya Kousar**
B.Tech CSE — Narayana Engineering College, Nellore, Andhra Pradesh

**Live Project:** [https://splitsmart-sadiya.netlify.app](https://splitsmart-sadiya.netlify.app)

---

Made with 🌸 and pastel dreams
