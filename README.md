# CJ Product Finder

A brutalist-styled Next.js web app that discovers random products from CJ Dropshipping via n8n workflow integration.

## Design Philosophy

**Brutalist & Bold**: High-contrast design with:
- **Fonts**: Space Grotesk (display) + JetBrains Mono (body)
- **Colors**: Black background, neon green accents (#00ff88)
- **Layout**: Thick borders, sharp edges, asymmetric composition
- **Motion**: Smooth micro-interactions and entrance animations

## Features

- 🎲 Random product discovery from CJ Dropshipping
- 🖼️ Image gallery with navigation
- 💰 Price display with discount calculation
- 🌍 Multi-country shipping information
- ⚡ Immediate response from n8n workflow
- 🎨 Distinctive brutalist design (no generic AI aesthetics!)

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **n8n** (workflow automation)
- **CJ Dropshipping API**

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_CJ_WEBHOOK_URL=https://kvktrades.app.n8n.cloud/webhook/cj-product-start
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
cj-product-app/
├── app/
│   ├── actions.ts          # Server actions for API calls
│   ├── globals.css         # Global styles + animations
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── components/
│   └── ProductCard.tsx     # Product display component
├── public/                 # Static assets
├── .env.local              # Environment variables (gitignored)
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
└── package.json            # Dependencies
```

## How It Works

1. **User clicks "Generate Product"**
2. **Frontend** → Server Action (`fetchRandomProduct`)
3. **Server Action** → n8n Webhook (`/webhook/cj-product-start`)
4. **n8n Workflow**:
   - Calls CJ Dropshipping API
   - Fetches random product
   - Extracts product data (name, images, price, etc.)
   - Returns JSON response
5. **Frontend** ← Displays product with ProductCard component

## API Response Structure

```typescript
{
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  currency: string
  images: string[]
  mainImage: string
  categoryId: string
  categoryName: string
  variants: any[]
  shipFromCountries: string[]
  sourceUrl: string
  fetchedAt: string
}
```

## Design Highlights

### Typography
- **Display**: Space Grotesk (700) - Geometric, distinctive, bold
- **Body**: JetBrains Mono - Technical, precise, readable

### Color Palette
- **Background**: `#0a0a0a` (near black)
- **Foreground**: `#fafafa` (off-white)
- **Accent**: `#00ff88` (neon green)
- **Borders**: `#333` (dark gray)

### Animations
- `slideUp`: Entrance from bottom with fade
- `fadeIn`: Simple opacity transition
- `scaleIn`: Scale + fade with spring easing

### Components
- **Thick borders** (4px) for brutalist aesthetic
- **Shadow effects** on buttons for depth
- **High contrast** for readability
- **Asymmetric layout** for visual interest

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variable: `NEXT_PUBLIC_CJ_WEBHOOK_URL`
4. Deploy

### Other Platforms

Build for production:

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CJ_WEBHOOK_URL` | n8n webhook endpoint for product fetching | Yes |

## Future Enhancements

- [ ] Product favoriting/saving
- [ ] Product filtering by category
- [ ] Search functionality
- [ ] AI-generated product images (via n8n background processing)
- [ ] AI-generated product videos (via n8n background processing)
- [ ] Share functionality
- [ ] Product history

## License

Private project

## Credits

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by [CJ Dropshipping](https://cjdropshipping.com)
- Automated by [n8n](https://n8n.io)
