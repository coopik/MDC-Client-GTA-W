# Changelog

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
