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

// Import font and image - Wrangler will bundle these as base64 data URLs
// @ts-ignore
import fontDataUrl from '../public/fonts/SpaceGrotesk-Regular.ttf'
// @ts-ignore
import coverDataUrl from '../public/images/cover.png'

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
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OG Image Generator</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    @font-face {
      font-family: 'Space Grotesk';
      src: url('/fonts/SpaceGrotesk-Regular.ttf') format('truetype');
      font-weight: 400;
      font-display: swap;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #09090b;
      color: #fafafa;
      min-height: 100vh;
      padding: 24px;
      line-height: 1.5;
    }

    *{
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .container {
      max-width: 720px;
      margin: 80px auto 0;
    }
    
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #fafafa;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    
    .description {
      color: #a1a1aa;
      margin-bottom: 48px;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 24px;
    }
    
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #fafafa;
      margin-bottom: 8px;
    }
    
    input[type="text"] {
      width: 100%;
      padding: 10px 12px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      color: #fafafa;
      font-size: 14px;
      transition: all 0.15s ease;
      outline: none;
    }
    
    input[type="text"]:hover {
      border-color: #3f3f46;
    }
    
    input[type="text"]:focus {
      border-color: #52525b;
      background: #18181b;
    }
    
    .button-group {
      display: flex;
      gap: 8px;
    }
    
    button {
      padding: 10px 16px;
      border: 1px solid #27272a;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      position: relative;
      overflow: hidden;
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    .btn-primary {
      background: #fafafa;
      color: #09090b;
      border-color: #fafafa;
    }
    
    .btn-primary:hover {
      background: #e4e4e7;
      border-color: #e4e4e7;
    }
    
    .btn-primary.loading {
      pointer-events: none;
    }
    
    .btn-primary.loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(9, 9, 11, 0.1), transparent);
      animation: shimmer 0.8s ease-in-out;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    .btn-secondary {
      background: transparent;
      color: #fafafa;
    }
    
    .btn-secondary:hover {
      background: #18181b;
      border-color: #3f3f46;
    }
    
    .btn-secondary.copied {
      background: #18181b;
      border-color: #52525b;
    }
    
    .btn-secondary.copied::before {
      content: '✓ ';
      animation: checkmark 0.3s ease-out;
    }
    
    @keyframes checkmark {
      0% {
        opacity: 0;
        transform: scale(0.5);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .preview-section {
      margin-top: 48px;
      padding-top: 48px;
      border-top: 1px solid #27272a;
      display: none;
    }
    
    .preview-section.active {
      display: block;
    }
    
    .preview-label {
      font-size: 14px;
      font-weight: 500;
      color: #fafafa;
      margin-bottom: 16px;
    }
    
    .preview-image-container {
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow: hidden;
      background: #18181b;
    }
    
    .preview-image {
      width: 100%;
      display: block;
    }
    
    .url-container {
      margin-top: 16px;
      padding: 12px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #a1a1aa;
      word-break: break-all;
    }
    
    footer {
      margin-top: 80px;
      padding-top: 24px;
      border-top: 1px solid #27272a;
      text-align: center;
      color: #52525b;
      font-size: 13px;
    }
    
    @media (max-width: 768px) {
      .container {
        margin-top: 40px;
      }
      
      h1 {
        font-size: 20px;
      }
      
      .button-group {
        flex-direction: column;
      }
      
      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OG Image Generator</h1>
    <p class="description">Generate Open Graph images for CampusPlace</p>
    
    <form id="ogForm">
      <div class="form-group">
        <label for="title">Title</label>
        <input 
          type="text" 
          id="title" 
          name="title" 
          placeholder="Enter your title..."
          value="CampusPlace"
          autofocus
        />
      </div>
      
      <div class="button-group">
        <button type="submit" class="btn-primary">Generate</button>
        <button type="button" class="btn-secondary" onclick="copyUrl()">Copy URL</button>
      </div>
    </form>
    
    <div class="preview-section" id="preview">
      <div class="preview-label">Preview</div>
      <div class="preview-image-container">
        <img class="preview-image" id="previewImage" alt="OG Image Preview" />
      </div>
      <div class="url-container" id="urlBox"></div>
    </div>
    
    <footer>
      CampusPlace OG Generator
    </footer>
  </div>
  
  <script>
    const form = document.getElementById('ogForm');
    const titleInput = document.getElementById('title');
    const preview = document.getElementById('preview');
    const previewImage = document.getElementById('previewImage');
    const urlBox = document.getElementById('urlBox');
    let debounceTimer;
    
    function generateUrl() {
      const title = titleInput.value.trim() || 'CampusPlace';
      const baseUrl = window.location.origin;
      return \`\${baseUrl}/api/og?title=\${encodeURIComponent(title)}\`;
    }
    
    function updatePreview() {
      const url = generateUrl();
      const btn = form.querySelector('.btn-primary');
      
      // Add loading animation
      btn.classList.add('loading');
      btn.textContent = 'Generating...';
      
      previewImage.src = url + '&t=' + Date.now();
      urlBox.textContent = url;
      preview.classList.add('active');
      
      // Remove loading state after image loads or timeout
      previewImage.onload = () => {
        setTimeout(() => {
          btn.classList.remove('loading');
          btn.textContent = 'Generate';
        }, 300);
      };
      
      setTimeout(() => {
        btn.classList.remove('loading');
        btn.textContent = 'Generate';
      }, 3000);
    }
    
    function copyUrl() {
      const url = generateUrl();
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
        }, 500);
      }
    });
    
    updatePreview();
  </script>
</body>
</html>
  `;
  
  return c.html(html);
})

app.get('/api/og', async (c) => {
  try {
    const title = c.req.query('title') || 'CampusPlace'
    
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
            top: '70px',
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
