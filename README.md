# CampusPlace OG Images

A Cloudflare Workers microservice for generating and serving Open Graph images.

## Features

- 🎨 Dynamic OG image generation with custom text
- 🖼️ Static OG images for pages (Home, Blog, How It Works, etc.)
- 🔒 CORS protection (only accepts requests from `campusplace.org` domains)
- ⚡ Edge-optimized with caching
- 📦 Lightweight and fast

## Endpoints

### `GET /`

Web interface for generating and browsing OG images.

- Dynamic OG image generator with live preview
- Static OG images gallery with copy/open actions

### `GET /api/og`

Generate an OG image with a custom title.

**Query Parameters:**
- `title` (optional): The text to display on the image

**Example:**
```
https://og.campusplace.org/api/og?title=Welcome%20to%20CampusPlace
```

**Response:**
- Content-Type: `image/png`
- Size: 1200×630
- Cache-Control: `public, max-age=31536000, immutable`

## Static OG Images

The following static OG images are available:

| Page | URL |
|------|-----|
| Home | `https://static.campusplace.org/og/home.png` |
| Blog | `https://static.campusplace.org/og/blog.png` |
| How It Works | `https://static.campusplace.org/og/how-it-works.png` |
| Who Is This For | `https://static.campusplace.org/og/who-is-this-for.png` |
| Trust & Safety | `https://static.campusplace.org/og/trust-and-safety.png` |
| Legal & Trust | `https://static.campusplace.org/og/legal-and-trust.png` |
| Universities & Regions | `https://static.campusplace.org/og/universities-and-regions.png` |
| Banner (No Title) | `https://static.campusplace.org/og/banner-no-title.png` |
| Banner (Titled) | `https://static.campusplace.org/og/banner-titled.png` |

## CORS Policy

Only accepts requests from:
- `campusplace.org`
- `*.campusplace.org`

## Development

```bash
# Install dependencies
pnpm install

# Run locally
pnpm dev

# Deploy to Cloudflare Workers
pnpm deploy
```

## Tech Stack

- [Hono.js](https://hono.dev/) - Web framework for Cloudflare Workers
- [cf-workers-og](https://github.com/cloudflare/workers-og-image-generation) - OG image generation
- TypeScript
- Cloudflare Workers

## Assets

- Font: Space Grotesk (Regular, Bold)
- Font: DM Sans (Medium)
- Background: `/public/images/banner-no-title.png`

## License

Proprietary - CampusPlace