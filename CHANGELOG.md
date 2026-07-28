# Changelog

## 1.0.0

First public release. The 1.2.x and 1.3.x entries below are the pre-release development history and are kept for reference.

- BB code toolbars are horizontal again in Edit Record, Add Record, arrest narratives, incident posts and page comments. The editor toolbar carries `class="note-toolbar card-header"`, so it was being caught by the card and dialog header rules and every button group was laid out as its own full-width row. Inside dialogs a second rule was also involved: the header-column rule that lines Type / Status / Confidential Level up under their captions matched the toolbar's button groups too, which is why Edit Record stayed stacked after the first fix; editor groups are now excluded from it. The toolbar has its own layout at higher specificity: one wrapping horizontal strip, inline button groups, 22px buttons, and themed font, style, table and colour dropdowns.
- Colour palettes inside the editor are usable: two palettes side by side, 16px swatches in real rows, and the swatch colours themselves are left untouched so they still show the colour they apply.
- Pages. The strip is captioned `PAGES`, the same way the quick shortcuts strip is captioned, and each entry is named after the page it holds (its navigation entry, or the record number) instead of repeating the site's own "Mobile Data Computer" title. Right-click a navigation chip, a quick shortcut or any link on a page — a record, a warrant, Emergency Map — to open it as another page instead of replacing the one in front.
- Several MDC pages can now be open at once, each in its own view, so records keep their scroll position and half-filled forms while another page is in front. A page strip sits under the tabs with a close button per page and a `+` button; Ctrl+T opens a page, Ctrl+W closes one, and links the site opens in a new window arrive as a new page instead of a popup.
- Person Lookup and ID Lookup fields are centred on the same axis and width as their Search button. The fields are not inside a `form`, which is why the earlier form-scoped centring never applied; the rules now key on the real `.tab-content > .tab-pane > .row.justify-content-center > .col-xl-4` markup.

## 1.3.14

- Map surround recoloured to `#0FA8D2` on both the vehicle and emergency maps.
- Rebuilt the map search bar against the real markup. The plugin ships a `label` that carries the same `search-input` class as the field, and the field itself gets an inline `max-width` in the thousands of pixels, which is why it sprawled across the map; the label is hidden, the input is pinned to 230px, and the magnifier and cancel buttons are matched 22px squares.
- Infraction rows now stack in their own bordered panel like charges. The infraction dialog wraps its rows in a differently named container, so wrappers are now matched by shape (an addon that actually contains rows) rather than by class name, and any dialog following the same pattern is covered.
- Squared up the dialog header columns. Type / Location / Status / Confidential Level, and Type in Add Record, now centre their control directly under their caption on a shared baseline instead of each control sitting wherever its button group landed.
- Caution Code and Profiling Sample facility pickers scroll again. Both are `.dropdown-menu-scroll` lists that delegate scrolling to Perfect Scrollbar, whose rails this client hides, leaving them unbounded; they now have a real height limit with native scrolling, and their badge pills are sized to sit on one line each.

## 1.3.13

- The charge list is now its own panel. `.chargeWrapper` is bordered, has its own background and scrolls internally once it passes about five rows, so a long list can no longer run over the Narrative editor below it.
- Fixed the dashboard statistic icons escaping their cards. Material Design lifts `.card-icon` out of `.card-header-icon` with a negative offset so it overhangs the card edge; the tile is now pinned inside the header beside the figure and label, with the card clipping anything that tries to leave.
- Both map pages show cyan water around the island again, matching the vanilla page. `#map` and `.leaflet-container` were inheriting the skin's grey panel colour as the map background.
- Reworked the map search bar: the Leaflet Search input, magnifier, cancel button and result list are now skinned to match the rest of the client, with a scrolling result list and a highlighted selection row.
- F8 now cycles the skin from the Penal Code tab. Keyboard focus is inside the forum view there, so the shell never saw the keypress; that view now forwards the same hotkeys the MDC view does.

## 1.3.12

- Charge rows stack vertically again. Rows are appended into `.input-group-addon.chargeWrapper`, which shares a class with the Penal Code / Charge button strip above it, so 1.3.11's rule for laying that strip out side by side was also laying the rows out side by side. The button strip rule is now scoped away from the wrapper, and the wrapper is an explicit vertical stack.

## 1.3.11

