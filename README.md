# Quote calculator landing

A single-page service landing built around an interactive cost calculator and a
working lead-capture form. Demo brand: "Klaro", a fictional Warszawa home
cleaning company. Hand-coded HTML, CSS and vanilla JavaScript. No framework, no
build step, no dependencies.

It demonstrates a different archetype than a brochure site: the page exists to
turn a visitor into a priced lead. The calculator shows a price instantly, and
the same submit forwards the full lead (name, phone, dimensions, options,
computed price) to the business inbox.

## What it does

- Calculator with area (m²), cleaning type, frequency and add-ons. Price updates
  on submit with a transparent line-item breakdown and a minimum-charge floor.
- Inline form validation (area range, name, phone digit count, optional email),
  errors shown under each field, focus jumps to the first invalid input.
- Lead delivery via [Web3Forms](https://web3forms.com) (free, no backend). The
  price is always computed locally; the email send is best-effort.
- Technical SEO: per-page title and meta description, canonical, OpenGraph,
  JSON-LD `HouseHoldServices` with `areaServed` and `aggregateRating`,
  `sitemap.xml`, `robots.txt`.
- Accessibility: semantic landmarks, labelled fields, visible focus rings, skip
  link, `aria-live` result, `prefers-reduced-motion` support.
- Responsive from 375px up. Flat design, fresh teal palette, Plus Jakarta Sans.

## Lead delivery setup

The form ships with a placeholder so it never posts to an unknown inbox. To make
it live:

1. Get a free access key at https://web3forms.com (paste your email, no account).
2. In `js/calculator.js`, replace `REPLACE_WITH_WEB3FORMS_ACCESS_KEY` with the key.

That is the whole integration. With the key set, every submit emails the lead to
the address tied to the key. Without it, the calculator still works and tells the
visitor to call.

## Pricing model

Rates live at the top of `js/calculator.js` and are easy to re-skin per client:

- Base rate per m²: standardowe 4 zł, generalne 8 zł, po remoncie 12 zł
- Frequency: jednorazowo ×1.0, co 2 tygodnie ×0.9, co tydzień ×0.82
- Add-ons: okna +60 zł, AGD +50 zł, tapicerka +90 zł
- Minimum charge: 150 zł

## Run locally

It is static, so any file server works:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

```
index.html          markup, meta, JSON-LD
css/styles.css       design system + responsive layout
js/calculator.js     validation, pricing, lead delivery
assets/              favicon + OpenGraph image
sitemap.xml, robots.txt
```
