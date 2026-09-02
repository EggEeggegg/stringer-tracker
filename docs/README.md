# Deploy — stringer-tracker

ขึ้น production บนเครื่องส่วนตัวด้วย [Coolify](https://coolify.io) แทน Vercel / Render / Neon

| Service  | รันที่             |
|----------|--------------------|
| Frontend | Coolify (Next.js)  |
| Backend  | Coolify (Go API)   |
| Database | Coolify PostgreSQL |

Production รันบน Coolify ทั้ง frontend, backend และ PostgreSQL

## พอร์ต

| หน้าที่ | พอร์ต | URL ตอนรัน local |
|---------|-------|------------------|
| หน้าบ้าน (frontend) | 3000 | http://localhost:3000 |
| หลังบ้าน (backend API) | 4000 | http://localhost:4000 |
| Coolify UI | 8000 | http://IP-เครื่อง:8000 |
| PostgreSQL | 5432 | ใช้ผ่าน `DATABASE_URL` |

## เครื่องปลายทางใช้ OS อะไรได้

ใช้ได้: **Ubuntu 22.04, 24.04, 26.04** (LTS)

- **Ubuntu 26.04** ใช้ได้ เป็น LTS และมีคนติดตั้ง Coolify จริงแล้ว
- เอกสารทางการของ Coolify ยังเขียนรายชื่อ installer อัตโนมัติเป็น 20.04 / 22.04 / 24.04 เป็นหลัก ถ้าสคริปต์ติดตั้งบน 26.04 ไม่ผ่าน ให้ติดตั้ง Docker เองแล้วทำ [manual installation](https://coolify.io/docs/get-started/installation)
- ถ้าอยากเสี่ยงน้อยสุด ใช้ **Ubuntu 24.04**

ความต้องการเครื่อง:

- Linux 64-bit (ไม่ใช่ Windows โดยตรง)
- RAM แนะนำ 4 GB ขึ้นไป
- ดิสก์แนะนำ 40 GB ขึ้นไป
- โดเมนชี้มาที่เครื่อง เช่น `app.yourdomain.com` และ `api.yourdomain.com`
- เปิดพอร์ต `22`, `80`, `443`, `8000` (และ `6001` / `6002` ถ้า Coolify ใช้ realtime/terminal)

เครื่องควรเป็นเครื่องใหม่ ยังไม่มี Docker / Nginx / Traefik บนพอร์ต 80, 443 เพราะ installer ของ Coolify จะติดตั้ง Docker และ proxy เอง

## ทดสอบบนเครื่องตัวเองก่อน (Docker Compose)

เปิด Docker Desktop แล้วที่รากโปรเจกต์:

```bash
docker compose up -d --build postgres backend frontend
docker compose --profile setup run --rm migrate
```

เปิด `http://localhost:3000` — frontend เรียก API ที่ `http://localhost:4000`

สร้าง admin ครั้งแรกจาก `backend/` โดยให้ `DATABASE_URL` ชี้ไป postgres ใน compose:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stringer_tracker?sslmode=disable
```

```bash
task seed
```

อย่าใส่ seed ในทุก deploy เพราะ seed reset ฐานข้อมูล

หยุดเครื่อง:

```bash
docker compose down
```

ข้อมูลยังอยู่ใน volume จนกว่าจะรัน `docker compose down -v`

## ติดตั้ง Coolify

บนเครื่องปลายทาง (SSH เข้าไปแล้วรันด้วย sudo/root):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

เปิด `http://IP-เครื่อง:8000` สร้าง admin ของ Coolify แล้วเชื่อม GitHub / Git ของ repo นี้

## ตั้งแอปใน Coolify

สร้าง **Project** เช่น `stringer-tracker` แล้วเพิ่ม 3 อย่างตามลำดับนี้

### 1. PostgreSQL

เพิ่ม Database → PostgreSQL ในโปรเจกต์  
คัดลอก connection string ไปใส่ backend เป็น `DATABASE_URL`

### 2. Backend

- Dockerfile: `backend/Dockerfile`
- Context: `backend/`
- Port: `4000`
- โดเมน: `https://api.yourdomain.com`

Env:

```env
DATABASE_URL=postgresql://...          # จาก Postgres ของ Coolify
JWT_SECRET=สุ่มอย่างน้อย-32-ตัวอักษร
CORS_ORIGIN=https://app.yourdomain.com
GIN_MODE=release
PORT=4000
```

รัน migrate ครั้งแรกแบบ one-off ใน container ของ backend:

```bash
./migrate
```

สร้าง admin ครั้งแรกด้วย `task seed` จากเครื่อง dev ที่ชี้ `DATABASE_URL` ของ production เมื่อตั้งใจเริ่มระบบใหม่เท่านั้น

### 3. Frontend

- Dockerfile: `frontend/Dockerfile`
- Context: `frontend/`
- Port: `3000`
- โดเมน: `https://app.yourdomain.com`
- Build argument: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- Env / build argument: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

`NEXT_PUBLIC_API_URL` และ `NEXT_PUBLIC_GA_MEASUREMENT_ID` ถูก bake ตอน build ถ้าเปลี่ยนค่าต้องกด Deploy frontend ใหม่ ไม่พอแค่แก้ env แล้ว restart

## หลังตั้งเสร็จ

1. เปิด **Auto Deploy** จาก branch `main` — `git push` แล้ว Coolify build ใหม่
2. กด **Deploy** ใน Coolify เมื่ออยากปล่อยมือเองโดยไม่รอ push
3. เปิด `https://app.yourdomain.com` login ด้วย `admin` / `admin123` แล้วเปลี่ยนรหัสผ่านทันที

## ไฟล์ที่เกี่ยวข้อง

- [docker-compose.yml](../docker-compose.yml) — ทดสอบทั้งก้อนก่อนขึ้น Coolify
- [backend/Dockerfile](../backend/Dockerfile) — Go API + binary `./migrate`
- [frontend/Dockerfile](../frontend/Dockerfile) — Next.js standalone
- [backend/.env.example](../backend/.env.example)
- [frontend/.env.example](../frontend/.env.example)