- Removed the doubled scrollbars. The site runs Perfect Scrollbar on several containers, including the arrest dialog body (`modal-body modal-scroll ps-container`), which paints its own rails on top of an element that also scrolls natively. The rails are now suppressed and native scrolling is kept, which also clears the grey rail that floated over the interface.
- The arrest dialog is now a proper flex column: the header and Submit footer stay put and only the body scrolls.
- Rebuilt the charge rows against the site's real markup. Each row is `.form-group.row.col-12` holding Charge / Addition / Class input groups plus a remove button, so the row is now a four-column grid: the three pickers share the width proportionally and the red remove button sits in a fixed 28px column. Pickers are a consistent 24px tall with ellipsised text, so adding charges no longer pushes the row out of shape.
- The Penal Code and Charge buttons sit side by side above the rows instead of being stacked at 15% width each.

## 1.3.10

- Rebuilt the mirrored MDC header controls. They are now labelled buttons (History, Alerts, Menu) in the client's own button style rather than faint glyphs, and they read clearly against the LAPD navy chrome.
- Their dropdowns are now drawn by the client, directly under the buttons. Previously the client clicked the site's own control, which briefly un-hid the original icons, opened the site dropdown half-way down the page and left a stray page scrollbar over the interface. The originals now stay hidden permanently.
- The header controls are matched by the site's real ids (search history, notifications and account menu) instead of by icon guesswork, and history and notification rows keep their timestamp / source line as a second line in the menu.
- Day Mode is filtered out of the mirrored account menu on custom skins.
- The Quick shortcuts caption now sits above the shortcut buttons instead of beside them.

## 1.3.9

- LAPD Mobile is now selectable in Tools > Options > Appearance, alongside Classic Light, Classic Dark and Original MDC.
- Fixed the LAPD skin not reaching the MDC page itself: the page-side theme handler collapsed any unknown skin name to Classic Light, so the dashboard and the rest of the MDC stayed pale. All palettes now paint the whole MDC.
- The MDC page header's history, notifications and profile controls are hidden on every custom skin and mirrored in the client menu bar next to Help, drawn in the active skin's colours.
- The site's Day Mode / Night Mode entry is removed from the profile dropdown while a custom skin is on, since the client owns appearance.
- The icon strip is now a named "Quick shortcuts" bar with a caption, works on every custom skin, and can be turned off in Options > Quick shortcuts.
- Person Lookup and ID Lookup put every field and the Search button in one 320px centred column, so they share a single centre axis.
- Dashboard statistic cards keep the figure and its label together beside the icon instead of pushing them to opposite edges.

## 1.3.8

### Added

- LAPD Mobile skin: PremierOne-style icon strip below the tab bar, using the
  supplied artwork (Home, Query, Traffic, C6, Calls, Dispatch). Each button
  prefers the matching entry from the MDC's own navigation, so it follows the
  site if a page moves, and falls back to a known URL otherwise. The strip is
  shown only while the LAPD Mobile skin is selected and hides itself with the
  other skins.

## 1.3.7

### Added

- New **LAPD Mobile** skin (View menu, Tools > Options, or F8 cycling). It is a
  full skin, not a tint: deep navy panels, bright blue chrome, white text and
  pale blue rules across the MDC pages, the penal code tab, the menu bar,
  toolbar, tab strip, navigation chips, find bar, dialogs and status bar.

### Fixed

- Card headers with a collapse toggle now keep their title centred. 1.3.6 moved
  the toggle to the right edge and padded only that side, which pushed centred
  titles off centre; padding is now symmetric and the title is centred across
  the full header width, with the toggle still pinned clear of the text.
- Dashboard statistic cards (personnel, vehicles, records, APBs): the coloured
  icon tile sat flush against the top-left corner of the card. The header is now
  a centred flex row, so the tile is inset and vertically centred against the
  figure and its label.

## 1.3.6

### Fixed
- The collapse toggle no longer sits on top of card header text. It is absolutely positioned near the centre of its header, so on cards with a centred title (Message of the Day, the profile card) the dash cut straight through the words. It is now pinned to the right edge of the header, vertically centred, with the title padded clear of it. Close buttons in card headers are placed the same way.

## 1.3.5

