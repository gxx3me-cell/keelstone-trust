# Lumen

Private digital wealth management — React (Vite) port of the original HTML design.

## Pages / routes

| Route        | Page                                            |
| ------------ | ----------------------------------------------- |
| `/`          | Landing (hero, strategies, performance, footer) |
| `/login`     | Sign in                                         |
| `/signup`    | Open account                                    |
| `/dashboard` | Client dashboard (charts, holdings, settings)   |

Sign-in / sign-up buttons navigate to `/dashboard`; "Sign out" returns to `/login`.

## Develop

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Structure

- `src/pages/` — one component per page (`Lumen`, `Login`, `Signup`, `Dashboard`).
- `src/components/ImageSlot.jsx` — renders the design's `image-slot` placeholders; real
  images that shipped with the project live in `src/assets/slots/`.
- `src/hooks/useReveal.js` — scroll-reveal, mount-fade, and count-up animations.
- `src/dashboard/` — dashboard data, theming CSS, and canvas chart helpers.
- `public/uploads/` — full-bleed hero/app screenshots.
