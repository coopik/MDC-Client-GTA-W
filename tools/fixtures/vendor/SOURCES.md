# Offline fixture resources

These files are used only by the isolated Electron verification server.
The client continues to load the real MDC page resources normally.

- `html2canvas.js`: https://mdc.gta.world/js/html2canvas.js, version 1.0.0-rc.7, MIT. Retrieved 2026-10-19.
- `fontawesome.min.css`, `solid.min.css`: https://mdc.gta.world/css/fontawesome/, Font Awesome Free 5.13.1. Code MIT, icons CC BY 4.0.
- `fa-solid-900.woff2`: https://mdc.gta.world/webfonts/fa-solid-900.woff2, Font Awesome Free 5.13.1, SIL OFL 1.1.

The CSS and renderer retain their upstream copyright and license notices.
Font Awesome license: https://fontawesome.com/license/free
The upstream full license is included as `Font-Awesome-LICENSE.txt`.

`post-arrest.html` in the parent folder preserves the user-supplied Post Arrest
submission markup without comments or page scripts. Images use the local seal
fixture; no accounts or submissions are contacted by the verification server.
The search-bar example uses native card-header and action-button classes; it is
a representative rendering fixture, not a copy of the Active Warrants page.

- `bootstrap-material-design.min.js`: https://mdc.gta.world/assets/js/core/bootstrap-material-design.min.js, the site-provided Material Design Bootstrap bundle, used by the 1.1.1 fixture for native dropdown and ripple interactions. Retrieved 2026-10-19.
- `perfect-scrollbar.jquery.min.js`: https://mdc.gta.world/assets/js/plugins/perfect-scrollbar.jquery.min.js, site-provided Perfect Scrollbar 0.6.13, retrieved 2026-10-20. Used only for native scrollbar verification.
