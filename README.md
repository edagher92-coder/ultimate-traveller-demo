# The Ultimate Traveller — interactive design demo

A public, shareable design demonstration for a personal travel-advice website. It includes scenic video, travel-interest exploration, a guided trip finder, fictional enquiry saving and a demo adviser desk.

**This is a browser-only sandbox. It is not the live travel business website, a booking service or a production CRM.** Draft copy and promotions remain subject to the adviser's approval. No campaign, analytics, email, booking or payment service is connected.

## Try it

1. Open the homepage and explore the travel scenes, interests and optional three-question finder.
2. Save an enquiry using fictional details such as `Demo Traveller` and `demo@example.com`. Acknowledge the demo notice.
3. Open **Demo adviser dashboard** in the same browser. Your enquiry appears there; try changing its status.
4. Edit a promotion draft, save it, and reload the homepage in that browser to see the change.
5. Use **Reset this browser's demo data** in the dashboard to remove your fictional enquiries and restore the original drafts. Reset requires an explicit confirmation.

Records use this site's browser localStorage and remain on that browser/device. They are not sent to the adviser or shared with other visitors. A shared browser shares its demo data. Clearing site storage removes it. Use fictional details only, with no passport, health or payment information. The demo limits enquiries to 50 records, validates stored/input data and reports unavailable/corrupt storage instead of claiming a successful save.

## Development

Buildless HTML/CSS/JavaScript; no npm dependencies. Node 22+ is needed only for checks/tests:

```sh
npm run check
npm test
python -m http.server 8801 --bind 127.0.0.1
```

Open `http://127.0.0.1:8801/` (not a `file:` URL). Deployment uses GitHub Pages from `main` at the repository root. Relative asset/navigation URLs support its repository subpath. `.nojekyll` keeps the static files as supplied. The public Pages URL is a design-review link, not the business domain.

The public export deliberately excludes the private Node service, runtime records, access tokens, proposals, pricing, personal notes and research documents. This sandbox is a separate implementation layer; public UI edits do not alter the private backend. Private-demo review scores do not certify this public adaptation.

## Assets and rights

Site design and original code: copyright Harbour Hospitality / the respective rights holders. No general open-source licence is granted by publishing this demo repository. Third-party assets retain their own licences.

- `assets/video/SOURCES.md` credits licensed Pexels footage and derived posters. Do not imply endorsement or offered itinerary availability.
- DM Sans and Fraunces fonts are bundled under the SIL Open Font License; see the licence files in `assets/fonts/`.
- Four WebP images are original generated illustrative travel concepts, not evidence of Susie's trips, a real offered property, itinerary or client result. Labels in the site preserve that distinction.

The HTML asks search engines not to index this demo. This is a public link and public source repository; noindex is not access control.
