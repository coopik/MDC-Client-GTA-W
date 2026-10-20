# Changelog

## 1.1.2 - 2026-10-20

- Use each Aero palette's glass hover and pressed states for page-tab close controls, keeping the X readable.
- Match Aero LAPD's minimized-record dock to its blue nav and page tabs, with light text, distinct active/hover states, matching close controls and a slightly lighter record-color strip. Other dock palettes and behavior are retained.
- Protect icon font declarations from generic skin font shorthands, including generated glyphs. Restore Incident add-person/trash icons and give shared create-page actions compact button faces and consistent label-chip spacing.
- Suppress Perfect Scrollbar's added rails within bootstrap-select menus so the existing themed native inner-list scrollbar is the sole visible scrollbar. Keep fixed height, pinned search, wheel containment, dragging and keyboard navigation.
- Add supplied Incident linked/person panel fixtures and the MDC's actual scrollbar plugin to release verification.

## 1.1.1 - 2026-10-19

- Match search-row fields and actions at 26px, with aligned baselines, fonts and borders across skins. Keep readable button colors.
- Preserve native Material ripple opacity and circular decoration inside header buttons. File Warrant no longer becomes an opaque white block when clicked.
- Freeze the existing selectpicker viewport at open, choose the roomier direction and show a themed native scrollbar. Scroll and filtering reuse the saved height; only reopening and actual window/popup size changes refit it. Restore native behavior and styles on close or skin removal. Resolve the owning picker rather than its nested menu UL, so wheel boundaries cannot scroll the form. Keep search pinned, keyboard highlights visible, wheel input isolated, and apply the same behavior to Charge, Addition and Class.
- Add native Material Design/ripple coverage and repeated bidirectional-scroll checks with zero refits across all skins.
- Contain picker wheel input in the page context beside the native picker, including short lists and list boundaries after navigation/export activity.

## 1.1.0 - 2026-10-19

- Alerts use each skin's light list highlight, dark readable text and preserved status colors; History keeps its matching highlight.
- Long bootstrap-select menus show a themed native scrollbar; wheel input stays in the list while the plugin retains height and placement. Arrow navigation measures the highlighted row to keep it fully visible after scrolling.
- Post Arrest badges have equal widths and spacing. Table data cells remain light in Default, wrap inside their columns and retain readable skin colors. Collapse buttons draw their minus on form pages too.
- Copy exports white paper with loaded fonts and rasterized icons, using a separate document measured after layout. The full submission, including notes and signature, survives capture without changing the live page.
- Summernote Video, Link and Image dialogs have properly positioned close buttons, normal fields and compact red actions; genuinely disabled actions are grey.
- Editor toolbar buttons and dropdowns share a 26px minimum height and aligned icons/carets, including font, style and table controls.
- Search-bar actions have clear button borders, readable text/icons and hover/pressed states in Default and Aero skins.

## 1.0.26

- Audit native Charge interactions in both supplied arrest and warrant forms. Restore readable 10px code badges with explicit text-fill colors and contrasting red/orange/dark/green fills. Guard Arrow/Enter navigation in empty or no-results lists to avoid the vendor's missing-position error; retain native selection, search and scrolling. Escape closes an active picker through its native handler without also closing the parent form; a later Escape keeps native form behavior.
- Pass each popup body's usable boundaries to bootstrap-select's native windowPadding option. Use its dropup and list sizing, pin to the measured menu height, and keep menus clear of the footer. Restore native options on dismissal or skin removal; do not add menu overflow/max-height rules or extra scrollers.
- Size selectpicker menus to their selector's width, clamp to visible space and align their left edges. Observe button/body resizing, remeasure again at resize-grip release, and remeasure filtered lists without changing native form grids or working license-menu forms.
- Detect printed report tables by their own merged document title and field grid, independent of their parent section. Give History versions, comparisons and previews the same white serif paper, 14px values, 10px labels and 16px title as the main viewer. Exclude live editors and leave operational tables alone.
- Dismiss shared status panels on shell/guest outside clicks, focus, Escape, window blur, menus, tools and page changes. Send a small preload signal for webview interaction; consume guest Escape only while a shell panel is open, preserving other page shortcuts.
- Preserve original notification text-color classes and explicit color spans as safe structured text. Reuse the MDC's semantic hues and adjust lightness for at least 4.5:1 contrast on each skin's normal and hover backgrounds. Keep labels and layout unchanged; no status-word matching or remote HTML insertion.
- Add native interaction regressions for both charge pickers, all four skins, no-results keyboard handling, selector widths/resizing, original notification hues, panel dismissal and documents under arbitrary parent sections.

## 1.0.25

- Apply the existing white serif paper-form styling to full-page View Record cards and read-only supplemental/document previews, including arrest, citation, infraction, impound and warrant documents. Keep editors native and raise full-page surrounding details to 13px.
- Restore native modal body scrollbars when Material Dashboard's Perfect Scrollbar class hides overflow. Keep native height caps, resize behavior and wheel isolation; do not add a scroller or change page/webview sizing.
- Apply compact shared control metrics inside native forms: 28px action buttons, joined 30px icon/select controls, unpainted selectpicker wrappers and contained charge removal. Preserve the arrest form's Bootstrap grid, display and positioning.
- Repair searchable selectpicker field, placeholder, hover/selected and group-header contrast using each skin's paired colors. Keep semantic charge badges and native menu scrolling/actions.
- Add sanitized full-page record/arrest form fixtures and Electron checks for paper scopes, readable metadata, PS modal scrolling, resize/short/narrow cases, input-group geometry and searchable-menu contrast in all four skins.

## 1.0.24

