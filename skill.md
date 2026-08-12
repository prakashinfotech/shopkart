# Skill Set – Flipkart Replica E-Commerce Application

A full-stack e-commerce platform built to replicate core Flipkart features including product search, cart management, and user authentication. This document outlines every technical skill applied during development.

---

## 1. Core Skills

### JavaScript (ES6+)
- Arrow functions, destructuring, spread/rest operators
- `async/await` and `Promise.all` for concurrent API calls
- Modules (`import/export`) across both client and server
- Optional chaining (`?.`) and nullish coalescing (`??`) for safe data access
- `URLSearchParams`, `localStorage`, `JSON.parse/stringify`

### TypeScript
- Strict typing for React components, context values, and API responses
- `interface` and `type` definitions for shared data shapes (`AuthUser`, `APIProduct`, `SearchFilters`)
- Generic functions (`parseJson<T>`) and union types (`SortOption`)
- Type assertions (`as any`, `as unknown as`) for bridging JSX/TSX contexts
- `ReactNode` typing for provider children

### React.js
- Functional components with hooks: `useState`, `useEffect`, `useCallback`, `useRef`, `useContext`
- Custom hooks: `useAuth`, `useCart`, `useSearch`
- Context API for global state (Auth, Cart, Search)
- `Suspense` boundaries for async page components
- `useSearchParams` and `useRouter` from Next.js navigation

### Node.js & Express.js
- RESTful API server with Express Router
- Middleware pipeline: CORS, `express.json()`, custom auth guard, error handler
- ES Module syntax (`import/export`) on the server with `"type": "module"`
- Environment variable management with `dotenv`
- Structured error responses with consistent JSON format

### MongoDB & Mongoose
- Document-oriented data modelling for products, users, carts, orders
- Schema definition with types, defaults, validators, and timestamps
- `ObjectId` references between collections (`ref:`)
- `.populate()` for joining related documents at query time
- `.lean()` for lightweight plain-object query results

---

## 2. Frontend Skills

### Framework – Next.js 15 (App Router)
- File-based routing under `src/app/` with nested layouts
- `'use client'` directive for interactive components
- Server-side `Metadata` API for SEO titles and descriptions
- `next/image` with `remotePatterns` for optimised image delivery
- `next/link` and `next/navigation` (`useRouter`, `useSearchParams`)
- API proxy via `rewrites()` in `next.config.ts` (frontend `/api/*` → backend `:5000/api/*`)

### Component Architecture
- Atomic design: layout (`Navbar`, `Footer`), feature (`ProductCard`, `SearchDropdown`), page (`CartPage`, `SearchPage`)
- Prop-driven composition with TypeScript interfaces
- Reusable UI primitives: `HighlightText`, `Pagination`, `FilterPanel`, `ToastContainer`
- `Suspense`-wrapped page components for graceful loading

### State Management – React Context API
| Context | Responsibilities |
|---|---|
| `AuthContext` | JWT token storage, login/register/logout, user profile |
| `CartContext` | Items array, add/remove/update, localStorage sync, toast triggers |
| `SearchContext` | Query, suggestions (debounced), results, filters, recent searches |

### API Integration
- Native `fetch` with typed response parsing
- `Authorization: Bearer <token>` header injection from `localStorage`
- Centralised error handling with fallback messages for 502/503/504
- `URLSearchParams` for clean query string construction

