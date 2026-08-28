# stringer-tracker

ระบบบันทึกการขึ้นเอ็นเทนนิส พร้อมระบบ user และ admin dashboard

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind CSS) |
| Backend  | Go 1.24 + Gin + GORM + pgx        |
| Database | PostgreSQL (local / Coolify) + Excelize |
| Auth     | JWT (HS256) + bcrypt (cost 12)    |

## Quick Start

### Prerequisites
- PostgreSQL 17 on `localhost:5432` (user `postgres`, password `postgres`)
- Go 1.24+
- [Task](https://taskfile.dev) และ [Air](https://github.com/air-verse/air)
- [Bun](https://bun.sh)

### รันทั้งกองด้วยคำสั่งเดียว

ครั้งแรก (จากรากโปรเจกต์):
```bash
bun install
bun run setup
```

ทุกครั้งหลังจากนี้:
```bash
bun run dev
```

หรือ `task dev` ก็ได้เหมือนกัน — สคริปต์จะ migrate กับ PostgreSQL 17 บนเครื่อง (`localhost:5432`) แล้วเปิด backend (`air`) กับ frontend (`next dev`)

เปิด [http://localhost:3000](http://localhost:3000)

### รันแยกชิ้น (ถ้าต้องการ)

Backend จาก `backend/`:
```bash
task migrate
task seed
task dev
```

Frontend จาก `frontend/`:
```bash
bun install
bun run dev
```

### 4. Deploy

คู่มือขึ้นเครื่องส่วนตัวด้วย Coolify อยู่ที่ [docs/README.md](docs/README.md)

สรุปสั้นๆ: ทดสอบด้วย `docker compose` ก่อน แล้วติดตั้ง Coolify บน Ubuntu → สร้าง PostgreSQL + backend + frontend → เปิด Auto Deploy จาก `main`

## Default Admin

- Username: `admin`
- Password: `admin123`
- **เปลี่ยนรหัสผ่านหลัง login ครั้งแรก!**

## API Endpoints

### Auth
| Method | Path                        | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | /api/auth/login             | -    | Login, รับ JWT token     |
| GET    | /api/auth/me                | JWT  | ข้อมูล user ปัจจุบัน    |
| POST   | /api/auth/change-password   | JWT  | เปลี่ยนรหัสผ่าน         |

### Records
| Method | Path                        | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| GET    | /api/records                | JWT  | ดึง records (filter ได้) |
| POST   | /api/records                | JWT  | สร้าง record ใหม่        |
| PUT    | /api/records/:id            | JWT  | แก้ไข record             |
| DELETE | /api/records/:id            | JWT  | ลบ record                |
| GET    | /api/records/summary/daily  | JWT  | สรุปรายวัน              |
| GET    | /api/records/summary/monthly| JWT  | สรุปรายเดือน            |

### Admin
| Method | Path                | Auth       | Description         |
|--------|---------------------|------------|---------------------|
| GET    | /api/admin/users    | JWT+Admin  | ดู user ทั้งหมด    |
| POST   | /api/admin/users    | JWT+Admin  | สร้าง user ใหม่    |
| PUT    | /api/admin/users/:id| JWT+Admin  | แก้ไข / toggle user |
| DELETE | /api/admin/users/:id| JWT+Admin  | ลบ user             |
| GET    | /api/admin/report   | JWT+Admin  | Report รวมทุก user  |
| POST   | /api/records/export | JWT       | Export CSV/Excel    |

## Project Structure

```
stringer-tracker/
├── Taskfile.yml               ← root: task dev / setup / down
├── package.json               ← root: bun run dev / setup / down
├── scripts/prepare-dev.ts     ← migrate กับ PostgreSQL บน :5432
├── docker-compose.yml         ← postgres + backend + frontend (ทดสอบก่อนขึ้น Coolify)
├── docs/
│   ├── README.md              ← คู่มือ deploy (Coolify)
│   └── architecture.md        ← full system architecture
├── backend/
│   ├── cmd/
│   │   ├── server/main.go     ← entry point (HTTP server + graceful shutdown)
│   │   └── seed/main.go       ← seed admin user
│   ├── internal/
│   │   ├── config/config.go   ← env config
│   │   ├── database/          ← GORM connection
│   │   ├── handler/           ← HTTP handlers (auth, records, admin, export)
│   │   ├── middleware/        ← JWT auth, admin-only
│   │   ├── model/             ← GORM models (User, Record) + DTOs
│   │   └── router/router.go   ← Gin router setup + CORS
│   ├── migrations/
│   │   ├── 001_init.sql       ← DB schema + triggers
│   │   └── 002_add_record_type.sql ← type column (string | sale)
│   ├── go.mod
│   ├── Makefile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/               ← Next.js App Router pages
    │   │   ├── login/         ← หน้า login
    │   │   └── (dashboard)/   ← daily, summary, filter, admin
    │   ├── components/        ← NavBar, Toast, ConfirmDialog, RecordForm, etc.
    │   ├── lib/               ← api client (authApi, recordsApi, adminApi), utils
    │   └── types/             ← TypeScript types (User, Record, DaySummary, etc.)
    ├── Dockerfile             ← Next.js standalone image สำหรับ Coolify
    ├── next.config.mjs        ← proxy /api/* → backend + standalone output
    ├── tailwind.config.ts
    └── .env.example
```

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key-here
PORT=4000
GIN_MODE=debug
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```