- Restore the v1.0.22 dock styling from the archived project: theme panel background, button-face tabs, theme text and border colors, original hover/pressed states and the 3px record-type strip on the left. Remove the navigation-gradient backgrounds, sand selection, bright bottom strips and red close hover introduced in 1.0.23.
- Keep minimize/restore behavior, shell-owned records across navigation, reserved dock space and the page scrollbar fix unchanged.

## 1.0.23

- Match the record dock to Default navigation gradients and each Aero palette. Add sand/glass selection, white-on-dark captions, brighter 3px type strips and red close hover states. Highlight the most recently minimized record while keeping the existing restore/close behavior.
- Restore the page scrollbar for Material Dashboard Perfect Scrollbar panels. The skin hid the custom rails, but its combined dialog/PS fallback lost native overflow declarations in the dialog protection pass. Give page panels a separate 8px native scrollbar fallback, retaining palette styling and reserved space. Remove the root-overflow measurement routine.
- Keep minimized-record descriptors in the client shell per MDC page tab. Navigation, reload and skin changes retain IDs, titles, type colors, source URLs, geometry and simple scroll offsets; no old document DOM is kept across navigation. Closing a client page transfers its minimized records to a remaining page.
- Restore live windows in place when possible. After navigation, use the current page's delegated native View Record action; fall back to the saved source page when it has no viewer. Reopening reloads saved data, reapplies geometry and scrollbar offsets, and keeps a retryable tab if opening fails.
- Warn before minimizing a record containing editable fields. Unsaved edits cannot survive navigation. Preserve existing Escape behavior; sign-out clears all minimized records.
- Add tests for visible scrollbars with dock/resizing across skins, cross-page native reopen, reloads, skin changes, fallback, editor warnings, retained failures and sign-out.

## 1.0.22

- Add a View Record-only minimize control matching maximize/restore and close in every skin. Keep other client tools and MDC dialogs close-only.
- Add a compact, horizontally scrollable dock below the active MDC view. Reserve its space through the existing client layout and ResizeObserver, with short subject/record titles, record symbols and available type colors.
- Keep minimized records alive with their content, scroll positions, size, position and maximize/restore state. Preserve independent records when the MDC reuses its native viewer; restore brings only the selected record forward, and each dock X closes without restoring.
- Preserve docks when switching client pages and during same-document navigation. Clear destroyed records on document navigation or removal. Exclude minimized records from focus traps and active stacking so page Escape does not close them.
- Add Electron regressions for matched controls, three simultaneous records, out-of-order restoration, dock closing, native reopen, scroll/geometry, maximize state, reserved space and navigation cleanup.

## 1.0.21

- Remove maximize controls and title-double-click maximization from every client tool, including History, Options and Keyboard Shortcuts. Keep movement, closing and existing resizing. The main Electron window retains its native controls; HTML tool dialogs no longer cover its native overlay with maximized tool chrome. There are no native secondary BrowserWindows.
- Restrict page maximize controls and double-click behavior to View Record titles, including retained record copies. Reconcile controls when a native viewer changes title.
- Draw a larger window-frame maximize glyph with a thick top edge and two overlapping frames for restore. Center title text and matching close/maximize controls in the header.
- Exclude menu options from both banner painting and ancestor frame stripping. Normalize shared badge-item padding, typography, borders and vertical spacing while retaining semantic colors and native menu actions/scrolling.
- Add native status, classification and record-type source fixtures; extend Electron checks for close-only tools and consistent badge geometry.

## 1.0.20

- Make lookup, About and notification client tools fixed-size with no maximize control or resize grip. Keep resizing and maximizing on the larger client tools.
- Match popup maximize and close dimensions, alignment, spacing, corners and interaction states. Account for native close buttons nested inside the title.
- Keep popup drag bounds at the MDC viewport edge. Retain maximize as the safe alternative to crossing into client chrome; expanding the webview would reflow the page, and moving editable popups into another renderer would break their native lifecycle.
- Stabilize Summernote toolbar dropdown padding and caret geometry through native open/pressed states, including compact empty color dropdowns on authoring pages.
- Use the supplied person-record source: hide the two semantic no-divider HRs in paired profile columns without layout space; constrain the nested vehicle rows whose negative margins made their bottom borders protrude. Preserve phone and other intentional dividers.
- Add source-based person-record review fixtures and Electron MCP review mode; verify PremierOne and Aero on screen.

## 1.0.19

- Correct two-control client lookup rows so the field gets the available width and Run stays label-sized, aligned to the input height even at narrow window widths. Keep history and other toolbar layouts intact.
- Apply compact button dimensions to ordinary create/edit form actions without re-enabling generic form packing. Status, Classification, Victim and linked-item actions retain their skin palette and native placement; editor toolbars, full-width controls and the protected arrest charge dialog keep their existing sizing.
- Confirm that record title bars already reach the embedded viewport top. Keep the drag limits and add maximize/restore buttons plus title-bar double-click to MDC popups and client tools. Preserve previous geometry, native scrolling and paper styling, including after resizing and page scrolling. Restore native state on close or Original MDC, and retain movable report copies when a maximized viewer is reused.
- Extend Electron checks for compact controls, narrow lookup rows, maximize/restore and source-based viewport measurements. Retain the released thin, contained card-divider geometry.

## 1.0.18

- Replace minimum-height-only popup resizing with a definite frame height and a flexible existing body. Explicitly resized MDC dialogs release the body's opening height/max-height cap, grow and shrink with the frame, and reconcile late native height writes. Keep native overflow behavior and restore exact original values and priorities on close or Original MDC.
- Anchor resizing to the visible header so centered dialogs do not jump as their dimensions change. Refresh drag bounds from the visible title bar on every gesture, allow all viewport edges and keep the entire title bar reachable. Remove the client dialogs' hard-coded top inset.
- Give client tools, including Name Check, Plate Check and History, matching corner resize grips and flexible bodies. Reused client windows reset their size and position.
- Hide only empty trailing separators after the final Criminal Points fields in recognized profile details columns, including empty separator wrappers. Remove their layout space and restore them in Original MDC; retain dividers in other cards.
- Add sanitized View Record modal source and pointer-driven resize/drag regressions across skins, including growth, shrinking, movement after resize, centered wrappers, late height writes, native restoration and client tools. Check profile separators against the exact separator-free card height and preserve the paper report styling.

