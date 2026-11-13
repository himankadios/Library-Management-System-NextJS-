# AuraLib Pro — Library Management & Digital File Management System

A complete, production-grade, commercial-quality web application built from scratch for academic institutions, universities, and enterprise research libraries. It seamlessly unites physical library book circulation with an institutional digital document management repository.

---

## 🌟 Key Highlights

- **Full-Stack Commercial Architecture:** Next.js 14 App Router (JavaScript/JSX), Node.js API Route Handlers, SQLite via Prisma ORM.
- **Role-Based Access Control (RBAC):** Three distinct roles — ADMIN, LIBRARIAN, STUDENT — with tailored portals and server-side + middleware-enforced access control.
- **Atomic Circulation Engine:** Database transactions guarantee data integrity when issuing or returning books, preventing stock count discrepancies.
- **Integrated Late Fine Calculation:** Configurable daily overdue rate with real-time calculation, fine assessment, payment, and waiver workflows.
- **Desktop-Style Digital File Explorer:** Full folder hierarchy, grid/list views, in-browser PDF/image preview, secure file streaming, drag-and-drop uploads.
- **Advanced Security:** File upload validation (extension + MIME + 50MB limit), UUID file naming, files stored outside web directory, bcrypt password hashing, HttpOnly session cookies, Next.js Edge middleware for server-side route protection.
- **Interactive Visual Analytics:** Dashboard metrics and charts using Recharts (monthly issuance trends, category distributions).
- **Comprehensive Audit Trail:** Every administrative action logged to ActivityLog; users receive contextual notifications.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 14 App Router (JavaScript/JSX) |
| Styling | Tailwind CSS 3 with custom Navy/Royal/Teal palette, Dark/Light mode |
| Backend | Next.js API Route Handlers (Node.js) |
| Database | SQLite (file-based, zero configuration) |
| ORM | Prisma v5 (migrations, relations, atomic transactions) |
| Auth | JWT via `jose`, HttpOnly SameSite session cookies |
| Password Security | bcryptjs (10 salt rounds) |
| Icons | Lucide React |
| Charts | Recharts (Area, Pie, Bar) |
| File Storage | Local filesystem (`/storage/uploads`, outside web root) |
| Validation | Zod (schema-based API validation) |
| Route Protection | Next.js Edge Middleware (`middleware.js`) |

---

## 👥 Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | `admin@library.com` | `admin123` |
| **LIBRARIAN** | `librarian@library.com` | `librarian123` |
| **STUDENT** | `student@library.com` | `student123` |

> **Tip:** The login page and homepage have one-click demo fast-fill buttons — no typing needed.

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Set up environment file
Copy the example environment file (or the `.env` file is already configured):
```bash
# .env already exists, but example values:
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="super-secret-jwt-token-library-digital-system-key-2026-secure-session"
NEXT_PUBLIC_APP_NAME="AuraLib Pro"
```

### Step 3 — Run database migrations (create tables)
```bash
npx prisma migrate dev --name init
```
Or if you want to sync without migration history:
```bash
npx prisma db push
```

### Step 4 — Seed the database with demo data
```bash
node prisma/seed.js
```
Or use the npm script:
```bash
npm run seed
```
This creates all users, 12 academic books, 7 category folders, 5 digital files on disk, transactions, fines, reservations, notifications, and system settings.

### Step 5 — Start development server
```bash
npm run dev
```