### Fixed
- Incident Database filter strip alignment, properly this time. The 1.3.4 attempt looked for a single container holding the whole strip, but the card body that holds those fields also holds the results table, so the check rejected it and nothing changed on screen. The strip is now flattened per control: each field's own grid cell and the row holding it are targeted, so Search Faction rises onto the line with ID, Type, Flags and Filing Officer, Search Status and Submit New Incident shrink to the same 22px height as the fields, and every control shares one baseline. Tables, the arrest dialog, lookup pages, the side panel and the DataTables length picker are all skipped.

## 1.3.4

### Fixed
- The near black pill behind search widgets and their buttons on DMV Database and the map overlays. Dark, secondary, inverse and default buttons now use the classic button face with dark text, and search wrappers sit on the panel colour with a flat 1px border instead of a rounded dark block.
- Incident Database filter strip alignment. Material's column grid was dropping Search Faction, Search Status and Submit New Incident onto their own lines at inconsistent sizes. Strips that hold several fields plus an action button are now laid out as one wrapping row: every field and button is 22px tall on the same baseline, the action buttons are compact rather than oversized, and Submit New Incident sits inline with the controls beside it instead of below them. Tables, the arrest dialog and lookup pages are excluded so their layouts are untouched.

## 1.3.3

### Fixed
- Vehicle Map and Emergency Map pages. The skin's borders, backgrounds and scroll trimming were being applied to Leaflet's tile panes and controls, which broke the map surface and clipped the layer list so the bottom entries were cut off. Tile panes, markers and overlays are now left near stock, while the zoom buttons, layer box, popups and attribution are skinned to match the rest of the MDC. The layer control expands to its full height instead of scrolling.
- Dashboard stat cards sit further down the page instead of hugging the top edge, with consistent spacing between rows.
- DMV Database filter strip: the Class picker sat a few pixels below the text fields because bootstrap-select carries its own margins and a taller toggle. It is now the same 22px height and aligned on the same line as Make & Model, Identification Plate and the rest. Charge pickers in the arrest dialog keep their own sizing.
- Remaining flash of the vanilla page when switching pages. Two causes: the stylesheet watcher only started at DOMContentLoaded, so stylesheets the site loaded before that point were applied after the skin; and when the document element did not exist yet at preload time, the fallback waited on an event that fires far too late. The watcher now starts as soon as the document element appears, and the early boot pass retries immediately rather than waiting.

## 1.3.2

### Fixed
- Dashboard stat cards (Department Personnel, Department Vehicles, Logged Records, Posted APBs) no longer render as an inset tinted bar with a stray inner edge. The header sits flush inside the card, the coloured icon is a clean 46px square against the card border, the figure and its label are centred beside it, and the card keeps a single 1px frame with no rounding or shadow.
- Tab panels no longer break out past the tab strip. The panel is drawn as a proper framed box joined to the tabs above it, with the stray clipped borders and overflow gone.
- Person Lookup and ID Lookup fields are centred as a single column, and the Search button is forced to sit underneath them regardless of where it falls in the page markup. Field rows are capped at 320px so they line up with each other instead of drifting off to one side. This is scoped to lookup pages, so ordinary tabbed forms elsewhere in the MDC are untouched.

### Changed
- The skin no longer flashes on navigation. Previously each page painted vanilla first, then the skin, then the layout settings, because the skin waited for the host to report the current settings after the page had loaded.
- The active skin, side panel state and search box state are now remembered inside the page itself and reapplied at document start, before the page renders. The page is held back for that first moment against a background matching the skin, then revealed once the first styling pass has run, with hard fallbacks on load and a 1.5s timer so it can never stay hidden.

## 1.3.1

### Changed
- The navigation chips are bigger and now use the same styling as the Mobile Data Computer and Penal Code tabs: the same padding, borders and hover, and the one you are on is drawn as the raised active tab. Their icons are slightly larger too.

### Added
- The navigation bar is now an option under Tools > Options > Layout, listed as "MDC navigation bar". It stays on by default.
- The navigation bar and the site side panel are mutually exclusive. While the navigation bar is on, the side panel is hidden and locked: the Options checkbox for it is greyed out and disabled, the Side Panel toolbar button is disabled with a tooltip explaining why, and F10 refuses with a note in the status bar and an error tone. Clear the navigation bar and the side panel becomes available again.
- Turning the navigation bar on automatically switches the side panel off, and the chips hide when the navigation bar is off.

## 1.3.0

