# PatrolOne Mobile Client

Version 1.1.3.

A plain desktop shell around the real GTA World Web MDC
(<https://mdc.gta.world/>). The site itself loads in an embedded browser view;
the surrounding menu bar, navigation and status strip are ordinary HTML.
PatrolOne default follows a dispatch-terminal reference: warm gray panels, compact
Tahoma text, illustrated desktop icons, black gloss headers and beveled
action buttons. PatrolOne Dark keeps that layout with charcoal panels, light text
and warm highlights. The three Aero variants retain their glass palettes.

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

Penal Code, DEPA (Drug Enforcement & Prevention Act of 2020) and SHAFT Act
(State Handling of All Firearms and Training Act of 2021) open the official
forum topics in separate tabs. All three share the selected skin and forum
session. Their search queries and page positions stay independent. The same
destinations are also available in the View menu.

Several MDC pages can be open at once. The strip under the tabs is captioned
`PAGES` and lists them, `+` opens another, the cross closes one, Ctrl+T and
Ctrl+W do the same from the keyboard, and anything the site opens in a new
window arrives as a new page. Each page is a separate view, so a record keeps
its scroll position and any half-filled form while you work in another one.

Right-click opens things as a new page: a navigation chip such as Emergency Map,
a recent record in the left rail, or any link on the page itself, such as a person's record or a
warrant. Left-click still navigates the page you are on.

Each entry is named after what it holds â€” its navigation entry, or the record
number â€” rather than the site's own page title, which is "Mobile Data Computer"
on nearly every screen.

### History

The status strip's History button, Tools > History, or Ctrl+H. Every page and record opened in the client is
logged with the time it was opened and what it was: a record and the subject's
name, a plate check, a warrant, an incident, a map. The list has its own search
box, which matches on name, plate, record number, address, page name and date,
so "which records did I run, and when" is answerable after the fact. Filter by
subjects/vehicles or incidents/warrants, or search all visits. Rows support
keyboard focus and Enter as well as left-click and right-click.

Left-click an entry to open it in the page in front, right-click to open it as a
new page. The log is held on this computer only, in the client's own storage,
and is never sent anywhere. Clear Session does not touch it; use Clear History
in that window, or turn logging off entirely under Tools > Options.

**Only log subjects and vehicles** sits under the History switch. With it on,
only records, name checks, plate checks, vehicles and warrants are kept;
dashboards, lists, maps and the penal code are skipped. It is greyed out while
history logging is off, since there would be nothing to narrow down.

### Recent records and alerts

The left rail holds the twelve most recently opened subjects, vehicles,
warrants, incidents and APBs, with duplicate addresses removed. It uses the
existing local History log. Click to return to an already open page, or reopen
that record in the current page; right-click opens another page. Search History
at the foot of the rail opens the full log. This replaces the duplicate site
navigation shortcuts. Disable the rail in Options, or turn off History logging
to stop adding visits.

History and Alerts live in the status strip, below the window controls. Alerts
shows the MDC's unread count and actual notification links and timestamps.
Opening the panel does not locally clear that count; the site owns read state.
The panel shows loading and empty states and dismisses on Escape, outside click,
page changes or navigation.

### Sounds

Off by default, under Tools > Options. Nine tones: click, navigation, opening a
page, closing a dialog or going back, a confirmation on copy, a notification
tone, a warning tone for restricted actions, an error tone for failures and MDC
error messages, and a start-up tone.

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
| `npm run smoke` | Syntax-check app and verification scripts, then run renderer and preference regressions against a fake DOM |
| `npm run verify` | Run isolated Electron navigation and skin fixtures, recording frame visibility and preview images |
| `npm run pack` | Build the application folder into `dist/win-unpacked` |
| `npm run dist` | Build an electron-builder NSIS installer |
| `npm run icon` | Regenerate `build/icon.ico` and `build/icon.png` (needs Python + Pillow) |

Run `npm run smoke` after every change. It parses the real
`renderer/index.html`, executes `renderer/renderer.js` against a hand-built DOM
stub, and fails on a syntax error, an unresolvable element id, an unwired menu
label or item, or a menu that will not open and close. A renderer that throws on
load silently kills the entire menu bar, which is exactly how it shipped once.

## 2. Packaging

`npm run pack` writes `dist/win-unpacked/`, containing `PatrolOne Mobile Client.exe` plus the
Electron runtime and a `resources/` folder. That folder is the input for an
installer; `installer/mdc-client.iss` is a ready Inno Setup script that packages
it. Keep `AppVersion` in the script in step with `version` in `package.json`.

`tools/Build-Inno.ps1` checks dependencies and UI regressions, rebuilds Windows
x64, locates Inno Setup 6/7 and compiles the installer. See
[RELEASE-COMMANDS.md](RELEASE-COMMANDS.md) for the exact VS Code PowerShell commands
to push source or rebuild the installer. The helper does not run the installer.

---

## 3. Layout

```
main.js               window, persistent session, tray, IPC
preload.js            small bridge for the shell window
webview-preload.js    runs inside the MDC page: skin, fixes, side panel toggle
renderer/
  index.html          menu bar, navigation, find bar, status bar, dialog
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
| PatrolOne default | Dispatch terminal layout: black icon bar, recent records rail, status strip, bottom action bar, black panel headers and red buttons |
| PatrolOne Dark | The Default layout with charcoal surfaces, light text, warm selection highlights and dark fields; printed documents keep their white paper style |
| Windows 7 Aero | The same dispatch layout in light glass, with rounded panels, blue focus glows and a matching window frame |
| Windows 7 Aero LAPD | The same dispatch layout in patrol navy glass |
| Windows 7 Aero Dark | The same dispatch layout in graphite glass |
| Original MDC | No styling at all; the site as it ships |

Switch from View, from Tools > Options, or press F8 to cycle through PatrolOne default,
PatrolOne Dark, Aero, Aero LAPD, Aero Dark and Original MDC. Saved Classic Light, Classic Dark,
LAPD Mobile or unknown skin names migrate to PatrolOne default on launch. **Sign-in pages are
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

On custom skins, the MDC's own left navigation panel can be hidden to gain
width through View > MDC Side Panel, F10, or Tools > Options.
The choice persists and survives navigation. Original MDC always restores the
site sidebar, search boxes and page styling; its custom layout controls are disabled. Its CSS
and root class apply at document start from saved preferences, before the first
page script or paint. This covers navigation chips, shortcuts, page links,
back/forward, reloads and new pages. Turning on the icon navigation hides and
locks the original sidebar; turn icon navigation off to show the sidebar again.

### MDC search boxes

On custom skins, the site's Search Person and Search Vehicle fields can be
hidden from Tools > Options > Layout. Name Check and Plate Check remain
available from Tools and Ctrl+N / Ctrl+L, using the MDC record and DMV routes.
The redundant toolbar row and its visibility settings have been removed; the
File / View / Tools / Help menu row remains. PatrolOne default gives the native
lookup fields compact Tahoma text, warm inset faces, a gold focus outline and
readable beveled search actions. The preload identifies fields by their search
labels and their existing adjacent actions, without requiring a navbar, form,
known field ID or button element. Magnifiers mark their clickable parent and
keep the same 28-pixel width before and after clicks; the fields and their
placeholders share 12-pixel Tahoma text. New controls are marked by the parser
mutation observer before painting. Centering and stable action sizing apply to all
five custom skins; the warm inset palette belongs to PatrolOne default. Original
MDC removes the markers. Existing search handlers and markup remain in place.

### Recent records and alerts

The left rail holds the twelve most recently opened subjects, vehicles,
warrants, incidents and APBs, with duplicate addresses removed. It uses the
existing local History log. Click to return to an already open page, or reopen
that record in the current page; right-click opens another page. Search History
at the foot of the rail opens the full log. This replaces the duplicate site
navigation shortcuts. Disable the rail in Options, or turn off History logging
to stop adding visits.

History and Alerts live in the status strip, below the window controls. Alerts
shows the MDC's unread count and actual notification links and timestamps.
Opening the panel does not locally clear that count; the site owns read state.
The panel shows loading and empty states and dismisses on Escape, outside click,
page changes or navigation.

### Sounds

Off by default; enable in Tools > Options > Sounds. Short samples live in
`renderer/sounds`: `click.mp3` for ordinary clicks, `nav.mp3` for navbar and law
navigation, reload, back and forward, `close.mp3` for closing a dialog or
dismissing a notification, and `error.mp3` for
failed actions, failed page loads and error messages from the site. Replace the
files to change the sounds; the names are fixed.

### Law tabs

The window has four tabs above the page area: Mobile Data Computer, Penal Code,
DEPA and SHAFT Act (Ctrl+1 through Ctrl+4 by default, also under View). These
bindings can be changed or cleared in Keyboard Shortcuts. The Penal Code tab loads the San Andreas
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

---

## Keyboard shortcuts and remapping

Help > Keyboard Shortcuts (F1) lists every shortcut in one table. Press **Change**
on a row and then the combination you want; Escape cancels the capture. If the
combination is already used, it is taken from the other action and the window
says so. **Clear** removes a binding, including a default binding. **Reset to
defaults** clears every remap. Each discovered navbar destination has its own
row. Assigned combinations appear in the top-right corner of its navbar button;
unbound buttons show no key label.
Menu accelerator labels use the same saved map, so clearing or reassigning a
shortcut updates its menu hint as well.

Remaps are stored on this computer, and the map is also pushed into the embedded
MDC pages, so a key pressed while the page has focus does the same thing as one
pressed on the client chrome. Keyboard combinations use the same normalization
in chrome, MDC and law pages, including modifier combinations and numeric keypad
plus/minus. Sandboxed preloads receive the complete binding map without requiring
local modules or disabling their sandbox. Escape is deliberately not remappable â€” it always closes the find bar,
then a dialog, then stops a loading page.

Ctrl+N and Ctrl+L open small **Name Check** and **Plate Check** windows: type,
press Enter, and the query runs and is logged. Previously these only focused the
toolbar fields, which did nothing when the lookup fields were hidden.

## Updates

Help > About has a **Check for Updates** button. It reads the public release list
for the project and compares the newest tag with the running version. If a newer
release exists, an **Update Now** button appears, which downloads the release
installer, hands it to Windows and closes the client so the files can be
replaced. There is also **Open Release Page** if you would rather do it by hand.

An optional check when the client starts can be switched on under
Tools > Options > Window; it is off by default. Nothing is ever downloaded or
installed without pressing Update, and no information about you is sent â€” the
check is a plain read of the public release list.

For the automatic check and the Update button to be useful, releases have to be
published on the project page with the installer attached as a release asset, and
the tag has to be the version number (for example `v1.0.2`).


## Implementation notes

The source files carry no inline comments. The behaviour that used to be
explained there is recorded here instead.

**Skin boot and sidebar visibility.** The shell persists its selected skin and
migrates retired names to PatrolOne default. The MDC preload keeps `mdtViewPrefs` in
the MDC origin's storage, shared by all MDC pages. Its `sidebar` value means
hidden; the shell's `mdc.sidebar` value means shown. Both `dom-ready` and
`did-stop-loading` send the same inverted shell value. If the parser has not yet
created the root, a document MutationObserver installs the saved layout CSS and
root classes at the next parser microtask, before rendering. No timer or late
load event is needed to hide the sidebar on custom skins. Original MDC bypasses
layout hiding and removes the skin styles and classes. Layout
hiding never runs on authentication hosts. All custom skin layers apply in the
same first pass. The internal light palette remains a fallback; navy and
graphite palettes belong directly to their Aero skins.

**Dispatch layout.** PatrolOne default and all three Aero skins share a full-width
icon navigation bar, a left recent records rail, a status strip and a bottom action
bar. Aero uses glass gradients throughout that layout. Alerts, posted APBs and
officer identity come from the site; the page count and loading text describe
the client. Unknown APB counts display a dash. There are no simulated duty or
availability indicators. The left rail returns to real records from local
History; top navigation remains the site's discovered destinations. The action bar offers Back,
Forward, Reload, Emergency Map, Paperwork and Open as New Page. The last command
copies the current address into another page; it does not transfer a form.
Native Windows window controls remain in the title bar, with matching skin
colors and a draggable title area. The entire title strip uses the same solid
color as the native caption-button surface, avoiding a seam at the right edge. Site popups within GTA World open as new
client pages through the main-process popup handler.

**Verification.** `npm run verify` uses synthetic MDC and forum markup inside
real Electron webviews, plus the actual Cropper.js 1.5.13, Summernote 0.8.20
jQuery 3.7.1, Bootstrap 4.6.2 and Bootstrap Notify 3.1.3 packages installed as
development dependencies. It creates a separate temporary browser profile and
intercepts all network requests, so it never reads the user's real session or
contacts the MDC. It checks the saved sidebar class before the first page
script and its computed visibility on animation frames through all navigation
paths, visible/hidden preferences, Original MDC, skin migration, Options,
responsive layout and unskinned authentication. It also exercises native
cropper mouse dragging and resizing, repeated file selection, crop export,
visible color-palette clicks, report/MOTD/incident contrast, preserved authored
colors and highlights, dialog resize release, live notification counts,
History filters, distinct warrant and bottom-action icons, zoom keys across
reloads and new pages, native Bootstrap focus traps, independent MDC and client
windows, notification geometry, caption colors and Penal Code seal spacing, reused arrest-report viewers, transform tracking,
SHOW selectors, card containment, scaled rail text/icons and map icon assets,
repeated report closure with dashboard pointer/wheel input, display-hidden
viewers, Escape dismissal and native padding preservation, and
restoration of the stock page after switching skins. `npm run verify -- --regressions-only` runs the reused-report, drag, UI-color and
rail regressions alone. `npm run verify -- --widgets-only` checks the lookup
controls, real error notifications, hover-only resize grips, cropper and editor
widgets. `npm run verify -- --performance-only` measures script/layout time
while a 200-row record fixture updates its clock, then checks wrapped clock and
hover updates. It saves metrics and a CPU profile beside the previews. Images go into
`dist/verification/`. These are fixture checks, not verification of live,
authenticated MDC records or supervisor-only screens.

`npm run verify -- --source-only` checks sanitized dashboard and warrant source,
the site's actual notification plugin and a 350-option charge list across every
custom skin. `npm run verify -- --interactions-only` checks shortcut capture,
conflicts, clearing, navbar badges, law navigation, shared zoom and mouse-wheel
routing in floating reports. Wheel input uses the report's existing scroll
containers and stops at their boundaries without adding scrollbars or changing
native overflow or height rules.

`npm run verify -- --documents-only` checks wrapped tabs, the supplied Incident
structure, representative create/edit pages, arrest editor grid protection,
card dividers, paper record previews and print output across all custom skins.

`npm run verify -- --memory` starts the real application entry point with an
isolated temporary profile and locally served source-based pages. It records the
sum of working sets across the application's Electron processes shortly after
startup and after opening a dashboard, warrant page, record and DEPA. Results and
screenshots go into `dist/verification/`. These figures describe that local test
workload; authenticated pages and account content can cost more or less.

**Floating windows and dragging.** History, Options and the other client tools
are independent windows. They do not dim the page or cover its input surface;
click a tool to bring it forward, and close it without closing the others.
Each window keeps its own controls and values, with unique element IDs and
labels. Opening the same tool again refreshes that tool instead of duplicating
settings panels. The Recent records rail can be widened or narrowed by
dragging its right edge. Focus the rail or its divider and press Alt+Left / Alt+Right
to resize the rail and its content, or Alt+Home to reset it. Labels, timestamps,
icons, spacing and the History button scale with the width; labels wrap within
the rail. These bindings apply only while the rail has focus. Ctrl+Plus, Ctrl+Minus
and Ctrl+0 always control page zoom, including when the rail has focus. Width is saved.

MDC dialogs keep native modal behavior until one is actually moved. Moving a
normal MDC dialog enables a floating workspace for the currently open dialogs:
the page and other dialogs become clickable, clicked dialogs come forward,
and Bootstrap's focus trap is suspended. Closing all moved dialogs, disabling
dragging or switching to Original MDC restores native focus behavior and style
values. Confirmation alerts retain their normal modal behavior. Editable MDC
forms are used directly; no editable form or submit handler is cloned. When a
moved read-only View Record/Report dialog is reused for another report, the old
rendered report is retained in a separate read-only window with unique IDs. The
new report keeps the original MDC viewer and appears in front. Each retained
report can be moved, resized or closed separately. Original MDC removes these
supplementary viewers. Closed or display-hidden source viewers are excluded from
the workspace and report cache. Closing a retained report does not bubble its
dismissal into the site's native modal handlers. The workspace stays active
until its final window closes, then removes its tracked backdrops and focus
locks after native transitions finish. Native padding is restored only if the
modal library has left cleanup unfinished. This also supports successive reports once the floating
workspace is active. For records on
different pages, use the Pages strip or right-click a record to open another
page and preserve the form on the current page. A normal full-page navigation
still replaces that page's document.

Both drag paths capture the pointer, cache their starting bounds and write one
transform per animation frame. Repeated drags use the current position instead
of measuring after every move. Pointer cancellation and loss of window focus
end the drag cleanly. During a drag, only the shown dialog's transform transition
is set to zero duration; show/hide transitions resume afterward. The initial
scrollbar shift is compensated, and expensive skin scans wait until release.
Bounds use the visible title bar rather than its potentially centered wrapper.
The title bar can reach all edges of its viewport while staying fully reachable.
Client tools use the client viewport; MDC popups use the embedded page viewport.

**Repeated work.** Generated CSS is cached per skin. The page observer ignores
clock-only text, editor typing, ripple animations, map tiles and notification
animation changes. A full styling pass disconnects that observer while making
its own changes, then reconnects it; actual content changes still schedule a
coalesced pass. Dropdown pinning, image handling, editor source hiding and
resize grips react to relevant DOM changes instead of recurring whole-page
polling. Map search observation is installed once. Native transitions and
scrolling behavior remain in place.

**Resizing and zoom.** The dialog grip captures its pointer through release and
shows its corner strokes only on hover or while resizing. It suppresses only
the release click belonging to that drag, so Bootstrap does not
dismiss the dialog. A manually resized frame has a definite width and height;
its existing body flexes between the header and footer. The resize handler
releases that body's opening height/max-height cap only while the dialog is
explicitly sized, without adding a scroller or changing native overflow. It
anchors the visible header while resizing and handles later native height writes.
Closing the popup or selecting Original MDC restores saved inline values and
priorities. Client tools have matching corner grips; reopening a tool resets
its geometry. This is a user-driven sizing lifecycle, not a general dialog CSS
override. Ctrl+=,
Ctrl+Shift++, Ctrl+- and numeric keypad +/- work in the shell, MDC and forum.
One saved zoom factor is applied to all views, including reloads and new pages.
Zoom moves in 10% steps between 50% and 200%; Ctrl+0 resets to 100%. Changes are
coalesced per animation frame. The client chrome stays at native scale, and a
ResizeObserver keeps every webview matched to its content area. Keyboard remapping remains available in Tools.

**Panels.** PatrolOne default uses pale panel faces, flush black headers, red primary
buttons and compact tables. Aero uses tinted glass headers, outlined panel
faces and blue focus accents. Header spacing reserves room for collapse
controls. New content spacing rules exclude dialogs so charge rows retain
their existing geometry. Dialog and dropdown scroll properties are filtered
out of skin CSS so the site manages scrolling and editor popups can open
without skin-imposed clipping.

Card and panel dividers reset native negative margins, oversized widths, padding
and fills. Each line uses a single thin top border and fits its parent. This
shared rule also applies on create/edit pages; it adds no clipping to cards.
Recognized profile details have a narrower exception: empty trailing separator
elements after the final Criminal Points fields, and wrappers containing only
those separators, are hidden without leaving a layout track or margin. Interior
dividers and dividers in other cards remain. Original MDC removes the markers
and restores the separators.

**Native authoring forms.** Create/edit routes for incidents, APBs, warrants,
reports and arrests exclude their content from generic geometry rules. Narrative
editors also identify authoring content when a route is unfamiliar. The
filter-strip helper also skips authoring routes and forms with narrative editors.
It must not treat fields in an authoring form as search filters or turn their
Bootstrap columns into inline rows. The supplied Incident structure therefore
retains labels above fields, the classification info box, Narrative below them
and the map in its original right column. Switching skins refreshes the route
flag. Arrest Report and Charges dialogs exclude geometry changes as well as
the runtime charge-row packer, retaining native grid and absolute placement.

**Printable records.** Read-only View Record/Report popups identify document
tables, semantic document containers and authored white document surfaces.
These roots and their descendants bypass generated skin selectors and runtime
profile/contrast repairs. The paper surface uses a full-width white serif form,
black grid borders, small bold field labels and larger values; cells and field
order stay in place. Popup title bars, close buttons and native scrollbars keep
the active skin. Authored inline formatting remains in the document. Printing
selects the frontmost visible document popup and removes background page content,
screen-only chrome and clipping in print media. Document pages use Letter paper
and crisp black borders, without the site's forced wide print canvas. Screen
scrolling remains native. Original MDC removes
these markers and enhancements.

**Cropper and report content.** The skin excludes Cropper.js widgets and their
images from every generated selector. Resetting a cropper subtree with
`all: revert !important` also removes the library's positioning and inline
sizes, so excluding the widgets is how the client leaves them unstyled while
retaining their native behavior. The disabled replacement cropper, upload
interception and delayed crop resets have been removed. The page owns file
selection, crop movement and export.

Authored inline colors, HTML font colors and their descendants bypass the
skin's foreground CSS. Stable authored-color/font markers track the relevant
inline properties. Geometry-only style writes from Popper no longer invalidate
document-wide style-substring descendant selectors. Native option-list content
is excluded from broad skin selectors and receives focused palette rules;
dropdown geometry updates do not trigger another full styling pass.
Contrast repair preserves chromatic authored text, but
corrects unreadable neutral black/white text against the actual painted
background, including gradients. Original inline color values and priorities
are restored when changing skins or returning to Original MDC. Editor descendants retain their
chosen foreground and background colors. Authored inline font families and
HTML font faces, including nested text, bypass forced skin fonts in the editor
and viewed reports. Font previews retain their own families. Editor surfaces
and default text override the native dark editor face using the active palette.
Color palettes keep native widget
styles, including their fonts and swatch dimensions. Editor toolbar buttons,
font labels and icon glyphs use the active skin's foreground, with matching
hover and pressed faces. This does not change authored text or chosen colors.
The client no longer
rewrites swatch styles or strips report highlights on a timer.

**Notifications and Penal Code.** Notification type colors, icon badges and
stacked title/message text and nested icon glyph ink are styled without setting
the notification container's CSS position or interrupting its lifecycle.
The site retains control of every notification's mount point, placement and
validation message on every skin. The client does not wrap or replace the
notification function. Exclamation badges use a centered vector glyph so native
icon offsets cannot shift the mark. Delay, update/close handles and callbacks
remain native to [Bootstrap Notify](https://github.com/mouse0270/bootstrap-notify). Close symbols
use centered crossed strokes rather than font baselines.

The Penal Code normalizes short image/caption blocks into contained sections
and turns adjacent empty decorative bars into thin dividers. The forum theme's
actual cPost header pseudo-element is suppressed so it cannot draw across seals. Images remain
capped at 160 pixels; long sections are not reclassified as illustrations.
Headings, quotes, tables, search and scrollbars follow the active palette.
Switching to Original restores authored inline styles and priorities and removes
the illustration markers. Forum authentication screens remain stock.

**Icons and chrome.** Navigation and shortcut icons are bundled SVG drawings in
`renderer/icons/dispatch/`, in the older illustrated desktop style of the
reference. They load locally without a shell icon-font CDN. Their labels and
links remain the site's actual destinations. Vehicle Map uses a patrol car on
a folded map; Emergency Map uses a location pin. The officer label in the MDC
navbar has a transparent background; its search fields remain usable. The
shell account Menu button is removed. Original MDC keeps the site's own account
controls and receives no custom navigation, layout hiding, grip or skin style.

**Images.** Pictures are limited to the width of their panel. Only pictures
that declare no size of their own are scaled by height, because forcing that on
every image collapsed department crests down to their natural size. Warrant
seals are given an explicit height.

**Discord presence.** Rich presence is spoken directly over Discord's local
socket, with no third-party dependency. It is off by default and every failure
is silent, since "Discord is not running" is the normal case. The application
id lives at the top of the Discord section in `main.js`, and the icon must be
uploaded to that Discord application's Rich Presence art assets under the key
`app_icon`.

**Supervisor features.** Some views available to supervisors and high ranking
officers may behave incorrectly, because the page source for them was never
available. This client was built by reading the page source of the web MDC.

### Warrant form geometry

File/Add/Edit Warrant dialogs are identified by their title. Scoped layouts based
on the supplied source align suspect fields and date/time/location groups and
contain dynamically added charge and evidence rows. Buttons use minimum heights,
and decorative evidence magnifiers are hidden. Charge/class selectors paint one
continuous surface while Bootstrap Select retains its own option-list sizing and
scrolling. Generic charge-row and button-packing helpers skip these forms.
No dialog scroller, overflow rule or height cap is added. Add Arrest Report and
Charges retain their native layout and receive palette changes only.

Lookup action glyphs across the custom skins keep static positioning and no native
translation in idle, pressed and released states. Their hit targets and original
search handlers are preserved. Verification uses Font Awesome as a development
dependency, the real Summernote font menu and representative Bootstrap warrant
markup. These fixtures do not access an authenticated MDC account.

**Compact actions and View Record sizing.** Single-field client lookup rows
use a flexible field track and a content-sized action track, keeping Run aligned
with its field. Create/edit pages retain native form structure while ordinary
action buttons use compact padding. Editor tools, intentional full-width controls
and the protected arrest charge dialog remain excluded.

The window-frame title button and title-bar double-click maximize View Record
to its embedded viewport. Other dialogs have no maximize action. A second
activation restores the previous size and position. The
existing body fills the frame without a new scrollbar or changed overflow.
The outer modal releases its unused reserved gutter while maximized so it does
not clip the close button; the body retains its narrow scrollbar and gutter.
Closing or switching to Original MDC restores native page styles. Original MDC
receives no added page controls. Client tools keep close and applicable resize grips.

The Electron measurements distinguish these coordinate spaces: in a 1440 by 1100
Aero test window, the MDC viewport starts at client y=239.6 and the dragged record
title reaches viewport y=0. The icon/status area is outside that viewport.
Use `npm run verify -- --popups-only --inspect-popups` for an isolated fixture
on local DevTools port 9222, paused after a real resized/scrolled Aero drag.
Set `window.finishPopupInspection=true` in the shell to finish that diagnostic.

**Popup and editor corrections.** Name/Plate Check, About and notification
reminders are fixed-size client tools with no maximize control or resize grip.
Larger client tools retain resizing. View Record title controls share a 28 by 22 pixel geometry,
4 pixel spacing, and a common header reference even when Close is nested in the
title. The caret rule is scoped to editor toolbar toggles and avoids the native
open-state rotation and padding overflow without changing dropdown scrolling.

The supplied person record uses `hr.style-hr-no-divider` inside its paired
details columns; these are hidden without a grid track. Registered Vehicles
uses row bottom borders, not HRs, nested under a span. Only those rows have
their negative horizontal margins reset. Phone dividers remain visible.

The embedded viewport remains the drag boundary. Crossing into client chrome
would require page reflow or a separate rendering/lifecycle implementation;
maximize remains the supported alternative. `npm run verify -- --review-fixes`
opens an isolated source-based screen for Electron MCP at local port 9222. Set
`window.finishReview=true` in the shell to close it.

**Maximize policy (1.0.21).** Only the main Electron window and View Record
popups maximize. History, Options, Keyboard Shortcuts, About and all other
client tools have only their existing close controls; no title double-click
maximizes them. Tools retain movement and applicable resizing. They are HTML
dialogs, not secondary BrowserWindows. Their former full-client maximize state
placed the main native overlay over tool chrome; removing that state keeps
each title bar and its matching controls in their own surface. The main native
overlay continues to use the active main title-bar palette.

View Record uses a window-frame glyph with a thick upper edge, and overlapping
frames for restore. Other MDC dialogs receive no maximize control. Menu labels
are excluded from banner repairs and ancestor frame stripping. Shared badge
menu rules align item padding and font metrics without changing color, text,
handlers or native scrolling. Editor and Bootstrap Select menus remain excluded.


**Minimized records (1.0.23).** View Record titles have matching minimize,
maximize/restore and close controls. Other dialogs retain their existing
controls. Within a live document, minimizing keeps the record, its scrolling
and window geometry alive; native viewer reuse retains independent read-only
reports. Escape keeps its existing focused-dialog behavior and does not dismiss
minimized records from the background page.

The shell owns each MDC page tab's minimized-record descriptors: record ID,
short title, type color, source URL, geometry, maximize state and simple scrollbar
offsets. No document DOM or report HTML is stored in the shell. MDC navigation,
reload and skin changes retain the list, including Original MDC mode. Closing
a client page transfers its dock records to a remaining page. Explicit dock
closing and signing out clear records; restoring removes the selected dock tab.
Original MDC mode continues to leave the page's own interface unskinned.

Restoring uses a live window when it is still available. After navigation it
clicks the MDC's native View Record action on the current page, using its
existing delegated handler and record ID. If that page has no viewer, the client
loads the saved source page and then opens the record. The native action loads
fresh saved data; unsaved edits cannot be preserved across a page load. A record
with editable fields asks before minimizing. Simple modal/body scroll offsets
are reapplied to the refreshed content where possible; changed content may
clamp them. Failed opens keep their tab for retrying rather than discarding it.

The dock is a reserved client layout row outside the webview. Version 1.0.24
restores the v1.0.22 styling directly from its source archive: theme panel and
button-face backgrounds, theme text and thin borders, original hover/pressed
states and an unmodified 3px record-type strip on the left. There is no extra
navigation-gradient or selected-tab treatment. Many tabs scroll horizontally.
The existing content ResizeObserver sizes the webview to the remaining space,
without covering the page or its scrollbar. Navigation persistence and the
page scrollbar repair from 1.0.23 remain unchanged.

**Page scrollbars (1.0.23).** Material Dashboard's Perfect Scrollbar containers
hide native scrolling. The skin hides its custom rails in favor of native bars;
the native fallback must be a separate page-panel selector, because the dialog
CSS guard strips overflow declarations from rules mentioning dialog selectors.
Page PS panels now receive a dedicated native overflow fallback and an 8px
scrollbar. No height or overflow is forced on html, body or wrapper, and dialogs
and dropdowns retain their native scrolling. The former routine that hid root
overflow after measuring a panel has been removed.

Run `npm run verify -- --minimized-only`, `--scrollbars-only` or
`--persistent-dock-only` for the focused checks.


**Record surfaces and modal controls (1.0.25).** Read-only View Record card bodies
now use the same paper detection and white serif form styling as modal viewers.
Explicit document/print previews share the scope; live editors remain native.
The supplied full-page record has 13px surrounding details. Print selects the
active record paper or the full-page paper when no viewer is open.

Perfect Scrollbar's `ps-container` hides modal body overflow while the skin hides
its custom rails. A dedicated rule restores native scrolling on the existing
modal body carrying `ps-container` or `modal-scroll`, retaining the site cap and
resize behavior. Unmanaged editor dialogs keep their own overflow behavior. It bypasses the general
skin guard that intentionally strips scroll geometry. No extra scroller, page
root sizing or dropdown overflow override is added. The existing capture wheel
handler routes scrolling within the popup and stops chaining to the page.

Shared compact form button metrics now apply inside native form exemptions,
without enlarging the already-compact controls on other create pages. Selectpicker
wrappers have no decorative padding/border; the icon and selector share a 30px
height and one adjoining border. Charge remove controls fit their native column.
The native arrest grid, button display and absolute positioning remain intact.
Searchable dropdowns use explicit field/text colors and palette-matched selected,
hover and group-header colors, including glass field colors in Aero skins. Missing
search placeholders receive `Search...` when their menus open.

Run `npm run verify -- --record-surfaces-only` and
`npm run verify -- --modal-forms-only --colors` for the focused checks. They use
sanitized supplied page markup and the site's vendor CSS/selectpicker, including
its PS class state, without signing into a live account. The Electron MCP visual
review uses those local fixtures in the real client shell.


**Dropdowns, printed records and status panels (1.0.26).** The charge-picker audit
found inherited text fill hiding code badges, viewport-based pinning covering the
modal footer, an unused width calculation, and a native empty-result keyboard
error. Badge metrics/colors now cover the source's red, orange, dark and green
codes. Valid option selection remains native; only navigation keys with no
selectable results are intercepted. Escape closes the active list through the
native selectpicker handler and stops propagation to the form. Without an open
picker, the form keeps its existing Escape behavior.

The native bridge supplies the modal body's bounds through selectpicker's own
`windowPadding` option. The library still chooses dropup and owns menu/list
height and overflow. Pinning uses the actual measured menu height and button
width, updates after filtering/resizing and explicitly at resize-grip release, and
restores native width/padding on close. No extra scroller or menu max-height/overflow rule is introduced. The
arrest grid, button display and absolute row placement remain native.

Printed tables are identified from their own merged document-title cell and
field grid. Parent sections are irrelevant, including Record History and edit
comparisons. Table descendants receive the existing paper styling; surrounding
operational tables and live Summernote/contenteditable markup are excluded.

The shell status panel and page preload exchange a small open/dismiss signal.
Page pointer/focus activity, guest Escape, window blur, menus, dialogs and tab
changes dismiss it. Guest Escape is consumed only when dismissing an open shell
panel, so normal modal shortcuts remain intact. History retains its existing
client dialog and dismisses Alerts when opened.

Original notification `text-*` classes and explicit color spans are transferred
as text parts, never remote HTML. The original MDC warning/success hues were
measured with the skin off (#FF9800 and #4CAF50); semantic hues are retained and
lightness is adjusted separately for normal/hover panel backgrounds. There is no
list of status words. The Submission Update line and existing text layout stay
in place.

Focused checks: `npm run verify -- --picker-interactions-only`,
`--status-panels-only`, and `--record-surfaces-only`. These run the supplied-source
fixtures in an isolated Electron profile. Electron MCP screen review uses the
same real client shell in PatrolOne Default first, then Windows 7 Aero.


### 1.1.0 presentation fixes

Status-strip lists use the skin's light hover highlight, independently of the
navigation selection color. bootstrap-select still owns list sizing and native
scrolling; its existing inner list receives a visible themed scrollbar and wheel
input stays inside the list.

Post Arrest status badges align with equal spacing. Data rows using `th` cells
are styled as data when their table has a separate `thead`; printed documents
remain exempt. Collapse glyphs and editor chrome work on form pages as well.
Summernote Video, Link and Image dialogs use compact fields and primary actions,
and toolbar controls share a minimum height without fixing button heights.

Copy keeps the MDC's own html2canvas handler and download filename. It prepares a
separate document with native styles, white paper colors and rasterized font
icons, waits for styles/fonts, then captures its final dimensions. This avoids
both skin colors and the old renderer's clipping when clone layout grows. The
live page is not repainted. The verification fixtures include the supplied Post
Arrest markup and the MDC's public html2canvas and Font Awesome resources.


### 1.1.1 search rows and stable selectpicker menus

Search-bar fields and actions share 26px metrics and a common vertical alignment.
Material button ripple decorations retain their native opacity and circular shape;
the header icon/text rule no longer paints the ripple as an opaque white square.

At the user's explicit request, open bootstrap-select menus now have one frozen
viewport. This is a scoped exception to the historical dropdown sizing rules
above: only the existing native menu and inner list are sized, and no scroller
is added. The initial fit chooses the larger visible space above or below the
button, capped at 420px. The inner list scrolls with a visible themed scrollbar,
while search stays outside it. Filtering and scroll events reuse this fit. Only
reopening or a window/popup size change computes a new fit. Native instance
methods, options and inline styles are restored on close or skin removal.

The cause of changing heights was the capture-phase scroll listener combined
with a geometry key containing menu height; native virtual-list redraws could
therefore trigger another fit. bootstrap-select also registers its own window
scroll/filter sizing callbacks. While a menu is open these callbacks now reuse
its saved dimensions. Opening scale transforms are excluded from measurement;
the opacity transition remains enabled.

The wheel handler also mistook the nested `ul.dropdown-menu.inner` for the outer
menu, so it failed to find the scrolling div and could scroll the form at list
boundaries. It now resolves the owning picker and its existing inner div.
The frozen-list wheel guard runs alongside the native picker in the page context
so native input remains cancelable after page activity. Its existing inner list
also contains overscroll, and all added inline properties are restored on close.

### 1.1.2 Aero LAPD controls and one dropdown scrollbar

Page close hover and pressed states use the current Aero glass palette. The LAPD
dock uses its nav/page gradients, brighter active face, white text and a 3px type
strip mixed with 20 percent white. Other dock palettes and shell behavior stay
unchanged. LAPD dock close controls use the same glass states as page close.

All cached skin CSS separates generic font shorthands/families from icon hosts,
including before/after selectors. The shared header action font shorthand had
overridden Font Awesome on buttons that carry fa classes themselves. Generated
glyphs now inherit the icon font. Semantic colors remain intact; create-page
text actions use compact primary faces and label chips have consistent padding.

The supplied warrant source calls perfectScrollbar on every .inner element.
That adds plugin rails beside the native list scrollbar, and widget protection
had excluded those rails from the global cleanup rule. A dedicated picker rule
hides the plugin rails while preserving the existing native list, its frozen
viewport and its wheel/keyboard handling. No scroller is added or destroyed;
Original MDC resumes its own scrollbar appearance when skin CSS is removed.


### 1.1.3 record loading, native list rendering and PatrolOne Dark

Repeated delivery of an unchanged skin now refreshes cached styles and flags
without scanning the page again. Contrast repair walks eligible text-bearing
elements and skips whole document, editor, picker, cropper and hidden-modal
subtrees. Showing a modal or adding page content still schedules repairs. Native
selectpicker measurement clones and list redraws no longer trigger unrelated
author-style scans across the form.

Long native bootstrap-select lists use its own virtual renderer from 80 options
while a custom skin is active. Only a numeric native threshold above 80 is
temporarily lowered; explicitly disabled virtualization is respected. The full
option data and native filtering, selection and keyboard behavior remain intact.
The original option is restored on dismissal or Original MDC, together with the
existing frozen viewport. This reduces mounted rows without another scroller or
a vendor patch. Search stays pinned and the one existing inner list scrolls.

The local supplied-person-record fixture measured about 14 percent less total
main-thread work for record loading and 34 percent less for charge-list opening
than the 1.1.2 baseline (three samples each). These are local rendering results,
not a guarantee about live MDC server, network or authentication delays. Run
`npm run verify -- --profile113` for the same profiling workload; JSON metrics and
CPU profiles go to dist/verification.

PatrolOne Dark uses the p1dark setting, shares Default's compact geometry and
applies to the shell, MDC pages and law topics. The legacy dark setting still
migrates to Default as before. View, Options and F8 include the new skin, and it
persists across restarts. Paper reports, document exports, authored editor text
and external sign-in pages retain their existing exemptions. Small copied plate
identifiers receive readable palette ink; full vehicle plate artwork is exempt.
`npm run verify -- --release113-only` covers the new skin, dynamic contrast,
virtualized picker input, native restoration, report surfaces and persistence.


**1.1.3 typing correction.** Summernote updates its toolbar after both keyup and
change. It rewrites font labels and button states even when the selection's
formatting is identical; with the skin rules present this caused repeated
style/layout work and characters to queue before painting. The shared page
bridge now compares the native scalar formatting state for each toolbar target.
It calls the native toolbar update immediately when that state changes and skips
an identical redraw. Input, composition, selection, clipboard, history and saved
report content are not throttled or replaced. The exact original method is
restored on Original MDC and editor destruction. Editors initialized later use
the same hook, including Edit Record, arrest, warrant and incident narratives.

Run `npm run verify -- --typing-only` for native keyDown/char/keyUp samples in all
five skins and Original MDC. It checks retained text, frame latency, bounded
style recalculation, immediate bold/font updates, undo and native restoration.
Timing JSON and CPU profiles are written to dist/verification. The version stays
1.1.3; the replacement source ZIP includes this correction.