### Step 6 — Open in browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
library-system/
├── app/
│   ├── layout.jsx                         # Root layout with Auth + Toast providers
│   ├── page.jsx                           # Public landing page with 1-click demo login
│   ├── globals.css                        # Tailwind directives + CSS theme tokens
│   ├── not-found.jsx                      # Custom 404 page
│   ├── error.jsx                          # Runtime error boundary
│   ├── login/page.jsx                     # Sign in with demo fast-fill
│   ├── register/page.jsx                  # Student self-registration
│   ├── forgot-password/page.jsx           # Password reset request
│   ├── reset-password/page.jsx            # Password reset confirmation
│   └── dashboard/
│       ├── layout.jsx                     # Sidebar + Topbar shell (auth guard)
│       ├── page.jsx                       # Dashboard: live stats + Recharts
│       ├── books/
│       │   ├── page.jsx                   # Catalog: grid/list, filters, CSV import/export
│       │   ├── new/page.jsx               # Add new book
│       │   ├── [id]/page.jsx              # Book detail with reservation hold
│       │   ├── [id]/edit/page.jsx         # Edit book
│       │   └── categories/page.jsx        # Category management
│       ├── circulation/
│       │   ├── issue/page.jsx             # Issue book form
│       │   ├── return/page.jsx            # Return book + live fine calculator
│       │   ├── issued/page.jsx            # Active issued books
│       │   ├── overdue/page.jsx           # Overdue loans with dynamic fine rate
│       │   └── history/page.jsx           # Full borrowing history
│       ├── digital-files/
│       │   ├── page.jsx                   # File explorer: grid/list, preview, download
│       │   └── categories/page.jsx        # File category & folder management
│       ├── members/
│       │   ├── page.jsx                   # Member directory + add member
│       │   └── [id]/page.jsx              # Member profile + fine settlement
│       ├── reservations/page.jsx          # Book hold requests
│       ├── reports/page.jsx               # Reports & analytics + CSV export
│       ├── notifications/page.jsx         # Notification center
│       ├── activity-logs/page.jsx         # Admin audit trail
│       ├── settings/page.jsx              # System configuration
│       └── profile/page.jsx              # Profile update + password change
├── middleware.js                          # Edge middleware: server-side route protection
├── components/
│   ├── layout/                            # Sidebar, Topbar, Breadcrumb, ThemeToggle
│   ├── providers/                         # AuthProvider, ToastProvider
│   ├── ui/                                # StatCard, Badge, Modal, ConfirmDialog, Skeletons, Pagination, EmptyState
│   ├── charts/                            # BookIssuanceChart, CategoryPieChart, MonthlyActivityChart
│   └── files/                             # FilePreviewModal, UploadModal
├── lib/
│   ├── auth.js                            # JWT + bcrypt + session cookies
│   ├── logger.js                          # Activity logs + notifications helpers
│   ├── prisma.js                          # Prisma singleton client
│   ├── storage.js                         # Safe file storage + path traversal guard
│   └── validators.js                      # Zod validation schemas
├── prisma/
│   ├── schema.prisma                      # 12-model SQLite schema
│   └── seed.js                            # Full seed with real file generation
├── storage/
│   └── uploads/                           # Physical file storage (outside web root)
├── .env                                   # Environment configuration
└── package.json
```

---

## 🗄️ Database Schema (12 Models)

| Model | Description |
| :--- | :--- |
| `User` | Identity store: ADMIN, LIBRARIAN, STUDENT roles, password hash, avatar |
| `Member` | Student profile (1:1 with User): rollNumber, department, borrowing limits |
| `Category` | Book catalog classifications (7 academic disciplines) |
| `Book` | Catalog: title, ISBN, publisher, copies, shelf number, cover image |
| `BookTransaction` | Circulation records: issue date, due date, return date, overdue status, fine amount |
| `Reservation` | Book hold requests: PENDING, APPROVED, REJECTED, FULFILLED |
| `Fine` | Overdue fees: amount, UNPAID/PAID/WAIVED, payment date |
| `Folder` | Hierarchical document directories with role-based access permissions |
| `DigitalFile` | Uploaded files: UUID storage name, MIME type, size, download count |
| `Notification` | User alerts: INFO, SUCCESS, WARNING, DANGER |
| `ActivityLog` | Immutable audit trail: action, entity, actor, timestamp |
| `Setting` | Dynamic key-value configuration (FINE_PER_DAY, BORROW_DURATION_DAYS, etc.) |

---

## ✅ Implemented Features

### Authentication
- [x] Login with HttpOnly JWT cookie session
- [x] Student registration with member profile creation
- [x] Forgot Password (demo code shown on screen)
- [x] Reset Password with verification code
- [x] Change Password (from profile page)
- [x] Server-side route protection via Next.js Edge Middleware
- [x] Client-side auth guard in dashboard layout
- [x] Role-based access control on all API routes

### Dashboard
- [x] Real-time statistics (books, available, issued, overdue, members, files, reservations)
- [x] Monthly circulation area chart (last 6 months)
- [x] Category distribution pie chart
- [x] Recent activity feeds (issues, returns, new books)
- [x] Student-specific personal dashboard (active loans, fines, reservations)
- [x] Dark mode / Light mode toggle (persisted in localStorage)

### Book Management
- [x] Add, edit, delete books (staff only)
- [x] Book detail page
- [x] Grid and list catalog view
- [x] Search by title, author, ISBN, publisher
- [x] Filter by category and availability
- [x] Sort by multiple fields
- [x] Pagination
- [x] CSV export of full catalog
- [x] Bulk CSV import (auto-creates missing categories)
- [x] Book category management (create, delete)
- [x] Student book reservation from catalog

### Circulation
- [x] Issue book to member (validates limits, availability, duplicate prevention)
- [x] Return book with live overdue days + fine calculator
- [x] Fine assessed from configurable daily rate (settings-driven)
- [x] Atomic database transactions for issue/return
- [x] Auto-flagging of ISSUED → OVERDUE on query
- [x] Issued books page (filterable, searchable, paginated)
- [x] Overdue books page with dynamic fine calculation
- [x] Full borrowing history with fine amounts
- [x] Fine payment and waiver by staff (from member profile)

### Digital File Management
- [x] Upload files (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, ZIP)
- [x] File validation (extension, MIME type, 50MB size limit)
- [x] UUID-named secure storage outside web root
- [x] In-browser PDF and image preview (FilePreviewModal)
- [x] Text file preview
- [x] Download with Content-Disposition streaming
- [x] Download count tracking
- [x] Rename files and update description
- [x] Delete files (removes disk file + DB record)
- [x] Create folders (hierarchical tree)
- [x] Delete folders
- [x] Navigate folder hierarchy with breadcrumb
- [x] Grid and list view
- [x] Search, category filter, file type filter
- [x] Role-based file access (ALL / ADMIN_LIBRARIAN / ADMIN_ONLY)
- [x] File categories management page

### Member Management
- [x] Staff member directory with search and status filter
- [x] Add new member (creates User + Member in transaction)
- [x] Member detail page (loans, fines, reservations)
- [x] Edit member profile (name, department, course, borrowing limit, status)
- [x] Block/unblock member account status
- [x] Delete member (admin only)
- [x] Fine settlement (pay / waive) from member profile

### Reservations
- [x] Student: reserve book from catalog or book detail page
- [x] Staff: approve, reject reservations
- [x] Student: cancel own pending reservations
- [x] Auto-fulfill reservation when book is issued

### Reports & Analytics
- [x] Date-range filtered reports
- [x] Summary stats (total books, copies, issued, returned, overdue, fines)
- [x] Monthly circulation velocity chart (12-month breakdown)
- [x] Most borrowed books (top 5)
- [x] Digital file category distribution
- [x] CSV export of full circulation history
- [x] Print-friendly view (window.print())

### Notifications
- [x] Notification center page
- [x] Topbar notification dropdown with unread badge
- [x] Mark all as read
- [x] Auto-notifications on issue, return, fine, reservation events

### Activity Logs (Admin)
- [x] Full audit trail of all system events
- [x] Filter by action type (CREATE, UPDATE, DELETE, ISSUE, RETURN, UPLOAD, LOGIN)
- [x] Paginated log viewer

### Settings (Admin)
- [x] Fine per day rate
- [x] Standard loan duration (days)
- [x] Max books per student
- [x] Library name, email, phone

### Profile
- [x] Update name, avatar URL, phone, address
- [x] Change password with current password verification

### UI/UX
- [x] Responsive on desktop, tablet, and mobile
- [x] Dark mode / light mode (system preference + manual toggle)
- [x] Loading skeletons on all data-heavy pages
- [x] Empty state components
- [x] Toast notifications (success, warning, error, info)
- [x] Confirmation dialogs for destructive actions
- [x] Breadcrumb navigation
- [x] Smooth transitions and hover animations
- [x] Custom 404 and error pages

---

## 🔒 Security Implementation

- Passwords hashed with bcrypt (10 salt rounds)
- JWT session tokens in HttpOnly, SameSite=Lax cookies
- Server-side route protection via Next.js Edge Middleware
- API-level `requireAuth(request, allowedRoles)` on every protected endpoint
- File uploads: extension whitelist + MIME verification + 50MB size cap
- Uploaded files stored with UUID names in `/storage/uploads` (not web-accessible)
- Path traversal protection via `path.resolve` prefix check
- Files never executed, served via streaming with explicit Content-Type

---

## 🌐 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma SQLite URL | `file:./prisma/dev.db` |
| `JWT_SECRET` | JWT signing secret (change in production) | see `.env` |
| `NEXT_PUBLIC_APP_NAME` | App title shown in UI | `AuraLib Pro` |

---

## 🏗️ Build for Production

```bash
npm run build
npm start
```

---

*Built as a college final-year project demonstrating a production-grade full-stack application with real database operations, authentication, file management, and analytics.*
