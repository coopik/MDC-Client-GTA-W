# Changelog

## 1.0.0

First public release.

- BB code toolbars are horizontal again in Edit Record, Add Record, arrest narratives, incident posts and page comments. The editor toolbar carries `class="note-toolbar card-header"`, so it was being caught by the card and dialog header rules and every button group was laid out as its own full-width row. Inside dialogs a second rule was also involved: the header-column rule that lines Type / Status / Confidential Level up under their captions matched the toolbar's button groups too, which is why Edit Record stayed stacked after the first fix; editor groups are now excluded from it. The toolbar has its own layout at higher specificity: one wrapping horizontal strip, inline button groups, 22px buttons, and themed font, style, table and colour dropdowns.
- Colour palettes inside the editor are usable: two palettes side by side, 16px swatches in real rows, and the swatch colours themselves are left untouched so they still show the colour they apply.
- Pages. The strip is captioned `PAGES`, the same way the quick shortcuts strip is captioned, and each entry is named after the page it holds (its navigation entry, or the record number) instead of repeating the site's own "Mobile Data Computer" title. Right-click a navigation chip, a quick shortcut or any link on a page — a record, a warrant, Emergency Map — to open it as another page instead of replacing the one in front.
- Several MDC pages can now be open at once, each in its own view, so records keep their scroll position and half-filled forms while another page is in front. A page strip sits under the tabs with a close button per page and a `+` button; Ctrl+T opens a page, Ctrl+W closes one, and links the site opens in a new window arrive as a new page instead of a popup.
- Person Lookup and ID Lookup fields are centred on the same axis and width as their Search button. The fields are not inside a `form`, which is why the earlier form-scoped centring never applied; the rules now key on the real `.tab-content > .tab-pane > .row.justify-content-center > .col-xl-4` markup.