### Changed
- The MDC side panel is gone. Its links now sit as a row of icon chips in the app's own tab strip, immediately to the right of the Penal Code tab, and the strip wraps onto a second line when there are more chips than fit the window.
- The side panel is hidden by default now, and existing installs are switched over once on first run of this version. Hiding it widens the MDC page to the full window. View > MDC Side Panel (F10) and the Side Panel toolbar button still bring the site's own panel back if you ever want it.

### Added
- The skin reads the side panel's links (label, target, nesting depth) and hands them to the app shell, refreshing as the page changes. Submenu entries such as Person Lookup and DMV Database therefore get their own chips instead of hiding behind a group header, and group headers that only expand a submenu are dropped since they have no page of their own.
- Each chip gets a small glyph matched to its label (persons, DMV, wanted, incidents, arrests, maps, changelog and so on) and shows its full target in a tooltip.
- Clicking a chip switches to the MDC tab and navigates by clicking the site's own link where it is still on the page, falling back to a direct navigation, so MDC's own scripts keep running. The chip you used stays highlighted.

## 1.2.9

### Fixed
- Charge rows no longer collapse. The 1.2.8 row layout gave the picker columns a zero flex basis, and because each picker is sized as a percentage of its column that resolved to no width at all, which squashed the whole charge strip. Picker columns now get a real 160px basis with a 96px floor, and the pickers themselves a 90px floor.
- Charge row detection is scoped to a single charge. It could match a wrapper holding every charge at once and then force all of them onto one line; a container is only treated as a charge row if it holds two to four pickers and has no nested container that also qualifies.
- Charge pickers truncate with an ellipsis instead of forcing the row wider than the dialog.
- Revoke and Suspend sit side by side. Each was in its own block level wrapper, so they stacked; their shared wrapper is now a single centred non-wrapping row and every wrapper between it and the buttons is made inline, with `btn-block` / `d-block` / `w-100` width overrides neutralised inside licence cards.

## 1.2.8

### Fixed
- Charge rows in Add Arrest Report and Charges are laid out as one line each. The Bootstrap columns no longer fit the dialog, which stretched the fields unevenly and pushed the red remove button onto a line of its own; each charge is now a single non-wrapping row where the Charge / Addition / Class pickers share the free width and the icon buttons keep their own width. Selects and buttons in those rows are all forced to the same 21px height.
- The "Show 10 entries" length picker is a normal inline dropdown again instead of a tall square box, with the label and select on one line.
- Penal Code tab: quote and spoiler widgets were carrying fixed heights and absolute positioning, so section text ran straight through their borders. They are back in the normal document flow and size to their contents, and the empty "Quote" citation bars are hidden.

### Removed
- Penal Code tab: the topic event log is stripped ("changed the title to ...", "pinned this topic", "locked this topic", "featured this topic"), both by hiding the log container and by text match so it goes away regardless of markup.

## 1.2.7

### Fixed
- Add Arrest Report and Charges fits the window again. The dialog is now a fixed-height frame whose body scrolls, so charge rows and the Submit bar no longer spill outside the frame, and the charge host is no longer turned into a flex container (that was what pushed the Charge / Addition / Class fields past the edge).
- The "Time: 0 Days 0 Hours 0 Mins" readout gets its own line instead of sitting on top of the Penal Code / Charge buttons. This is applied through a separate marker so it also works in the arrest dialog, which otherwise keeps its vanilla layout.
- The Narrative editor no longer renders as a black slab. The summernote frame, toolbar, editing area and status bar follow the active palette, and the editing area has a sane height with its own scrollbar.
- Revoke and Suspend on licence cards are laid out as a centred row inside the card. Absolute positioning and floats are cleared, and the licence status line spans the full card width.
- Switching skins repaints everything. All painters cached their work per element and skipped nodes they had already touched, so a light-to-dark switch left stale light-palette paint behind. On a WANTED record this showed as a white content box under the banner.
- Penal Code tab on the dark skin: the same stale-paint problem is fixed there, hard-coded light backgrounds are neutralised, and spoilers, quotes, code blocks, rules and highlights follow the palette.

### Removed
- Penal Code tab: out-of-character editor notes such as "(( fixed duplicate 803 ))" are stripped from the text, and paragraphs that contained nothing else are dropped so no blank gaps are left between sections.

## 1.2.6

