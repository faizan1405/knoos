# KNOOS — Premium Shoe E-commerce

Premium shoe e-commerce platform for KNOOS.

## Tech Stack

- **Next.js 16** — App Router
- **TypeScript** — strict mode
- **Prisma 6** — ORM with MySQL
- **Tailwind CSS** — styling
- **NextAuth v5** — Google OAuth authentication
- **Zod** — validation
- **Framer Motion** — animations (ready for implementation)
- **Three.js / R3F** — hero 3D (architecture ready)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/knoos.git
cd knoos
npm install
```

### 2. Configure environment

Copy `.env.example` → `.env` and fill in real values:

```bash
cp .env.example .env
```

Required values:
- `DATABASE_URL` — your MySQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google Cloud Console
- `AUTH_SECRET` — run `npx next-auth secret` or generate a random 32+ char string
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`

### 3. Set up the database

```bash
npm run db:migrate
```

Optional seed (for development):

```bash
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | NextAuth JWT encryption key |
| `RAZORPAY_KEY_ID` | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |
| `STANDARD_DELIVERY_CHARGE` | ₹100 — backend-controlled only |
| `FAST_DELIVERY_CHARGE` | ₹149 — backend-controlled only |
| `NEXT_PUBLIC_APP_URL` | Public URL (for OAuth redirects) |

## Database Schema

### Models

| Model | Purpose |
|-------|---------|
| `User` | Customers and admins |
| `Product` | Shoes with gender, price, SKU |
| `ProductImage` | Product images with sort order |
| `ProductVariant` | Size/stock variants |
| `Address` | Customer delivery addresses |
| `Cart` | Per-user shopping cart |
| `CartItem` | Items in cart |
| `Order` | Order with payment and delivery info |
| `OrderItem` | Immutable purchase snapshot |

### Role-Based Access

- `CUSTOMER` — default role
- `ADMIN` — must be set explicitly (e.g. via direct DB update or admin setup)

## Authentication

Google Sign-In only. No email/password customer accounts.

Protected routes:
- `/account/**` — requires `CUSTOMER` or `ADMIN`
- `/api/cart`, `/api/orders/**` — requires authenticated user
- `/admin/**` — requires `ADMIN` role (server-side check)

## Razorpay Integration

Webhook endpoint: `POST /api/webhooks/razorpay`

Flow:
1. Customer initiates checkout
2. Server validates cart, calculates subtotal and delivery
3. Server creates internal Order + Razorpay order
4. Customer pays via Razorpay Checkout
5. Razorpay redirects to order confirmation
6. Webhook updates order as authoritative source

Delivery charges are always server-calculated from env vars. Never trust client input.

## Admin Panel Routes

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard |
| `/admin/products` | Product list |
| `/admin/products/new` | Create product |
| `/admin/products/[id]` | Edit product |
| `/admin/orders` | Order management |
| `/admin/orders/[id]` | Order detail |
| `/admin/customers` | Customer list |

## Storefront Routes

| Path | Purpose |
|------|---------|
| `/` | Homepage |
| `/men` | Men's collection |
| `/women` | Women's collection |
| `/product/[slug]` | Product detail |
| `/search` | Product search with filters |
| `/cart` | Shopping cart |
| `/checkout` | Checkout |
| `/account` | Account overview |
| `/account/orders` | Order history |
| `/account/orders/[id]` | Order detail |

## Deployment to Hostinger

1. Push to GitHub
2. In Hostinger: Settings → Git → Connect repository
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Set Node.js version: 20+
6. Add all environment variables in Hostinger's env panel
7. Connect MySQL database and set `DATABASE_URL`
8. Deploy

First deploy will build and start the app. Subsequent pushes auto-deploy.

## License

Proprietary — KNOOS