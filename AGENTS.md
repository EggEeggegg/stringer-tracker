# Tennis String Tracker - Full-Stack Project

## Tech Stack
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: Go 1.24 + Gin + GORM + pgx
- Database: PostgreSQL (Neon.tech) + Excelize (CSV/Excel export)
- Auth: JWT (`golang-jwt/jwt/v5`) + bcrypt (cost 12)

## Project Structure

```text
tennis-tracker/
|- backend/
|  |- go.mod
|  |- Makefile
|  |- .env.example
|  |- migrations/
|  |  |- 001_init.sql
|  |  |- 001_final_schema.sql
|  |  `- 002_add_record_type.sql
|  |- cmd/
|  |  |- server/main.go
|  |  |- migrate/main.go
|  |  `- seed/main.go
|  `- internal/
|     |- config/config.go
|     |- database/database.go
|     |- model/
|     |  |- user.go
|     |  `- record.go
|     |- middleware/auth.go
|     |- handler/
|     |  |- handler.go
|     |  |- auth.go
|     |  |- records.go
|     |  `- admin.go
|     `- router/router.go
|- frontend/
|  |- package.json
|  |- next.config.mjs
|  |- tailwind.config.ts
|  |- public/
|  |  |- icon-192.png
|  |  `- icon-512.png
|  `- src/
|     |- types/index.ts
|     |- lib/
|     |  |- api.ts
|     |  `- utils.ts
|     |- components/
|     |  |- NavBar.tsx
|     |  |- RecordCard.tsx
|     |  |- RecordForm.tsx
|     |  |- Toast.tsx
|     |  `- ConfirmDialog.tsx
|     `- app/
|        |- layout.tsx
|        |- globals.css
|        |- page.tsx
|        |- login/page.tsx
|        `- (dashboard)/
|           |- layout.tsx
|           |- daily/page.tsx
|           |- summary/page.tsx
|           `- admin/page.tsx
|- README.md
|- render.yaml
`- AGENTS.md
```

## Environment Variables

### backend/.env
```env
DATABASE_URL=postgresql://user:pass@host:5432/tennis_tracker?sslmode=require
JWT_SECRET=strong-random-secret-at-least-32-chars
PORT=8080
CORS_ORIGIN=https://your-app.vercel.app
GIN_MODE=release
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

## Important Commands

### Backend
```bash
cd backend
cp .env.example .env
go mod tidy
make migrate
make seed
make run
make build
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
npm run build && npm run start
npm run type-check
```

## API Endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### Records
- `GET    /api/records?date=YYYY-MM-DD`
- `GET    /api/records?start=&end=`
- `GET    /api/records/summary/daily?start=&end=`
- `GET    /api/records/summary/monthly?year=`
- `GET    /api/records/export?start=&end=`
- `GET    /api/records/copy-list?start=&end=`
- `POST   /api/records`
- `PUT    /api/records/:id`
- `DELETE /api/records/:id`

### Admin
- `GET    /api/admin/users`
- `POST   /api/admin/users`
- `PUT    /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET    /api/admin/report?start=&end=&user_id=`

## Current Record Behavior
- `record_type` supports `string` and `other`
- `string` records no longer require `racket`
- In the create form, the racket name field is hidden
- `other` records use `activity_name` and custom `price`
- `is_new_racket` adds a 200 baht commission on string jobs

## Copy Jobs List Behavior
- Source: `GET /api/records/copy-list?start=&end=`
- Groups records by date in `dd/mm`
- For `string` records, output uses `string1` and `string2`
- For `other` records, output uses `activity_name`
- Appends `note` as `(note)` when present
- Output is returned as plain text for clipboard copy from the summary page

## Database Notes
- `users`: id, username, password, name, role, is_active
- `records`: id, user_id, date, seq, record_type, racket, string1, string2, price, is_new_racket, activity_name, note
- Both tables use `created_at` and `updated_at`
- `updated_at` is maintained by PostgreSQL trigger

## Important Guardrails
- Never store plain text passwords
- Always hash with bcrypt cost 12
- Every records query must filter by `user_id`
- Admin routes must always use `middleware.AdminOnly()`
- CORS must whitelist the frontend URL only

## Frontend Notes
- UI text was normalized back to UTF-8 after prior encoding issues
- PWA behavior has been removed from app layout
- `frontend/public/sw.js` now only exists as a cleanup worker to unregister old service workers and clear stale caches
- `frontend/src/components/DevServiceWorkerReset.tsx` may still exist as an unused leftover file because it could not be deleted in-session, but it is not imported anymore

## Current Status
- [x] Backend auth, records CRUD, admin CRUD
- [x] Daily summary, monthly summary, Excel export
- [x] Copy jobs list endpoint and summary-page button
- [x] Create record without requiring racket name
- [x] Removed active PWA integration from layout
- [ ] Deploy backend (Railway / Render)
- [ ] Deploy frontend (Vercel)
