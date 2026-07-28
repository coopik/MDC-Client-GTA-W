# MDC Client

A plain desktop shell around the real GTA World Web MDC
(<https://mdc.gta.world/>). The site itself loads in an embedded browser view;
the surrounding menu bar, toolbar and status bar are ordinary HTML. The look is
deliberately unfashionable: system fonts, grey panels, square corners, the sort
of thing that has been running unchanged in a dispatch office since 2008.

The code carries no comments by design. Everything worth explaining lives here,
including the list of mistakes at the bottom that must not be repeated. Release
history is in `CHANGELOG.md`.

### How this was built, and what that means for you

This client does not talk to an API. It loads the real site and restyles it from
the outside, and every rule it applies was written against the actual page
source of the MDC: the markup of each dialog, table, form and toolbar was read
and matched selector by selector. Nothing here is guessed from a screenshot if
the source was available.

That also sets the limits of the app. **Supervisors and high-ranking officers
should expect some features to be rough or plainly broken.** Those ranks see
views, panels and dialogs that are not visible to the account this was built
with, so their page source could not be obtained and none of it could be tested
or styled. Anything behind a supervisory permission is unstyled at best and
misaligned at worst. If you have access to those pages, send the page source of
the screen that looks wrong and it can be fixed the same way as everything else.

### Pages

Several MDC pages can be open at once. The strip under the tabs is captioned
`PAGES` and lists them, `+` opens another, the cross closes one, Ctrl+T and
Ctrl+W do the same from the keyboard, and anything the site opens in a new
window arrives as a new page. Each page is a separate view, so a record keeps
its scroll position and any half-filled form while you work in another one.

Right-click opens things as a new page: a navigation chip such as Emergency Map,
a quick shortcut, or any link on the page itself, such as a person's record or a
warrant. Left-click still navigates the page you are on.

Each entry is named after what it holds — its navigation entry, or the record
number — rather than the site's own page title, which is "Mobile Data Computer"
on nearly every screen.

---

## 1. Running from source

Node.js 18 or newer on Windows.

```
npm install
npm start
```

The first launch shows the GTA World UCP sign-in page. Log in there exactly as
you would in a browser. Cookies persist, so you stay logged in across restarts.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Run the app from source |
| `npm run smoke` | Syntax-check every script, then run the renderer against a fake DOM |
| `npm run pack` | Build the application folder into `dist/win-unpacked` |
| `npm run dist` | Build an electron-builder NSIS installer |
| `npm run icon` | Regenerate `build/icon.ico` and `build/icon.png` (needs Python + Pillow) |

Run `npm run smoke` after any renderer change. It parses the real
`renderer/index.html`, executes `renderer/renderer.js` against a hand-built DOM
stub, and fails on a syntax error, an unresolvable element id, an unwired menu
label or item, or a menu that will not open and close. A renderer that throws on
load silently kills the entire menu bar, which is exactly how it shipped once.

## 2. Packaging

`npm run pack` writes `dist/win-unpacked/`, containing `MDC Client.exe` plus the
Electron runtime and a `resources/` folder. That folder is the input for an
installer; `installer/mdc-client.iss` is a ready Inno Setup script that packages
it. Keep `AppVersion` in the script in step with `version` in `package.json`.

---

## 3. Layout

```
main.js               window, persistent session, tray, IPC
preload.js            small bridge for the shell window
webview-preload.js    runs inside the MDC page: skin, fixes, side panel toggle
renderer/
  index.html          menu bar, toolbar, find bar, status bar, dialog
  style.css           the shell chrome only
  renderer.js         all shell behaviour
  sounds/             click.mp3, close.mp3, error.mp3
build/                application icon (.ico and .png)
installer/            Inno Setup script
tools/
  smoke.js            runtime test for the renderer
  mk_icon.py          regenerates the icon
```

---

## 4. Sign-in and privacy

The application never asks for, stores, or transmits your UCP password. You log
in through the embedded page itself. Cookies live in the persistent session
partition `persist:gtaw-mdc`, under a **fixed** folder,
`%APPDATA%\gtaw-mdc-client`.

That folder is pinned in `main.js` and must stay pinned. Electron derives its
data folder from the application name by default, so renaming the product once
silently pointed the session at an empty folder, discarded the saved login, and
produced a page that looked broken but was simply logged out. An older folder
from a previous name is copied across once if found.

File > Sign Out clears the session on request. Uninstalling leaves the folder
alone, so reinstalling does not force a fresh login; delete it by hand to sign
out completely.

---

## 5. Features

### Skins

| Skin | Notes |
| --- | --- |
| Classic Light | Grey panels, square corners, the default |
| Classic Dark | Same geometry, dark palette |
| Original MDC | No styling at all; the site as it ships |

Switch from View, from Tools > Options, or press F8 to cycle. **Sign-in pages are
never skinned** - the skin only applies on `mdc.gta.world`, so the UCP login and
the Google sign-in screen render completely stock.

Skin details worth knowing:

- The WANTED bar is painted a flat red bar across the full width of its panel,
  with a short fixed line height so it never grows into a tall block.
- The Criminal Points strip and the Age field have their fill and border removed
  so they read as plain text.
- Text wrapped in double asterisks, the `/me` emote convention, renders in
  italic purple wherever it appears in a record.
- Sidebar rows change neither text colour nor background on hover.
- Only the text inside double asterisks is coloured; the asterisks themselves are
  hidden, and the original characters are restored with the Original MDC skin.

### Side panel

The MDC's own left navigation panel can be hidden to gain width: the **Side
Panel** button on the toolbar, View > MDC Side Panel, F10, or Tools > Options.
The choice persists, survives navigation, and works with the skin off.

### MDC search boxes

The site's own Search Person and Search Vehicle fields can be hidden from
Tools > Options > Layout. The shell's own name and plate lookups keep working
while they are hidden, because they drive those same fields.

### Sounds

Off by default; enable in Tools > Options > Sounds. Three short samples live in
`renderer/sounds`: `click.mp3` for clicks and navigation, `close.mp3` for
closing a dialog, dismissing a notification or going back, and `error.mp3` for
failed actions, failed page loads and error messages from the site. Replace the
files to change the sounds; the names are fixed.

### Penal Code tab

The window has two tabs above the page area: Mobile Data Computer and Penal Code
(Ctrl+1 and Ctrl+2, also under View). The Penal Code tab loads the San Andreas
Penal Code topic from the GTA World forums and strips it down to the code text
itself: no forum header, navigation, breadcrumbs, footer, author panels, post
controls, reactions, pagers or profile links. Headings, tables and quotes are
redrawn in the same skin as the rest of the app, and the dark skin applies here
too.

The forums need their own sign-in, which happens in the tab exactly as it would
in a browser; no forum credentials are stored. Until you are signed in the forum
page renders stock, unskinned, so the login form behaves normally. Sign Out of
Forums in the Penal Code bar clears only forum cookies and leaves the MDC session
signed in.

The Search penal code box filters as you type: sections that do not contain the
text are hidden and the remaining matches are highlighted, with a count in the
status bar. Clear restores every section.

### Notification area (tray)

Off by default; enable in Tools > Options > Window. When on, minimizing or
closing leaves the application running with a tray icon. Click the icon to
restore, or use its Exit command to quit. When off, the window behaves normally.

### Keyboard

| Key | Action |
| --- | --- |
| F5 | Reload |
| F3 | Find next |
| F8 | Cycle skin |
| F9 | Address bar |
| F10 | Show/hide the MDC side panel |
| Ctrl+F | Find on page |
| Ctrl+N / Ctrl+L | Name check / plate check |
| Ctrl+P | Print |
| Ctrl +, Ctrl -, Ctrl+0 | Zoom in, out, reset |
| Alt+Left / Alt+Right | Back / forward |
| Esc | Close menu, find bar or dialog; otherwise stop loading |

### Diagnostics

Tools > Layout Report prints the window size, the embedded view size, the page
viewport and document size, the ratio between them, and any element taller than
the viewport. Fastest way to tell a shell sizing problem from a page problem.

---

## 6. Rules learned the hard way

Each of these caused a visible bug. They are recorded here because the code no
longer carries comments.

1. **Never put `inherit` in a `font-family` list.** It is invalid and voids the
   whole declaration, which turned every icon into an empty square.
2. **Never apply a blanket `transition: none` or `animation: none`.** Bootstrap
   drives expand/collapse from transition events; removing them leaves panels
   stuck open.
3. **`transition: revert` is not an escape hatch.** It reverts to the browser
   default and discards the author transition. Always give an explicit duration.
4. **Never freeze a property Bootstrap animates.** With no value change there is
   no `transitionend`, the internal transitioning flag stays set, and every
   later show call returns early.
5. **Never give `.modal` a background.** It is the full-viewport container; the
   visible panel is `.modal-content`. Painting the container greys out the whole
   window and swallows clicks, which is why file uploads appeared to do nothing.
6. **Leave `input[type="file"]` and cropper widgets unstyled** (`all: revert`).
7. **The sidebar's active row must not be white on blue,** sidebar icons must
   never inherit the panel colour, and hover must change nothing but the cursor.
8. **Do not duplicate MDC functionality.** The page already has Search Person
   and Search Vehicle boxes; the shell drives those instead of adding its own.
9. **Never force `height` or `overflow` on `html`, `body` or `.wrapper`.**
   Material Dashboard derives its layout from them; forcing them crammed the
   page into a sliver. Scrollbar duplication is fixed at runtime by measuring.
10. **Never set `display` on the embedded view, and never anything but `flex`.**
    Electron gives `webview` `display: flex` so its internal frame fills the
    element. Overriding it with `block` left the frame at its intrinsic 150px
    height, so the whole page rendered in a short strip at the top of the window
    with its own scrollbar. Width filled correctly throughout, which is what
    made it look like a page bug. `renderer.js` also sets explicit pixel sizes
    as a safety net.
11. **Do not un-cap image sizing.** Removing the site's `max-height` from images
    let the state seal render at natural size and inflated the document to
    several screens tall.
12. **Only skin the MDC host.** Authentication pages must render stock.
13. **Never use backticks in a comment inside a JavaScript template literal.**
    It terminates the literal and breaks the file. Moot now: no comments.
14. **When the markup is unknown, target by content, not by class.** The WANTED
    banner, the Criminal Points meter, the Age field and the Message of the Day
    colour pickers were guessed at with `:has()` selectors for three rounds and
    missed every time. They are now found by their own text, walking up only
    through wrappers containing nothing else, and every change is recorded on
    the element so the Original MDC skin restores it.
15. **`node --check` is not enough.** Only a runtime test catches a renderer
    that throws on load. Run `npm run smoke`.
16. **Contrast is enforced at runtime,** because inline colours from the site
    can be unreadable on a repainted background.
17. **Give dialog fields one fixed height, but never buttons.** Fields look
    right at a fixed height. Buttons need a minimum height instead: forcing an
    exact height pushed dropdown carets outside their box, where they also
    swallowed the click.
18. **Never set a notification container's position.** The library places it
    itself. Overriding that dropped each toast into page flow, so it appeared
    half off-screen, sometimes scrolled out of sight, and then timed out.
19. **Never hide a vertical scrollbar based on one measurement.** Content that
    grows later, such as added charges, is then clipped with no way to reach it.
    Only sideways scrollbars are trimmed, and only where content genuinely fits.
20. **Do not give `.dropdown-menu` visible overflow.** It stops long option
    lists from scrolling. Let the button group overflow instead.
21. **Never touch scrolling inside a dialog or a dropdown.** Both are managed by
    the site's own scripts, which size and scroll them at the moment they open.
    Every override here produced either extra scrollbars or option lists that
    could not be reached, so dialogs and dropdowns now keep their own scrolling
    and receive colour only.
22. **Never let a measuring pass toggle a property back and forth.** Hiding a
    scrollbar changes the measurement that decided to hide it, so the next pass
    reverses the decision and the element flickers and loses its scroll position.
    Decisions are made once per element per page load.
23. **Keep the scrollbar narrow and reserve its space.** A wide bar over a layout
    built for full width draws across the content beside it.
24. **Rate-limit sounds per tone, and never restart one that is still playing.**
    Repeated clicks on a button such as add-charge otherwise stack the same clip
    over itself.

21. Never set `max-height` or `overflow` on `.dropdown-menu`, `div.inner` or `.bootstrap-select`. bootstrap-select sizes and scrolls its own option list when it opens; any override produces a clipped list that cannot be scrolled.
22. Never add a scroller inside a Bootstrap dialog. The dialog already scrolls, and the site adds its own scroller, so a third one appears.
23. Never force `overflow: visible` on dialog containers. It looks harmless, but a container that scrolls natively will then let its rows spill out and be painted over by the block below it.
24. Prefer content-driven matching over element ids for optional UI. Field labels survive page changes; ids do not.
25. Some parts of the MDC must be left alone entirely. Add Arrest Report and Charges lays its rows out with Bootstrap's grid and absolute positioning; any change to button display or row alignment inside it breaks the charge rows. Recolour it, never re-layout it.
