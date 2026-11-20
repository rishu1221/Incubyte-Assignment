# ACME salary ledger

HR portal for ACME's gross annual salaries. One shared login is not required yet: the app is the ledger an HR manager uses instead of the spreadsheet.

The history of this repo follows the build:

1. Product scope and plan
2. Express API scaffold
3. PostgreSQL model and exact money handling
4. Employee directory and salary revisions
5. Dashboard aggregates
6. Seed data
7. React portal

## Run it

PostgreSQL must be listening on port 5432. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` to your role and password.

```powershell
cd backend
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

The API listens on http://localhost:4000. The portal listens on http://localhost:5173.