### Fixed
- Add Arrest Report and Charges is now left with its own layout. The skin recolours it but no longer changes button display, row alignment or absolute positioning inside it, which is what broke the charge rows. The row packer skips it as well.
- Penal Code tab on the dark skin: background colours that clash with the theme are replaced per element, so the forum's light quote boxes, tables and panels no longer show pale-on-pale or dark-on-dark text.

### Removed
- Penal Code tab: "Edited ... by ..." lines and their trailing notes.

## 1.2.5

### Fixed
- Charge rows in Add Arrest Report and Charges no longer spill behind the narrative editor. The skin no longer forces `overflow: visible` on relatively positioned dialog containers, and the charge row packer no longer changes the container's overflow or positioning.
- Penal Code tab icons render again. The forum skin no longer replaces the icon font on icon elements.
- Penal Code tab text colours are applied directly to the code text and page title, so the forum's own faint greys no longer show through.
- Wanted records now keep the panel border around the header card, matching records without a wanted banner.

### Changed
- Theme changes (Options, View menu, F8) now apply to the Penal Code tab as well as the MDC tab.
- The Penal Code button inside Add Arrest Report and Charges opens the Penal Code tab instead of navigating away.
- The MDC search boxes toggle now finds Search Person and Search Vehicle by their field labels instead of fixed element ids, so it works on every page that shows them.

### Removed
- Penal Code tab: topic author name, post date, parent forum link, pinned and featured badges, and the "This topic is now closed to further replies" notice.

## 1.2.4

### Added
- Penal Code tab. Two tabs above the page area switch between the MDC and the San
  Andreas Penal Code topic from the GTA World forums (Ctrl+1 and Ctrl+2, also
  under View). The forum page is stripped to the code text and skinned to match
  the app: forum header, navigation, breadcrumbs, footer, author panels, post
  controls, reactions, pagers and profile links are all removed.
- Forum sign-in happens in the tab like a normal browser, and the forum login
  page is left unskinned so it behaves normally. Sign Out of Forums clears only
  forum cookies and leaves the MDC session signed in.
- Search penal code box that filters sections as you type, highlights matches and
  reports the count in the status bar.

### Fixed
- Dropdown option lists scroll again, including Add Profiling Sample. All skin
  overrides on dropdown scrolling and sizing were removed; the site's own scripts
  size those menus when they open and any override broke them.
- The Add Arrest Report and Charges dialog has one scrollbar. The skin no longer
  sets any height or overflow inside dialogs, which is what produced the extra
  bars, and added charge rows scroll into view normally.
- The scrollbar no longer draws across page content: it is narrower, its space is
  reserved in the layout, and the scrollbar-trimming pass now skips dialogs and
  dropdowns and decides once per element instead of toggling every pass.
- Sounds no longer stack when a button such as add-charge is clicked repeatedly.
  Each tone has its own minimum gap and a clip that is still playing is never
  restarted.
- The double asterisks around emote text are hidden while the text inside keeps
  its purple colour. The original characters are restored under the Original MDC
  skin.

## 1.2.3

### Fixed
- Revoke and Suspend sit next to each other again. Any row whose children are all
  buttons is packed into a tidy left-aligned row with even spacing, so the site's
  floats can no longer push a pair of buttons to opposite edges of a card.
- Adding several charges works. Vertical scrollbars are no longer touched at all;
  the previous pass measured a container once and hid its vertical scrollbar,
  which clipped every charge added afterwards behind the narrative editor. Only
  redundant sideways scrollbars are trimmed now.
- Dropdown menus scroll again. They had been given visible overflow to stop
  carets being clipped, which also removed their scrolling, so long option lists
  such as Add Profiling Sample could not be reached.
- The plugin scrollbar rails that drew over page content are hidden, leaving the
  normal scrollbar.
- Field columns in dialogs line up: labels such as Type, Location, Status and
  Confidential Level are centred over their control.

### Added
- The MDC's own Search Person and Search Vehicle boxes can be hidden from
  Tools > Options > Layout. Hiding them does not affect the shell's own lookups,
  which still drive those fields.
- Optional interface sounds, off by default, toggleable in Tools > Options >
  Sounds: one tone for clicks and navigation, one for closing a dialog or going
  back, and an error tone for failed actions, failed loads and error messages.

## 1.2.2