## 1.0.17

- Enlarge the top MDC/Penal Code/DEPA/SHAFT tabs with more height, horizontal padding and larger text. Keep the icon bar below all tab rows when the strip wraps, across every skin.
- Keep create/edit pages out of filter-strip packing and broad form geometry overrides. Restore the supplied Incident page's native label/field order, classification details, Narrative section and right-hand map. Refresh layout protection when switching skins, and preserve the arrest editor's grid and absolute controls under README rule 25.
- Reset card/panel dividers to thin, contained lines with no negative margins, excess width, padding or painted fill, including dividers on authoring pages.
- Synchronize menu accelerator labels with the saved keymap, including cleared, reassigned and reset shortcuts. Use nav.mp3 for navbar and law-page navigation keys, suppressing the extra click emitted by programmatically activated native links.
- Exclude printable document roots in read-only View Record popups from skin selectors and profile/contrast helpers. Restore full-width white paper, serif text, black grid borders and consistent label/value hierarchy while keeping popup chrome themed. Preserve form structure and authored content; apply print-only unclipping and page spacing without changing screen scrolling.
- Add sanitized Incident source markup and Electron coverage for wrapped tabs, create/edit page geometry, arrest editor protection, card dividers, paper records and printing, plus menu remapping and navigation sound routing.

## 1.0.16

- Center the nested Material error icon from the supplied notification source without changing Bootstrap Notify placement, timers or handles.
- Remove decorative evidence magnifiers from warrant forms. Paint charge/class selectors as one surface, keeping native dropdown sizing and scrolling.
- Replace style-substring descendant selectors with stable authored-color/font markers, skip native option-list content in broad skin rules and avoid repeat skin/pinning work for dropdown updates. The 350-option fixture reduced charge-list style recalculation from about 2–3 seconds to roughly 65–125 ms across custom skins.
- Make every discovered navbar destination bindable, show assigned combinations in the top-right of its button and add Clear controls. Reassigning a default key disables the previous action instead of silently restoring it. Add configurable MDC/Penal Code/DEPA/SHAFT bindings, defaulting to Ctrl+1 through Ctrl+4.
- Route mouse-wheel input within shown record windows through their existing scroll containers and contain scrolling at their boundaries; no scrollbar, overflow or height policy is added.
- Remove the empty bordered tails from header-only statistics cards.
- Apply one saved zoom factor to all MDC and law pages in 10% steps from 50% to 200%, with Ctrl+0 reset. Normalize key combinations consistently in chrome and sandboxed preloads, coalesce zoom updates per frame and observe content resizing directly. Rail resizing moves to Alt+Left/Right and Alt+Home so Ctrl+Plus/Minus always zooms.
- Add actual notification-library fixtures, large dropdown timing checks, shortcut/zoom/wheel interaction tests and an isolated real-entry-point memory measurement tool.

- Correct nested dashboard search headings, including the vehicle heading's trailing margin, and keep magnifiers centered after the site replaces their contents.
- Keep license suspension forms visible beyond their cards and anchored to the Suspend button, with coverage for one and multiple licenses.
- Render profile labels as plain transparent text and align paired label/value rows when jail time wraps. Keep the duration with Jail Time and the partner record with Partner.
- Apply compact, scoped layouts to the actual arrest, search, electronic surveillance and financial services warrant forms. Align date/time/location, keep suspect controls at a consistent width, and contain dynamically added charge and evidence editors with small remove buttons.
- Add sanitized fixtures extracted from the supplied dashboard and warrant HTML, using the site's public Material Dashboard/custom CSS and Bootstrap Select assets with real Bootstrap 4 Summernote.

## 1.0.15

- Add DEPA and SHAFT Act tabs beside Penal Code, using the supplied official forum topics, shared forum skins and independent search state.
- Style Bootstrap and standalone Summernote font menus with readable theme colors, normal casing and preserved font previews across all custom skins.
- Center lookup magnifiers across all custom skins, use responsive warrant date/time/location groups and preserve hidden editor source textareas.
- Remove the default skin's document-wide lookup dependency. Batch contrast measurements before applying repairs and reuse background measurements within each pass to reduce repeated style recalculation.
- Center notification exclamation marks with a vector glyph inside the badge. Restore every notification's site-selected placement and retain its original validation message, timers and handles.
- Remove native icon translations from PatrolOne default lookup actions so the vehicle magnifier stays centered before, during and after a click.
- Preserve authored font families and HTML font faces in Summernote, font previews and saved reports. Apply the skin's editor surface and default ink over the native dark editor face while preserving chosen text colors and highlights.
- Preserve native warrant form geometry, including Bootstrap columns, stacked suspect fields and date/time/location groups. Exclude warrant forms from charge-row detection and generic layout overrides; keep skin colors and borders.
- Extend Electron checks with actual Font Awesome glyphs, magnifier press/release states, unchanged native notification placement, the Summernote font menu and representative warrant form geometry across all four custom skins.

## 1.0.14

### Lookup controls and errors
- Give PatrolOne default fields and placeholders consistent 12-pixel Tahoma text and 26-pixel inset faces. Match the clickable magnifier parent, constrain both actions to a 28-pixel width and keep their geometry stable before and after native click/ripple initialization.
- Request Bootstrap Notify's body-mounted top-right stack for no-result lookup errors on custom skins. Preserve native update/close handles, timers and callbacks. Keep Original MDC and unrelated notification placement unchanged; do not override notification-container position in CSS.
- Verify real Bootstrap Notify stacking, containment, callbacks and automatic dismissal across custom skins. Check initial-frame magnifier sizes despite different native inline widths.