### Responsive Design – Tailwind CSS 3
- Mobile-first utility classes with `sm:`, `md:`, `lg:` breakpoints
- Custom design tokens: `primary` (#2874f0), `accent` (#ff6000), `surface`, `muted`
- Custom shadows (`shadow-card`, `shadow-nav`) and animations (`animate-fade-in`)
- Flexbox and CSS Grid for product grids and sidebar layouts
- Sticky navbar (`sticky top-0 z-50`) and sticky price summary (`sticky top-20`)

### UI/UX Best Practices
- Skeleton-free loading states with spinner indicators
- Empty states, error states, and retry affordances on every data-fetching view
- Toast notifications (success/error) anchored bottom-right with auto-dismiss
- Keyboard navigation in search dropdown (↑ ↓ Enter Escape)
- Outside-click detection via `useRef` + `mousedown` listener to close dropdowns
- `aria-label`, `role="listbox"`, `role="option"`, `aria-selected` for accessibility
- Debounced input (300 ms) to avoid excessive API calls while typing

---

## 3. Backend Skills

### REST API Design
- Resource-oriented URL structure: `/api/auth`, `/api/products`, `/api/cart`, `/api/orders`
- Standard HTTP verbs: `GET`, `POST`, `PUT`, `DELETE`
- Query parameters for filtering (`q`, `sort`, `minPrice`, `maxPrice`, `page`, `limit`)
- Consistent JSON response envelope: `{ products, total, page, pages }`

### CRUD Operations
- **Cart**: create-on-first-add, merge duplicates by incrementing quantity, update quantity, remove by productId, cascade-delete legacy items
- **Products**: full-text search with `$regex`, field projection with `.select()`, pagination with `.skip()` + `.limit()`
- **Users**: registration with password hashing, login with credential verification, profile fetch via JWT

### Middleware
- **`protect`** – extracts and verifies JWT from `Authorization: Bearer` header; attaches `req.user`
- **`isAdmin`** – role guard checking `req.user.role === 'admin'`
- **`errorHandler`** – catches unhandled errors and returns `{ message }` JSON
- **`upload`** – Multer middleware for multipart file uploads (Cloudinary integration)

### Authentication – JWT
- `jsonwebtoken` for token signing (`JWT_SECRET`, `JWT_EXPIRES_IN = 7d`)
- `bcryptjs` for password hashing (salt rounds: 10) and comparison
- Stateless auth: no sessions; token sent with every protected request
- Token stored in `localStorage` on the client; cleared on logout

### Error Handling
- `try/catch` in every async controller with `res.status(500).json({ message })`
- Input validation before DB writes (required fields, min quantity)
- Legacy document filtering (`validItems()`) to avoid schema validation failures on old data
- Graceful `populate` error prevention by ensuring all referenced models are imported before queries run

---

## 4. Database Skills

### Schema Design

**User**
```
name, email, password (hashed), phone, role (user|admin), addresses[], wishlist[]
```

**Product**
```
name, description, price, mrp, images[], category (→ Category), brand,
stock, ratings, numReviews, specs (Map), isFeatured
```

**Cart**
```
user (→ User, unique), items[{ productId, name, price, mrp, image, quantity }]
```

**Category**
```
name (unique), slug (unique), image, parent (→ Category, self-referential)
```

**Order**
```
user (→ User), items[], address, payment { method, status, transactionId },
status (placed|processing|shipped|delivered|cancelled), total
```

**Review**
```
product (→ Product), user (→ User), rating (1–5), comment
Compound unique index: (product + user) — one review per user per product
```

### Relationships
- One-to-many: User → Orders, Product → Reviews
- One-to-one: User → Cart (enforced by `unique: true` on `cart.user`)
- Many-to-one: Product → Category (with self-referential parent for sub-categories)
- Embedded sub-documents: Cart items stored inside the Cart document (snapshot pattern — price captured at add-to-cart time)

### Query Optimisation
- `.lean()` on all read-only queries — returns plain JS objects, skipping Mongoose hydration overhead
- `.select('field1 field2')` field projection — avoids transferring unused fields over the wire
- `Promise.all([find(), countDocuments()])` — runs data fetch and count in parallel
- `strict: false` on Cart item schema — allows legacy documents to pass through without validation errors

### Indexing
- Compound text index on `Product`: `{ name: 'text', brand: 'text', description: 'text' }` for full-text search
- Unique index on `User.email`, `Category.name`, `Category.slug`
- Unique index on `Cart.user` — ensures one cart per user at the database level
- Compound unique index on `Review`: `(product, user)`

---

## 5. Feature-Based Skills

### Authentication Flow
- Register → hash password → issue JWT → store token in `localStorage`
- Login → verify credentials → issue JWT → hydrate user state
- Auto-login on page load: read token from `localStorage` → `GET /api/auth/me` → set user
- Logout → remove token → clear user state → redirect to home

### Add to Cart
| Scenario | Behaviour |
|---|---|
| Guest user | Items stored in `localStorage` as JSON array |
| User logs in | `localStorage` items merged into DB cart via sequential POST calls, then cleared |
| Product already in cart | Quantity incremented (both client and server-side) |
| Out-of-stock product | Add button disabled; "Out of stock" label shown |

- Cart count badge in Navbar updates reactively from `cartCount` computed value
- Toast notification shown on every add action (success/error)
- Loading state on quantity controls prevents double-clicks

### Search System
- **Debounce (300 ms)**: `useEffect` with `setTimeout`/`clearTimeout` — suggestions fetch only fires after user pauses typing
- **Live dropdown**: top 5 suggestions with product thumbnail, name (highlighted), brand, price
- **Keyword highlighting**: regex split + `<mark>` wrapping matched segments
- **Keyboard navigation**: ArrowUp/Down cycles through items; Enter selects; Escape closes
- **Recent searches**: stored in `localStorage` (`shopkart_recent`), max 6 entries, individually removable
- **Outside-click close**: `mousedown` listener on `document`, cancelled if click is inside `searchRef`
- **Full results page** at `/search?q=`: grid layout, sort (5 options), price range filters (presets + custom), pagination

### Cart Page
- Quantity stepper (− / +) with loading spinner during API calls
- Remove item with immediate optimistic update
- Price summary: MRP total, discount amount, free delivery, final total
- Savings callout: "You will save ₹X on this order"
- Empty cart state with CTA back to home

---

## 6. Performance & Optimisation

### Image Optimisation
- `next/image` with explicit `width`/`height` for fixed-size thumbnails (search dropdown)
- `next/image` with `fill` + `sizes` for responsive product card images
- `remotePatterns` whitelist in `next.config.ts` (`picsum.photos`, `cloudinary`, `unsplash`, `placehold.co`)
- `object-contain` to avoid distortion on non-standard aspect ratios

### API Call Efficiency
- Debounced suggestions fetch (300 ms) — zero calls while user is mid-word
- `Promise.all` for parallel DB queries (search results + count)
- Field projection (`.select()`) to minimise payload size
- `.lean()` to skip Mongoose document hydration on all read queries

### State & Render Efficiency
- `useCallback` on all context methods to prevent child re-renders
- `useRef` for debounce timer and outside-click detection (no re-render triggered)
- Context split by concern (Auth / Cart / Search) — changes in one don't re-render consumers of another
- Computed values (`cartCount`, `cartTotal`) derived inline — no redundant state

---

## 7. Testing & Debugging

### API Testing – Postman
- Collection of requests for all endpoints: auth, products, cart, orders
- Environment variables for `BASE_URL` and `AUTH_TOKEN`
- Testing protected routes by setting `Authorization: Bearer {{token}}` header
- Validating request body structure and response shape for each endpoint

### Frontend Debugging
- React DevTools for inspecting component tree and context values
- `console.log` with structured objects for API response inspection
- TypeScript compiler errors as first-line defence against shape mismatches
- IDE diagnostics (VS Code) surfacing unused variables, null safety issues, missing props

### Backend Debugging
- `console.error(err)` in catch blocks for server-side stack traces
- Mongoose validation error messages parsed and forwarded to the client (`err.message`)
- Checking model registration order to fix "Schema hasn't been registered" errors
- MongoDB Compass for inspecting live collection documents and index definitions

---

## 8. Tools & Technologies

| Tool | Purpose |
|---|---|
| **VS Code** | Primary IDE with ESLint, Prettier, TypeScript language server |
| **Git** | Version control — feature branches, commit history |
| **GitHub** | Remote repository and collaboration |
| **Postman** | REST API testing and documentation |
| **MongoDB Compass** | GUI for browsing collections, running queries, inspecting indexes |
| **Node.js 18+** | JavaScript runtime for the Express server |
| **npm / Concurrently** | Package management; running client + server simultaneously with one command |
| **dotenv** | Environment variable management (`.env` file → `process.env`) |
| **Cloudinary** | Cloud image storage and delivery (configured, ready for upload integration) |
| **Lucide React** | Consistent icon library across all UI components |

---

## 9. Project Architecture

```
flipkart-clone/
├── client/                        # Next.js 15 frontend (TypeScript)
│   └── src/
│       ├── app/                   # App Router pages & layouts
│       │   ├── cart/page.tsx      # Cart page
│       │   ├── search/page.tsx    # Search results page
│       │   ├── login/page.tsx     # Login page
│       │   ├── register/page.tsx  # Register page
│       │   ├── layout.tsx         # Root layout
│       │   └── providers.tsx      # Auth + Cart + Search context wrappers
│       ├── components/
│       │   ├── layout/            # Navbar, Footer
│       │   ├── home/              # HeroBanner, CategoryBar, ProductGrid, DealsBanner
│       │   ├── product/           # ProductCard
│       │   ├── search/            # SearchDropdown
│       │   └── common/            # ToastContainer
│       ├── context/
│       │   ├── AuthContext.tsx    # JWT auth state
│       │   ├── CartContext.jsx    # Cart state + localStorage sync
│       │   └── SearchContext.tsx  # Search state + debounce
│       └── lib/
│           └── data.ts            # Static product data (home page)
│
└── server/                        # Express.js backend (ES Modules)
    ├── models/                    # Mongoose schemas
    │   ├── User.js
    │   ├── Product.js
    │   ├── Category.js
    │   ├── Cart.js
    │   ├── Order.js
    │   └── Review.js
    ├── controllers/               # Route handler logic
    │   ├── authController.js
    │   ├── productController.js
    │   └── cartController.js
    ├── routes/                    # Express routers
    ├── middleware/                 # protect, isAdmin, errorHandler, upload
    ├── config/                    # DB connection, Cloudinary config
    ├── seed.js                    # Database seeding script
    └── server.js                  # App entry point
```

---

## 10. Deployment (Optional)

| Layer | Platform | Notes |
|---|---|---|
| **Frontend** | Vercel | Native Next.js support; automatic preview deployments on push |
| **Backend** | Render / Railway | Node.js server with environment variable configuration |
| **Database** | MongoDB Atlas | Managed cloud MongoDB; update `MONGO_URI` in `.env` |
| **Images** | Cloudinary | `config/cloudinary.js` reads `CLOUDINARY_*` env vars, but uploads are not yet wired to it — the upload middleware currently writes to local disk. Wiring Cloudinary into `middleware/upload.js` is required before local-disk storage can be replaced |

**Server environment variables required for production:**
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/flipkart-clone
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Client:** the API proxy target is currently hardcoded in `client/next.config.ts` (`rewrites()` → `http://localhost:5000`), not read from an environment variable. Deploying the client against a non-local backend requires editing that file's `destination` values — there is no `NEXT_PUBLIC_API_URL` (or equivalent) wired into the codebase today.
