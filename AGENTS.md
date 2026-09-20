# Agent Guide

## Project Shape

- This is a dependency-free vanilla HTML/CSS/JavaScript canvas game; there is no package manager, build step, test runner, or lint configuration.
- The browser entrypoint is `src/index.html`. Keep the classic-script order intact: `maze.js` defines maze globals, `game.js` defines game rules, `render.js` defines drawing, and `main.js` starts the loop.
- `src/js/game.js` mutates `game.grid` during play, while `MAZE` in `maze.js` must remain pristine so a new game can copy it.

## Development

- Run the game from a local HTTP server, not by opening the HTML file directly: `python3 -m http.server 8000 --directory src`, then open `http://localhost:8000`.
- There are no automated checks. Verify changes manually in the browser, including starting/restarting, arrow-key movement, dots/score, lives, win/loss overlays, and tunnel behavior when relevant.

## Workflow

- Feature work follows the repo-local spec-driven workflow in `.agents/skills/spec/SKILL.md`; implement only specs whose state is `Approved` using `.agents/skills/spec-impl/SKILL.md`.
- Prefer the existing global-function style unless a change deliberately updates the script loading and global boundaries in `src/index.html`.