### Fixed
- Notifications appear reliably and in the right place. The skin was forcing
  relative positioning onto the notification container, which overrode the
  library's own fixed placement and dropped each toast into page flow, so it
  surfaced half off-screen and then timed out.
- Dropdown buttons such as Suspend keep their arrow inside the box at any window
  size, and respond to clicks. Buttons are now laid out as flexible rows with a
  minimum height instead of a forced fixed height, carets sit in normal flow, and
  dropdown menus are no longer clipped by their button group.
- APB is treated as a caution code chip again instead of being painted as a
  WANTED banner. Caution chips are never painted as banners.
- Redundant scrollbars removed. Every panel, card, table and dialog is measured
  and a scrollbar is hidden only when its content genuinely fits, so records no
  longer scroll sideways and the arrest report dialog keeps one scrollbar.
- The charge rows in Add Arrest Report and Charges line up, and the
  "Time: 0 Days 0 Hours 0 Mins" line drops onto its own row instead of sitting
  underneath the Penal Code and Charge buttons.
- Restoring from the tray no longer leaves a frozen window. Background
  throttling is off, the taskbar entry is restored, and the window is nudged so
  the embedded page repaints.
- Keyboard shortcuts work again while the page has focus. Key presses inside the
  embedded page were never reaching the shell; recognised shortcuts are now
  forwarded to it, including Ctrl+F, F8, the other function keys and zoom.

## 1.2.1

### Fixed
- WANTED is now a flat red bar spanning the full width of its panel, rather than
  a small centred pill.
- The Age field has its background fill and border removed and reads as plain
  text, matching the Criminal Points strip.
- Dialog controls share one height. Buttons, selects and inputs in the Add
  Arrest Report and Charges window line up, badges sit on the text baseline, and
  absolutely positioned buttons inside dialogs fall back into normal flow so
  they no longer cover the "Time: 0 Days 0 Hours 0 Mins" line.
- Sidebar rows no longer show a grey block behind their text on hover.

### Added
- Text wrapped in double asterisks renders in italic purple, following the `/me`
  emote convention, wherever it appears in a record.
- The side panel toggle is now a labelled **Side Panel** toolbar button. The
  previous glyph-only button was effectively invisible.
- `CHANGELOG.md`.

### Changed
- The Inno Setup walkthrough has been removed from `README.md`, which now just
  notes where the build output and the script live.

## 1.2.0

### Added
- Optional minimize to the notification area, off by default, toggleable in
  Tools > Options > Window. Closing or minimizing hides to a tray icon with Open
  and Exit commands.
- `installer/mdc-client.iss`, an Inno Setup script that packages
  `dist/win-unpacked` into a per-user installer with a fixed AppId, optional
  desktop and Start menu shortcuts, and a preserved session folder on uninstall.
- The side panel toggle appears in Options alongside the other layout switches.

### Changed
- Every comment removed from every source file; all documentation moved to
  `README.md`.
- WANTED painted red with a short line height.
- The "Connected" cell removed from the status bar, along with the code feeding
  it.

## 1.1.0

### Fixed
- The dialog close button sits in the top right corner with a red glyph instead
  of inline beside the centred title.
- Notification banners rebuilt: solid background, icon clear of the text, and
  the dismiss button centred on the right edge.
- Menus close when the pointer leaves the menu bar, after a short grace period,
  instead of staying open until something is clicked.
- WANTED and Criminal Points are found by their text rather than by guessed
  selectors, so their grey frames are finally removed.

### Added
- Show/hide for the MDC side panel: toolbar button, View menu, F10.

### Removed
- The Message of the Day colour pickers.

## 1.0.0

### Added
- Electron shell around <https://mdc.gta.world/>: native title bar, menu bar,
  toolbar, find bar and status bar, with the site in an embedded view.
- Sign-in through the page itself; credentials are never requested or stored.
  Cookies persist in a fixed session folder.
- Three skins: Classic Light, Classic Dark and Original MDC, switchable from
  View, Options or F8. Sign-in pages are never skinned.
- Name and plate lookups that drive the MDC's own search boxes.
- Find on page, zoom, print, navigation shortcuts and a Layout Report tool.
- Custom application icon and a renderer smoke test.

### Renamed
- From "MDT Terminal" to "MDC Client", with the session folder pinned so the
  rename does not sign the user out.