### Performance
- Cache generated styles by skin. Ignore clock, editor, ripple, tile and notification-only mutations, coalesce content-driven styling and exclude the skin's own edits from its observer.
- Replace recurring dropdown, image, source-textarea and dialog-grip scans with relevant DOM/event updates. Prevent duplicate map-search observers and reduce repeated theme/widget work in contrast repair.
- Add a 200-row Electron CPU/metrics fixture with clock and hover workloads and include its regression checks in full verification. In the initial four-second clock comparison, script time fell from 1,305.8 ms to 6.2 ms; these are fixture measurements, not an overall application speed guarantee.

## 1.0.13

- Correct the overly narrow PatrolOne default lookup selectors introduced in 1.0.12. Identify Search Person/Vehicle controls by their labels and existing adjacent actions, including standalone magnifier links outside navbar/form wrappers and fields with different IDs or placeholder spacing.
- Give matched fields a warm inset face and their existing actions visible beveled styling. Reapply to replacement controls and remove markers on other skins without replacing native handlers or markup.
- Add coverage for both navbar forms and standalone search strips, real magnifier link handlers, dynamic replacement and stock restoration.

## 1.0.12

- Polish the native Search Person and Search Vehicle fields only on PatrolOne default: compact Tahoma text, inset field borders, readable placeholders, gold focus outlines and matching beveled search buttons with visible icons.
- Show dialog resize grips only while their corner is hovered or a resize is in progress. Keep the existing hit target, pointer capture and native dialog scrolling.
- Verify lookup styling and native submission, grip hover visibility, pointer resizing and Original MDC restoration alongside the existing Electron regressions.

## 1.0.11

### Floating report cleanup
- Keep the floating workspace active until its last report closes. Ignore hidden viewers, clear their cached reports and finish the native modal lifecycle when a viewer is hidden directly by the site.
- Track workspace backdrops through native transitions, release stale focus traps and remove leftover modal locks after all reports close. Preserve the page's original padding and native confirmation behavior.
- Stop retained report close/Escape events from reaching native modal dismissal handlers. Limit modal observation to relevant window changes.

### Recent records and editor controls
- Scale record labels, timestamps, icons, caption, History button and spacing with the saved rail width. Wrap long labels. Dragging and focused Ctrl + / Ctrl - now resize the content as well as its column.
- Repair editor toolbar button faces, font-name labels and icon ink across custom skins, including hover, pressed and disabled states. Preserve authored report colors, native editor fonts and color palettes.
- Give Vehicle Map a distinct illustrated patrol-car map icon while Emergency Map keeps its location-pin map.

### Validation
- Add real pointer and wheel checks after repeated report closures in different orders across all custom skins, including moving retained copies, Escape, direct display hiding and native padding restoration.
- Check scaled record text, metadata and icons with mouse and keyboard resizing, distinct loaded map assets and editor toolbar ink/pressed states alongside existing cropper and color-picker regressions.

## 1.0.10

### Reports and dragging
- Preserve moved read-only reports when the MDC reuses its single View Record dialog for another arrest report. Keep retained reports independent with unique IDs, separate closing and existing drag/resize behavior; new reports use the native viewer and appear in front.
- Keep editable forms and submission handlers native. Remove supplementary report viewers when Original MDC is selected.
- Stop Bootstrap transform easing during an active drag, compensate the initial scrollbar shift and defer expensive page styling until release. Restore normal show/hide transitions afterward.

### Page styling
- Repair nested notification icon ink, including inline white glyphs, across custom skins without changing library placement or lifecycle.
- Keep Missing Person table labels out of profile-banner styling. Use dark gloss incident/paperwork tabs with readable icons and a beige selected tab; repair the native DataTables SHOW selector and options.
- Contain non-dialog Bootstrap row gutters, warrant tables and incident maps inside their cards without adding dialog scrollers or changing charge grids.
- Remove the forum theme's cPost header pseudo-element that paints the gray bar across Penal Code seals.

### Recent records and release tools
- Add a draggable rail divider, keyboard width adjustment with Ctrl + / Ctrl - when focused, arrow-key adjustment on the divider, Ctrl+0 reset and saved width. Keep normal page zoom bindings elsewhere.
- Keep rail dragging over embedded webviews reliable with a temporary input surface.
- Add RELEASE-COMMANDS.md with explicit source-only Git commands and a Build-Inno.ps1 helper for dependency checks, UI verification, Windows x64 packaging and Inno Setup compilation.

### Validation
- Reproduce asynchronous updates to the same report viewer, preserving three separate reports and their narratives, unique IDs and independent closing.
- Verify exact pointer tracking, restored transitions, nested notification ink, tabs, SHOW options, card containment, the real forum pseudo-element and rail mouse/keyboard resizing across skins.

## 1.0.9

### Window chrome and notifications
- Match each title strip to the native Windows caption-button surface, removing the gradient seam at minimize, maximize and close.
- Remove full-window dimming and input blocking from client tool windows. History, Options and other tools can remain open independently with unique control IDs, retained values and click-to-front behavior.
- Replace client and MDC dialog close glyphs with centered crossed strokes, including Aero's glass close button. Improve the History filter layout at narrow window widths.
- Restyle real MDC notifications with a colored edge, readable icon badge, stacked title/message text, padding and a centered dismiss button. Preserve library positioning, anchors and animation behavior.

### Floating MDC dialogs
- Enable background interaction after a normal MDC dialog is moved. Open different MDC dialogs together, bring them forward by clicking and close one while keeping the others and their values.
- Release Bootstrap focus traps in the floating workspace, including newly opened dialogs, and restore native focus settings when leaving it or selecting Original MDC.
- Optimize both client and MDC dragging with pointer capture, cached bounds and one transform update per animation frame. Handle pointer cancellation and window blur without leaving a drag active.
- Keep native form instances and submit handlers. Use existing client pages for records that require separate full-page navigation.

