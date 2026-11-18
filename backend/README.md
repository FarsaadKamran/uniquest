# UniQuest backend

Node.js + Express + TypeScript, Prisma/PostgreSQL, JWT auth, bcrypt, Zod validation.
Tests: Jest + Supertest (in-memory repo, no DB needed).

## Run locally
```bash
cp .env.example .env            # set JWT_SECRET
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run dev
```

## Tests
```bash
npm test
npm run test:cov
```

## API
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/register | - | `accountType` STUDENT / LECTURER / COMMITTEE_MEMBER, `fullName`, `email`, `displayName`, `password` |
| POST | /api/auth/login | - | `email`, `password` -> `{ user, token }` |
| GET | /api/auth/me | Bearer | current user |
| GET | /api/users | Bearer, ADMIN | list registered users |

Students/committee members need `@mumail.ie`, lecturers `@mu.ie`. Admins are seeded, not self-registered.
Errors: `{ "error": { "code", "message", "details?" } }`.
