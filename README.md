# Typing Test

A clean, distraction-free typing test for professionals. No character highlighting, no follow-along cursor — you read the passage and type from memory, just like a real typing assessment.

**Features**
- 30s, 1m, and 3m timed modes
- 65 curated passages from public domain literature (Doyle, Carroll, Wells, Baum, Burroughs, Stoker)
- Passages sized to match each time mode (~50 WPM target)
- Smart seen-tracking — cycles through every passage before repeating
- Live WPM and accuracy in the header
- Light and dark mode (follows system preference, toggle in header)
- Fully responsive down to mobile
- Zero dependencies, no build step, no frameworks

---

## Running standalone

Just open `index.html` in any modern browser. No server required.

```
open index.html
```

Or serve it locally with Python:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Running with Docker

### Build and run

```bash
docker build -t typing-test .
docker run -p 8080:80 typing-test
```

Then open [http://localhost:8080](http://localhost:8080).

### Run in the background

```bash
docker run -d --name typing-test -p 8080:80 typing-test
docker stop typing-test
```

---

## File structure

```
typing-test/
├── index.html      # markup
├── style.css       # all styles + dark mode + responsive
├── passages.js     # 65 curated passages in 3 pools (30s / 1m / 3m)
├── app.js          # game logic, seen-tracking, dark mode toggle
├── Dockerfile
└── nginx.conf
```

---

## License

Public domain. Do whatever you want with it.

Passage text is sourced from [Project Gutenberg](https://www.gutenberg.org) and is in the public domain.
