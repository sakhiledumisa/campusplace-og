import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ImageResponse, CustomFont } from 'cf-workers-og'
import { createElement as h } from 'react'

type Bindings = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware - only allow campusplace.org domains
app.use('/api/*', cors({
  origin: (origin) => {
    // Allow requests from campusplace.org and its subdomains
    if (!origin) return null // Block requests with no origin
    try {
      const url = new URL(origin)
      if (url.hostname === 'campusplace.org' || url.hostname.endsWith('.campusplace.org')) {
        return origin
      }
    } catch {}
    return null // Block all other origins
  },
  allowMethods: ['GET'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}))

// Import fonts and image - Wrangler will bundle these as base64 data URLs
// @ts-ignore
import fontDataUrl from '../public/fonts/SpaceGrotesk-Regular.ttf'
// @ts-ignore
import dmSansDataUrl from '../public/fonts/DMSans_24pt-Medium.ttf'
// @ts-ignore
import coverDataUrl from '../public/images/banner-no-title.png'

// Cache font buffer once per Worker instance
let cachedFontBuffer: ArrayBuffer | null = null

function getFontBuffer(): ArrayBuffer {
  if (cachedFontBuffer) return cachedFontBuffer
  
  // If fontDataUrl is already an ArrayBuffer, use it directly
  if (fontDataUrl instanceof ArrayBuffer) {
    cachedFontBuffer = fontDataUrl
    return cachedFontBuffer
  }
  
  // Otherwise it's a data URL string, decode it
  const dataUrl = fontDataUrl as string
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  cachedFontBuffer = bytes.buffer
  return cachedFontBuffer
}

app.get('/', (c) => {
  const spaceGroteskDataUrl = fontDataUrl as string
  const dmSansFontDataUrl = dmSansDataUrl as string
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#000000">
  <title>CampusPlace OG Images</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'DM Sans' !important;
      background: #000000;
      color: #fafafa;
      min-height: 100vh;
      padding: 24px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Space Grotesk' !important;
    }
    
    label {
      font-family: 'Space Grotesk' !important;
    }
    
    .preview-label {
      font-family: 'Space Grotesk' !important;
    }
    
    input, button, textarea, select {
      font-family: 'DM Sans' !important;
    }
    
    .url-container {
      font-family: 'Space Grotesk' !important;
    }
    
    .container {
      max-width: 1280px;
      margin: 0 auto;
    }
    
    .section {
      margin-bottom: 32px;
    }
    
    .og-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    
    .og-card {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    
    .og-card:hover {
      border-color: #2a2a2a;
    }
    
    .og-preview {
      position: relative;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 140px;
      background: #0a0a0a;
    }
    
    .og-preview img {
      width: 100%;
      border-radius: 4px;
      border: 1px solid #1a1a1a;
    }
    
    .og-content {
      padding: 12px 16px;
      border-top: 1px solid #1a1a1a;
    }
    
    .og-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 2px;
      color: #ffffff;
    }
    
    .og-subtitle {
      font-size: 11px;
      color: #666666;
      margin-bottom: 8px;
    }
    
    .action-buttons {
      display: flex;
      gap: 6px;
    }
    
    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid #27272a;
      transition: all 0.2s ease;
      color: #a1a1aa;
      cursor: pointer;
    }
    
    .action-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
      color: #ffffff;
    }
    
    .action-btn.copied {
      background: #27272a;
      border-color: #a0ec06;
      color: #a0ec06;
    }
    
    .dynamic-card {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 12px;
      padding: 16px;
    }
    
    .dynamic-header {
      margin-bottom: 12px;
    }
    
    .dynamic-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .dynamic-subtitle {
      font-size: 12px;
      color: #666666;
    }
    
    .form-group {
      margin-bottom: 12px;
    }
    
    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #a1a1aa;
      margin-bottom: 6px;
    }
    
    input[type="text"] {
      width: 100%;
      padding: 8px 12px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 6px;
      color: #fafafa;
      font-size: 13px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }
    
    input[type="text"]:hover {
      border-color: #3f3f46;
    }
    
    input[type="text"]:focus {
      border-color: #a0ec06;
      background: #09090b;
      box-shadow: 0 0 0 1px #a0ec06;
    }
    
    input[type="text"]::placeholder {
      color: #71717a;
    }
    
    .button-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .button-group button {
      min-height: 36px;
    }
    
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
    }
    
    .btn-primary {
      background: #a0ec06;
      color: #273302;
    }
    
    .btn-primary:hover {
      background: #8fd005;
    }
    
    .btn-secondary {
      background: #18181b;
      color: #fafafa;
      border: 1px solid #27272a;
    }
    
    .btn-secondary:hover {
      background: #27272a;
    }
    
    .btn-secondary.copied {
      background: #a0ec06;
      color: #273302;
      border-color: #a0ec06;
    }
    
    .preview-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #1a1a1a;
      display: none;
    }
    
    .preview-section.active {
      display: block;
    }
    
    .preview-image-container {
      border: 1px solid #1a1a1a;
      border-radius: 6px;
      overflow: hidden;
      background: #0f0f0f;
      margin-bottom: 8px;
    }
    
    .preview-image {
      width: 100%;
      display: block;
    }
    
    .url-display {
      font-size: 10px;
      color: #52525b;
      word-break: break-all;
      line-height: 1.4;
    }
    
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #000000;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #1a1a1a;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #2a2a2a;
    }
    
    @media (max-width: 768px) {
      .dynamic-card {
        grid-column: span 1;
      }
      
      h1 {
        font-size: 28px;
      }
      
      .og-grid {
        grid-template-columns: 1fr;
      }
    }
    
    footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #1a1a1a;
      text-align: center;
      color: #52525b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>CampusPlace OG Images</h1>
      <p class="description">Open Graph images for social sharing</p>
    </header>
    
    <!-- Dynamic Generator Section -->
    <section class="section">
      <div class="og-grid">
        <div class="dynamic-card">
          <form id="ogForm">
            <div class="form-group">
              <input 
                type="text" 
                id="title" 
                name="title" 
                placeholder="Enter title..."
                value="Campus Place — Trusted student ecosystems for South African campuses"
              />
            </div>
            
            <div class="button-group">
              <button type="submit" class="btn-primary">Generate</button>
              <button type="button" class="btn-secondary" onclick="copyDynamicUrl()">Copy</button>
              <button type="button" class="action-btn" onclick="openDynamicUrl()" title="Open">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </button>
            </div>
            
            <div class="preview-section" id="preview">
              <div class="preview-image-container">
                <img class="preview-image" id="previewImage" alt="OG Image Preview" />
              </div>
              <div class="url-display" id="urlBox"></div>
            </div>
          </form>
        </div>
      </div>
    </section>
    
    <!-- Static OG Images Section -->
    <section class="section">
      <h2 class="section-title">Static OG Images</h2>
      <div class="og-grid" id="staticImages"></div>
    </section>
  </div>
  
  <script>
    // Static OG images data
    const ogImages = [
      { name: 'Home', file: 'home.png', size: '1200×630' },
      { name: 'Blog', file: 'blog.png', size: '1200×630' },
      { name: 'How It Works', file: 'how-it-works.png', size: '1200×630' },
      { name: 'Who Is This For', file: 'who-is-this-for.png', size: '1200×630' },
      { name: 'Trust & Safety', file: 'trust-and-safety.png', size: '1200×630' },
      { name: 'Legal & Trust', file: 'legal-and-trust.png', size: '1200×630' },
      { name: 'Universities & Regions', file: 'universities-and-regions.png', size: '1200×630' },
      { name: 'Banner (No Title)', file: 'banner-no-title.png', size: '1200×630' },
      { name: 'Banner (Titled)', file: 'banner-titled.png', size: '1200×630' }
    ];
    
    // Render static images
    const container = document.getElementById('staticImages');
    ogImages.forEach(img => {
      const card = document.createElement('div');
      card.className = 'og-card';
      card.innerHTML = \`
        <div class="og-preview">
          <img src="https://static.campusplace.org/og/\${img.file}" alt="\${img.name}" />
        </div>
        <div class="og-content">
          <h3 class="og-title">\${img.name}</h3>
          <p class="og-subtitle">PNG • \${img.size}</p>
          <div class="action-buttons">
            <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="copyStaticUrl('og/\${img.file}')">Copy</button>
            <a href="https://static.campusplace.org/og/\${img.file}" target="_blank" class="action-btn" title="Open">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </div>
        </div>
      \`;
      container.appendChild(card);
    });
    
    // Dynamic generator logic
    const form = document.getElementById('ogForm');
    const titleInput = document.getElementById('title');
    const preview = document.getElementById('preview');
    const previewImage = document.getElementById('previewImage');
    const urlBox = document.getElementById('urlBox');
    let debounceTimer;
    
    function generateUrl() {
      const title = titleInput.value.trim() || 'Campus Place — Trusted student ecosystems for South African campuses';
      const baseUrl = window.location.origin;
      return \`\${baseUrl}/api/og?title=\${encodeURIComponent(title)}\`;
    }
    
    function updatePreview() {
      const url = generateUrl();
      previewImage.src = url + '&t=' + Date.now();
      urlBox.textContent = url;
      preview.classList.add('active');
    }
    
    function copyDynamicUrl() {
      const url = generateUrl();
      const btn = event.target;
      
      navigator.clipboard.writeText(url).then(() => {
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = 'Copy';
        }, 2000);
      });
    }
    
    function openDynamicUrl() {
      const url = generateUrl();
      window.open(url, '_blank');
    }
    
    function copyStaticUrl(path) {
      const url = \`https://static.campusplace.org/\${path}\`;
      const btn = event.target;
      const originalText = btn.textContent;
      
      navigator.clipboard.writeText(url).then(() => {
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = originalText;
        }, 2000);
      });
    }
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(debounceTimer);
      updatePreview();
    });
    
    titleInput.addEventListener('input', () => {
      if (preview.classList.contains('active')) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          updatePreview();
        }, 1000);
      }
    });
    
    updatePreview();
  </script>
  
  <footer>
    <p>CampusPlace OG Generator</p>
  </footer>
</body>
</html>
  `;
  
  return c.html(html);
})

app.get('/api/og', async (c) => {
  try {
    const title = c.req.query('title') || 'Campus Place — Trusted student ecosystems for South African campuses'
    
    const fontBuffer = getFontBuffer()
    const coverImage = coverDataUrl as string

    return ImageResponse.create(
      h('div', {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'Space Grotesk',
        }
      },
        h('img', {
          src: coverImage,
          alt: '',
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }
        }),
        h('div', {
          style: {
            position: 'absolute',
            top: '120px',
            left: '60px',
            display: 'flex',
            maxWidth: '90%',
          }
        },
          h('h1', {
            style: {
              fontSize: 72,
              fontWeight: 700,
              color: '#FEFAE0',
              margin: 0,
              textTransform: 'capitalize',
              lineHeight: 1.1,
            }
          }, title)
        )
      ),
      {
        width: 1200,
        height: 630,
        fonts: [new CustomFont('Space Grotesk', fontBuffer, { weight: 700 })],
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    )
  } catch (err) {
    console.error('Error generating OG image:', err)
    return c.json(
      {
        error: 'Failed to generate image',
        details: String(err),
      },
      500
    )
  }
})

export default app