### Penal Code
- Contain seals and short captions with clear spacing; convert adjacent empty decorative bars to dividers and cap image height.
- Refine headings, tables, quotes and typography to match the selected skin. Preserve search and restore authored inline values when removing the skin.
- Avoid rebuilding unchanged CSS and batch forum mutation work into animation frames.

### Validation
- Add actual Bootstrap 4 dialog tests for pointer dragging, background focus, independent form values, stacking, closing and Original MDC restoration.
- Check simultaneous History/Options windows, unique IDs, notification geometry and library anchors, caption color matching, and Penal Code seal/divider spacing and filtering across all custom skins.

## 1.0.8

### Readability and interaction fixes
- Repair invisible neutral text in report templates, MOTDs and incident tables against the actual skin background, including gradient headings. Keep authored chromatic colors and editor formatting intact, and restore original inline color priorities when changing skins.
- Capture the dialog resize pointer through release, preserve the resized frame and prevent that release from dismissing the dialog. Leave modal-body scrolling to the site.
- Normalize Ctrl+=, Ctrl+Shift++ and keypad +/- for zoom. Persist one zoom level across views, reloads and new pages.
- Draw centered geometric plus/minus symbols over the site's changing collapse state instead of relying on font glyph alignment.
- Guard label cleanup while the document parser has not yet created the body.

### Dispatch interface
- Rename PremierOne to PatrolOne default in menus, Options and status text while retaining the saved p1 key.
- Use distinct illustrated icons for Online Warrants, Warrants Database and Active Warrants; add matching icons to every bottom action.
- Move History and Alerts into the status strip and reserve the full native title-bar height, keeping them clear of Windows controls.
- Make History open the searchable local visit log directly, with category filters, illustrated keyboard-accessible rows and clearer spacing.
- Show real MDC alert links, timestamps, unread emphasis, loading and empty states. Opening Alerts no longer clears its unread count locally; close stale panels on page changes.
- Replace duplicate quick navigation with a deduplicated recent records rail. Reuse already open record pages, support right-click opening and retain a full History entry point.
- Continue the reference's compact Tahoma, warm gray, black gloss and beveled controls across the default skin; retain the matching Aero glass layouts.

### Validation
- Extend isolated Electron checks to report/MOTD/incident contrast on every custom skin, resize-release persistence without added scrollers, History filters, actual alert counts, distinct navigation/action icons and keyboard zoom across navigation.

## 1.0.7

### Interface
- Match the PremierOne reference more closely with warm gray panels, compact Tahoma typography, a light window title bar, black gloss navigation and beveled bottom actions.
- Bundle illustrated SVG navigation and shortcut icons locally, replacing the shell's remote monochrome icon font.
- Remove the redundant toolbar row, its settings and F9 address-bar toggle. Keep File / View / Tools / Help and the Name Check / Plate Check windows and shortcuts.
- Remove the shell's three-line account Menu button. Make the MDC officer label transparent on custom skins.
- Add bevels and clearer pressed states to record action buttons. Center panel plus/minus controls and the new-page plus button.

### Mugshots and report colors
- Leave native Cropper.js widgets outside skin selectors instead of clearing the library's CSS with an important reset. Remove the disabled replacement cropper and delayed resets that could erase native crop controls.
- Preserve authored inline and HTML font colors in editors and displayed reports, including inherited colors and highlights. Skip authored content during contrast repair.
- Leave color-palette styling and swatch sizes to the editor, preserve its icon font, and remove periodic swatch/background rewriting.
- Stop applying skin overflow and maximum-height declarations to dialogs, dropdowns and editor scrolling containers so palettes remain reachable.

### Original MDC
- Restore the stock page sidebar, search boxes, account controls and styling. Hide custom navigation and remove injected visual styles and resize grips when Original MDC is selected.
- Keep custom layout preferences for switching back to a custom skin without applying them to the stock page.

### Validation
- Add actual Cropper.js and Summernote fixture checks for mouse dragging, resizing, repeated image selection, exported crop pixels, color-palette clicks, saved report colors and highlights, and stock-page restoration.
- Verify name/plate checks after toolbar removal, local icon loading and centered panel controls alongside existing navigation and skin regressions.

## 1.0.6

### Sidebar visibility
- Apply saved sidebar hiding at document start, using a document observer when the parser has not created the root yet, including with Original MDC.
- Correct the reversed sidebar and search visibility values sent at dom-ready. Loading and finished pages now receive the same state.
- Cover navigation chips, quick shortcuts, page links, back/forward, reloads, context-menu pages and site popups. GTA World popups open as new client pages.

### Skins and layout
- Keep PremierOne, Windows 7 Aero, Windows 7 Aero LAPD, Windows 7 Aero Dark and Original MDC. Remove the Classic Light, Classic Dark and LAPD Mobile choices and their dedicated shell styling.
- Make PremierOne the default and migrate retired or unknown saved skins to it in both the shell and MDC preload. Preserve the internal light fallback palette and move navy/graphite palettes directly to their Aero skins.
- Give all Aero skins the full-width icon navigation, left shortcut rail, status strip and bottom action bar, rendered in matching glass colors.
- Refine navigation spacing, icons, active/pressed/focus states, panels, tables, dialog colors, scrollbars, menus and the window title bar. Keep native Windows window controls.
- Name quick shortcuts after real MDC destinations and disable unavailable destinations. Remove the decorative green availability light. Rename Detach to Open as New Page and Create Report to Paperwork to describe their actual behavior.
- Keep active navigation highlighting in sync with links, history navigation and page switches. Back and Forward action buttons reflect available history.

