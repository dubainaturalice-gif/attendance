# Attendance Manager

Staff attendance management system with daily and monthly tracking, PDF export, and employee management.

## Features

- **Daily Attendance**: Mark employees as Present (P), Overtime (OT), Off (O), Leave (L), or Vacation (V)
- **Monthly Summary**: Calendar grid view with attendance statistics
- **PDF Export**: Generate professional daily and monthly attendance reports
- **Employee Management**: Add, search, and remove employees
- **Multi-status Support**: P and OT can be combined (P,OT)
- **Group Filtering**: Filter by OFFICE/ADMIN, DRIVERS, SALESMAN, FACTORY/PRODUCTION

## Deploy to Vercel

### 1. Push to GitHub
- Create a new GitHub repository
- Push this code to it:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Deploy on Vercel
- Go to [vercel.com](https://vercel.com) and import the GitHub repo
- In project settings, add Vercel Postgres:
  - Go to **Storage** tab → **Create Database** → **Postgres**
  - This auto-configures all `POSTGRES_*` environment variables

### 3. Initialize Database
After deployment, you have two options:
- **Option A**: Visit your app and click the "Setup Database" button on the login screen
- **Option B**: Send a POST request to `https://your-app.vercel.app/api/setup`

This creates the tables and seeds 117 employees.

### 4. Login
- **Username**: `admin`
- **Password**: `admin123`

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in PostgreSQL connection details:
```bash
cp .env.example .env.local
```

3. Start development server:
```bash
npm run dev
```

4. Visit [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via @vercel/postgres
- **Styling**: Tailwind CSS
- **PDF Generation**: pdfmake (client-side)
- **Language**: TypeScript

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/setup` | Initialize database with tables and seed data |
| POST | `/api/auth` | Login with username/password |
| GET | `/api/employees` | List all active employees |
| POST | `/api/employees` | Add new employee |
| DELETE | `/api/employees?id=N` | Soft-delete employee |
| GET | `/api/attendance?date=YYYY-MM-DD` | Get daily attendance |
| GET | `/api/attendance?month=YYYY-MM` | Get monthly attendance |
| POST | `/api/attendance` | Save attendance records |
