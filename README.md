# CUST Sports Week Management System

A full-stack role-based platform for managing university Sports Week operations: faculty access, coordinator assignments, dynamic games, player rosters, Excel imports, sheet submissions, forwarding, and notifications.

## Run locally

```bash
npm install
npm run dev
```

- Web app: `http://localhost:5173`
- API: `http://localhost:4000`

For a production-style local run:

```bash
npm run build
npm start
```

Then open `http://localhost:4000`.

## Demo accounts

All seeded accounts use password `Password123!`.

| Role | Email |
| --- | --- |
| Super Admin | admin@cust.edu.pk |
| HOD | hod@cust.edu.pk |
| Support Coordinator | ali.raza@cust.edu.pk |
| Teacher | shayan.ahmed@cust.edu.pk |

## Architecture

- React 19 + Vite responsive frontend
- Express 5 REST API
- Node.js built-in SQLite with relational constraints and WAL mode
- JWT authentication and bcrypt password hashing
- Role-based and assignment-based authorization
- Excel/CSV player import with `xlsx`
- 19 default sports, with dynamic game management

The database is created automatically at `data/sports-week.db` on first run. Set `JWT_SECRET` and `PORT` using the values documented in `.env.example` for deployment.

## Excel columns

Imports recognize: `Student Name`, `Registration Number`, `Department`, `Semester`, `Section`, `Contact Number`, and `Remarks`.