### Validation
- Extend smoke coverage to retired-skin migration, F8 order, Options, actual menu actions and consistent load-time visibility messages. Include forum-preload syntax checking and report caught startup errors.
- Add isolated Electron fixture checks for document-start and animation-frame sidebar visibility across navigation paths, the five skins, responsive layout, forum layout and unskinned sign-in pages. These checks use a separate temporary profile and no live MDC account.

## 1.0.5

### New skin: PremierOne
- Added a PremierOne skin, modelled on a dispatch terminal. Pick it under View, Tools > Options, or cycle to it with F8.
- The MDC navigation sits in a full-width black icon bar. The active page is highlighted in sand, like the pressed button on a CAD toolbar.
- Quick shortcuts move to a rail on the left, one row each with its icon.
- A status strip runs under the icon bar: the signed-in officer, unread alerts, the posted APB count from the dashboard, open pages, the current status line, and the date and time.
- An action bar along the bottom has Back, Forward, Reload, Emergency Map, Create Report (opens Paperwork Generators) and Detach (opens the current page again as its own page).
- Inside the MDC, panel and dialog headers are black with small capitals, tables have black header rows and tighter rows, primary buttons are red, other buttons are flat grey, and links are dark red. Text areas use a monospace face.
- Everything in the layout maps to something the MDC already has. Nothing is local-only, so there is no Enroute, Arrived or Self Initiate.
- Penal Code tab uses the light palette under this skin.

## 1.0.4

### Interface
- Fixed the About dialog buttons: "Update Now" and "Open Release Page" no longer push their text outside the button box, and the update panel wraps cleanly in a narrow dialog.

### Paperwork
- Fixed the text colour / highlight picker in the report editor: colour swatches now show their real colours again instead of painting over as blank buttons, and the palette opens at full width with both Background and Foreground columns visible.
- The custom colour field in the picker renders as a proper colour input again.

### Navigation
- The navigation bar now uses Font Awesome solid icons, with a much wider icon map (dashboard, person lookup, APB, paperwork, post arrest, active warrants, warrants, emergency, DMV, maps, databases, penal code, profile, sign out and more).
- Nav tabs got tighter icon alignment, a clearer active tab with an accent bar, and the sign-out tab keeps its own styling.
- If Font Awesome cannot be reached, the client automatically falls back to its built-in glyphs so the bar never renders empty.

### Skins
- Windows 7 skins now use an authentic two-tone Aero gloss with the hard highlight break at the vertical midpoint, matching real Aero glass on panels, headers, buttons and title bars.

## 1.0.3

Images
- Imgur images in APBs, records, warrants and everywhere else are now loaded through an image proxy, so pictures that are region blocked (the purple "Content not viewable in your region" placeholder) display normally.
- If the first proxy fails the client automatically tries a second one, then the original link.

Windows
- Fixed the client freezing after restoring it from the tray with a single click. The window is re-enabled, un-minimised and focused properly instead of coming back in an unresponsive state.
- Minimising to tray no longer leaves the window in a hidden-but-minimised state, which was the cause of the freeze.

Paperwork
- Charge and infraction pickers now open above the narrative editor and its toolbar instead of being painted behind them.
- While a picker is open, the surrounding charge row is lifted out of its stacking context and restored again on close, so nothing else in the report window changes.

- Fixed empty charge and infraction pickers introduced in 1.0.4. Menus are no longer detached from the page, so the option list renders normally again.
- Fixed the Summernote colour palette, which appeared misplaced and blank in 1.0.4.
- Charge and infraction pickers are now pinned to the screen while open, so they are no longer cut off by the edge of the report window and show the full list no matter how small the window is.
- Removed the duplicated scrollbar in the pickers. Only the option list scrolls now.
- Kept the 1.0.4 narrative fix that clears the stray white band at the top of the editor.

- Charge and infraction pickers now open as floating lists that are no longer clipped by the report window, so the full list is visible and scrollable regardless of window size.
- Removed the duplicated scrollbar inside charge and infraction pickers; only the option list scrolls now.
- Picker lists flip above the field when there is not enough room below, and follow the field when the window is moved, resized or scrolled.
- Long option labels wrap instead of being cut off.
- Removed the stray white band that appeared at the top of the narrative editor.

### Paperwork

- Text typed into a narrative field is no longer shown centred while you write. It now sits to the left, matching how the record reads once it is submitted. Anything you deliberately centre yourself still stays centred.
- Charge and infraction pickers open at a usable size again. The charge box no longer clips the list, so you can scroll the full set of charges instead of seeing a single line.
- Long charge names wrap instead of being cut off.
- Charge rows now line up inside their box: the pickers share the width evenly, the remove button stays at its natural size, and each row is spaced from the next.

### Windows

- Popped up windows can be resized. Grab the grip in the bottom right corner of any window and drag to make it wider, narrower, taller or shorter. The size resets when the window is closed.

### Windows 7 Aero skins

- Fixed the colours of the paperwork window. The narrative editor, its status bar and the charges box now use the same glass field colours as the rest of the window instead of staying dark.

### Fixes

- Form pages on the Classic and Windows 7 Aero skins now match the layout the MDC uses on its own default skin: each label sits on its own line above a full width field, rows keep their natural columns, and the map stays in its column on the right. The previous build let the skin squeeze labels and fields onto shared lines and cut off field text.

### Fixes

- Placeholder text in the narrative editor no longer sits on a filled block. Its background is transparent and it uses the skin's muted text colour, so it stays readable on the light Windows 7 and Classic skins as well as the dark ones.
- Field placeholders across the MDC now follow the same rule, so they are never invisible against a white field.
- The incident form now keeps the MDC's own field positioning. The client no longer stretches inputs to full width or forces every label onto its own line, so half-width fields, side by side rows such as Status and Date and Time, and the narrative column sit exactly where they do on the web MDC.

