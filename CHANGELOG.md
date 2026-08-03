# Changelog

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
