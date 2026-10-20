# Source markup fixtures

`incident-details.html` preserves the Linked Items and Person(s) cards, including
the hidden person template, from the supplied incidents.txt source. Release
1.1.2 reveals that template locally; no person is added to an account. The real
Perfect Scrollbar plugin is initialized on .inner as in the supplied warrant
script, so the single-scrollbar check includes actual vendor rails.

`dashboard-search.html`, `dashboard-stats.html` and `warrant-forms.html` were
extracted from the dashboard and warrant page source provided on 17 October 2026.
They retain the actual
wrappers, classes and control IDs. Page scripts, account information, images,
the charge catalog and narrative guide prose are omitted. The test supplies
local event handlers; no action reaches the real MDC server.

`prepare-source-fixtures.js` regenerates these snippets from two local source
files and the separately supplied dashboard notification source. The original
files are not required to run the tests.

`record-view.html` is the static View Record modal from the supplied dashboard
source, with its native title, metadata rows, report container and body. It has
placeholder fields and no account records. Popup tests fill it with a local
paper report and reproduce fixed opening height caps plus centered wrappers.

`incident-create.html` comes from the separately supplied Incident source on
18 October 2026. It retains the native field, Narrative and map structure;
the map URL points to a local fixture. The extraction tool accepts this source
as an optional third argument. No page scripts or account records are included.

Public assets under `vendor/` were fetched from:

- `https://mdc.gta.world/assets/css/material-dashboard-dark.css?v=1.1.9`
- `https://mdc.gta.world/css/custom.css?v=1.1.7`
- `https://mdc.gta.world/assets/js/plugins/bootstrap-notify.js`
- `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.18/css/bootstrap-select.min.css`
- `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.18/js/bootstrap-select.min.js`

The vendor files retain their upstream license notices. Bootstrap, jQuery,
Font Awesome and Summernote come from development dependencies. The profile
and license cards are representative fixtures based on the supplied screenshots
and the site's CSS; their page source was not provided.

Run `npm run verify -- --source-only` for these checks, or `npm run verify`
for the complete suite. Tests verify search heading wrappers and icon replacement,
license menu hit targets and form submission, wrapped profile fields, all four
warrant types, dynamic evidence removal, header-only statistics, the site's
nested Material notification glyph and Original MDC restoration. A generated
350-option charge catalog measures dropdown opening and style recalculation;
it contains no account data or copied charge catalog.

`npm run verify -- --documents-only` checks the Incident structure across skins
and representative APB/warrant/report/arrest create/edit forms, including native
arrest grid and absolute control placement. It also checks thin dividers in
representative person-record cards, wrapped top tabs, screenshot-based paper
report/citation/custom-form fixtures and print output. Only the Incident and
warrant fixtures have supplied source; the other forms and record documents
are representative checks, not authenticated live-page coverage.

`npm run verify -- --popups-only` drives actual pointer input through record
resizing, shrinking, moving, all title-bar viewport edges and native restoration.
It also checks Name Check, Plate Check and History window bodies and grips.
Profile checks add trailing HRs and empty wrappers, require zero layout boxes
and the exact height of a separator-free profile, and retain another card's HR.

`incident-actions.html` contains the supplied linked-item and Victim button
markup. Form checks apply those controls to representative create/edit routes,
while retaining the actual Incident Status and Classification controls. Popup
checks cover maximize/restore, double-click, scrolled-page bounds and 320-pixel
client lookup rows. The optional `--inspect-popups` pause exposes an isolated
fixture to Electron MCP on port 9222; it never uses the saved user session.

The later `person-record.html` fixture comes from the supplied exact person-record
source. It preserves the paired no-divider HRs and nested span/vehicle row borders
that the earlier representative fixture did not reproduce. Review mode combines
this source with the native View Record and a real Summernote toolbar.

`badge-menus.html` extracts the actual record Status, Record Type and Classification
menu markup from the supplied person-record source. Checks compare badge left
edges, height and typography across all skins, and ensure menu labels are never
marked as document banners or deframed ancestors.