### Fixes

- Removed the empty duplicate text boxes that appeared above the Narrative and Further Details editors on the incident form. Those were the hidden source boxes the rich text editor keeps behind the scenes, and the client is no longer forcing them back into view.
- The Upload Mugshot window now shows the picture you selected the moment you choose it, before the crop tool loads, so the window is never blank after an upload.
- The startup sound now plays once per launch of the client. Refreshing a page with Ctrl+R no longer replays it.
## 1.0.2

### Mugshots

- Removed the built in crop tool. The Upload Mugshot window is now left entirely alone, so the MDC's own cropper and upload behave exactly as they do in the browser.
- Kept out of the way: no preview hiding, no forcing the Upload button on, and no touching of the uploaded picture.

### Diagnostics

- Ctrl+Shift+M still opens the copyable page report.

## 1.0.11

### Mugshots

- Uploads that carry the picture on its own, rather than inside a form, now also get the cropped square substituted. This covers one more way the MDC can send the photo.

### Diagnostics

- Added a mugshot report. Press Ctrl+Shift+M on a record page to open a copyable report showing which crop tool is in charge, what the Upload Mugshot window contains, and what the last few requests actually sent. Paste it back when reporting a mugshot problem.

## 1.0.10

### Mugshots

- Fixed the duplicate photo showing under the crop frame on the site's default skin. The client was un-hiding the page's own spare copy of the picture; now only the picture being cropped stays visible and every other copy in the window is hidden.
- Fixed the crop being ignored on upload. When the MDC's own code asked for the cropped picture it was pointing at a different copy of the image and got nothing back, so it fell back to the original file. That request now always returns the square you selected, and uploads that carry the picture as encoded text are covered too.

## 1.0.9

### Mugshots

- Removed the small preview thumbnail from the Upload Mugshot window.
- The Upload button no longer looks greyed out while cropping. It is kept enabled and fully lit for as long as the crop frame is up.
- Moving or resizing the crop frame and then pressing Upload now sends the cropped square. The crop is written back after every adjustment, and the client also swaps the cropped picture into the upload itself, so the whole photo can no longer be sent by mistake.

## 1.0.8

### Mugshots

- The built in crop tool now takes over from the MDC's own crop library on every skin, including the site's default one. It no longer gives up when the site has already left a crop container in the window, it clears that container out, and it finds the mugshot preview picture whatever the page calls it.
- Any crop request the MDC's own code makes is now answered by the built in tool, so opening the window and pressing Upload go through one crop layer instead of two competing ones.

## 1.0.7

### Fixes

- Removed the stray "Narrative:" caption that sat beside the narrative editor on the incident form.

### Mugshots

- The client now includes its own crop and resize tool for the Upload Mugshot window, so mugshots work even though the MDC's own crop library never loads inside the client. Pick a picture and a square crop frame appears over it: drag the frame to move it, drag any corner to resize it, and the small live preview updates as you go. Pressing Upload sends the cropped square rather than the whole picture.

## 1.0.2

### Pages and layout

- Incident create and other MDC form pages now keep the site's own stacked layout. Labels sit above their fields at full width instead of being packed onto one line, and the client's button and column packing is switched off on those pages.
- Vehicle plates keep the MDC's own plate markup, so the red San Andreas caption, the two red tabs and the navy plate number render exactly as they do on the web MDC. The client no longer draws its own plate over the top of them.
- Panels and cards that the MDC marks as white now follow the active skin instead of staying white, which fixes the Search Faction box on the Incident Database page under Windows 7 Aero LAPD.
- Vehicle plates now use the MDC's own plate design everywhere they appear, including the plate shown on a DMV vehicle record, so the DMV record and the incident form show the same plate.
- The Upload Mugshot window now shows the crop and resize tool properly: the image, the crop frame, its drag handles and the live preview all render and can be moved and resized as they do on the web MDC.
- The street search on the Vehicle Map now drops its results below the search box with a solid, readable background instead of drawing plain text over the map and the box itself.
- Faction and other picker fields follow the active skin instead of staying white.
- Opening a personal record no longer shows the previous settings and the MDC side panel for a moment before the current ones load.
- The penal code tab no longer shows the forum's "San Andreas Penal Code" page heading and its background.

### History

- The history window opened with Ctrl+H is now paged, with first, previous, next and last buttons and a page size of 25, 50, 100 or 200 entries, so a long history no longer runs off the bottom of the window. Searching resets to the first page.

### Shortcuts

- Shortcuts can now be assigned to mouse buttons. In Help then Keyboard Shortcuts, press Change and then click the middle button or a side button; back and forward side buttons and the middle button are all accepted, and they work in the client and inside MDC pages.

## 1.0.1

A large update. The client was rebuilt around a proper skin engine, gained a Windows 7 skin family, a page system, history and alerts, an update checker and Discord presence, and a long list of fixes to the way MDC pages are laid out.

### Warrant capture

- Copying a warrant no longer repaints the page. The client now freezes the colours already on screen for the moment of the capture instead of applying its own capture stylesheet, so nothing visibly changes while the image is produced.
- Status pills such as the green `Active` badge keep their own text colour in the exported image. The previous capture stylesheet recoloured every element that was not a Bootstrap badge, which erased the label on badges that use a different class.
- The capture window is now 1.5 seconds instead of 6.

### Skins

