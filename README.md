> 🚧 **Work in progress.** University team project (Maynooth University), still under development. Some features are incomplete.
> **Working:** registration, login, JWT auth, role-based access, Docker + PostgreSQL setup.
> **In progress:** leaderboard and other features.

# CS353 - Team Project: UniQuest

```
frontend/   static HTML/CSS/JS pages (login, register)
backend/    Node + Express + TypeScript API (Prisma/PostgreSQL, JWT auth)
```

The backend also serves `frontend/`, so the pages and the API share one origin.

## Run
```bash
cd backend
cp .env.example .env      # set JWT_SECRET (openssl rand -hex 32)
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run dev               # http://localhost:3000
```

See `backend/README.md` for the API.
