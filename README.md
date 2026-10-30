# CampusPlace OG Generator

A Cloudflare Workers microservice for generating Open Graph images dynamically using Hono.js and cf-workers-og.

## Features

- 🎨 Dynamic OG image generation with custom fonts
- 🔒 CORS protection (only accepts requests from `campusplace.org` domains)
- ⚡ Edge-optimized with caching
- 🖼️ Custom background image and typography
- 📦 Lightweight and fast

## API Endpoint

### `GET /api/og`

Generate an OG image with a custom title.

**Query Parameters:**
- `title` (optional): The text to display on the image. Defaults to "CampusPlace"

**Example:**
```
https://og.campusplace.org/api/og?title=Welcome%20to%20Campus
```

**Response:**
- Content-Type: `image/png`
- Size: 1200x630 (standard OG image dimensions)
- Cache-Control: `public, max-age=31536000, immutable`

## CORS Policy

Only accepts requests from:
- `campusplace.org`
- `*.campusplace.org` (all subdomains)

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

- [Hono.js](https://hono.dev/) - Fast web framework for Cloudflare Workers
- [cf-workers-og](https://github.com/cloudflare/workers-og-image-generation) - OG image generation
- TypeScript
- Cloudflare Workers

## Customization

To customize the OG image:
1. Replace `/public/images/cover.png` with your background image
2. Replace `/public/fonts/SpaceGrotesk-Regular.ttf` with your preferred font
3. Edit styles in `src/index.ts`

## License

MIT