- Seven skins ship with the client: Classic Light, Classic Dark, LAPD Mobile, Windows 7 Aero, Windows 7 Aero LAPD, Windows 7 Aero Dark, and Original MDC, which turns styling off entirely. All seven are listed in Options under Appearance, and F8 cycles through them from anywhere, including the penal code tab.
- The three Windows 7 skins were rebuilt from scratch as a real Aero treatment rather than a recolour: glass gradients, hairline borders and inner highlights on panels, embossed captions, gradient title bars, metal buttons with distinct hover and pressed states, and 17px scrollbars with gradient thumbs. They restyle the client chrome, the MDC itself, the penal code tab and popped-up windows.
- Windows 7 Aero LAPD uses a navy metal palette throughout, so buttons, dropdown menus, search fields and collapse toggles match the chrome instead of showing near-white Aero metal against navy.
- LAPD Mobile repaints the whole client in patrol navy, including the dashboard, tables, status pills and the page header.
- Skins are applied before the page paints, so switching pages no longer flashes the unstyled site first.
- Day mode and other site theme controls are hidden while a custom skin is active, since they fight the skin.

### Pages and navigation

- Several MDC pages can be open at once, each in its own view, so records keep their scroll position and half-filled forms while another page is in front. The page strip sits under the tabs with a close button per page and a plus button. Ctrl+T opens a page, Ctrl+W closes one, and links the site would open in a new window arrive as a new page rather than a popup.
- Pages are named after what they hold, using the navigation entry or the record number rather than repeating the site's own title.
- Right-click a navigation chip, a quick shortcut or any link to open it as another page instead of replacing the one in front.
- An optional MDC navigation bar shows the side panel links as tabs, and the side panel itself can be hidden and locked. Quick shortcuts are large icon buttons for Home, Query, Traffic, C6, Calls and Dispatch under the tab strip, captioned and toggleable.
- Popped-up windows can be dragged by their title bar, and the page behind them stays usable.

### History, alerts and notifications

- A searchable history records every page visited, with an option to narrow it to subjects and vehicles only. Ctrl+H opens it.
- An alerts counter tracks unread notifications, with an optional sound and a reminder at login.
- Nine interface sounds: clicks, navigation, opening and closing a page, confirmation, copy, notification, warning, error and start-up. Off by default.
- Optional Discord rich presence.

### Updates and identity

- The client is now PatrolOne Mobile Client, with a new application icon.
- It checks GitHub for new releases on launch and can download and install an update in place.
- Help carries a keyboard shortcut reference, and shortcuts can be remapped.

### Penal code

- Out-of-character notes in double parentheses are stripped, along with the topic event log, the forum footer, the theme switcher and the copyright line.
- The page no longer scrolls sideways, and the page selector is transparent.

### Layout and rendering fixes

- Layout containers are no longer painted. One rule was giving the panel colour to every structural element on the page, including grid rows and columns, table cells, list items, form groups and panel bodies, so anything inside a panel got a second block of colour behind it. That was the cause of the boxed-in dashboard statistics, APB fields and seal wells. Real surfaces such as cards, panels, dialogs and menus still take the skin colour; anything that only groups content is transparent.
- Long charge names wrap instead of being clipped, on every skin. Badges are capped at the width of their cell and break across lines.
- Departmental seals, court crests, faction logos and mugshots no longer sit in a coloured block.
- The subject card is drawn as a proper Windows panel on the Aero skins, matching the classic skins.
- Untranslated labels are repaired, so View Record no longer shows raw keys such as index.CreatedBy or turns index.Report into a link.
- The error notification icon is no longer cut off.
- Warrant Copy exports its PNG with the original document colours whatever skin is selected, and downloads are saved to the Downloads folder without a prompt.
- BB code toolbars are horizontal in Edit Record, Add Record, arrest narratives, incident posts and comments, with usable colour palettes.
- Charges and infractions stack downward in their own bordered, internally scrolling panel and can no longer run over the narrative editor.
- Person Lookup and ID Lookup fields are centred on the same axis and width as their Search button.
- Perfect Scrollbar rails no longer produce a second scrollbar, and the caution code and profiling sample pickers scroll again.
- Map surrounds are recoloured, and the map search bar is rebuilt against the plugin's real markup.
- Revoke and Suspend sit side by side, DMV class buttons and Incident Database buttons are aligned and sized consistently, and collapse toggles no longer clip through text.
- Records with no photograph show a compact placeholder instead of a large NO IMAGE FOUND block.
- Restoring the window from the tray no longer freezes the client.
- All comments have been removed from the shipped source files.

## 1.0.0

First public release.

- BB code toolbars are horizontal again in Edit Record, Add Record, arrest narratives, incident posts and page comments. The editor toolbar carries `class="note-toolbar card-header"`, so it was being caught by the card and dialog header rules and every button group was laid out as its own full-width row. Inside dialogs a second rule was also involved: the header-column rule that lines Type / Status / Confidential Level up under their captions matched the toolbar's button groups too, which is why Edit Record stayed stacked after the first fix; editor groups are now excluded from it. The toolbar has its own layout at higher specificity: one wrapping horizontal strip, inline button groups, 22px buttons, and themed font, style, table and colour dropdowns.
- Colour palettes inside the editor are usable: two palettes side by side, 16px swatches in real rows, and the swatch colours themselves are left untouched so they still show the colour they apply.
- Pages. The strip is captioned `PAGES`, the same way the quick shortcuts strip is captioned, and each entry is named after the page it holds (its navigation entry, or the record number) instead of repeating the site's own "Mobile Data Computer" title. Right-click a navigation chip, a quick shortcut or any link on a page — a record, a warrant, Emergency Map — to open it as another page instead of replacing the one in front.
- Several MDC pages can now be open at once, each in its own view, so records keep their scroll position and half-filled forms while another page is in front. A page strip sits under the tabs with a close button per page and a `+` button; Ctrl+T opens a page, Ctrl+W closes one, and links the site opens in a new window arrive as a new page instead of a popup.
- Person Lookup and ID Lookup fields are centred on the same axis and width as their Search button. The fields are not inside a `form`, which is why the earlier form-scoped centring never applied; the rules now key on the real `.tab-content > .tab-pane > .row.justify-content-center > .col-xl-4` markup.
