# SkillForge 🎓

Plataforma SaaS de gestión del aprendizaje técnico para equipos.

## Stack

| Capa       | Tecnología                           |
| ---------- | ------------------------------------ |
| Frontend   | Next.js 15, TypeScript, TailwindCSS  |
| Estado     | Zustand + TanStack Query             |
| Backend    | FastAPI, Python 3.12, SQLAlchemy 2.0 |
| Base datos | MySQL 8.x + Alembic                  |
| Auth       | JWT (Access + Refresh Tokens)        |

## Requisitos

- Node.js 20+, pnpm 9+
- Python 3.12+
- MySQL 8.x

## Arranque rápido

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # configura tus variables
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
pnpm install
cp .env.local.example .env.local
pnpm dev
```

## Estructura

```
skillforge/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # Routers (Controllers)
│   │   ├── core/          # Config, Security, Dependencies
│   │   ├── db/            # Engine, Session, Base
│   │   ├── models/        # SQLAlchemy ORM
│   │   ├── repositories/  # Acceso a datos
│   │   ├── schemas/       # Pydantic I/O
│   │   └── services/      # Lógica de negocio
│   └── alembic/           # Migraciones
└── frontend/
    └── src/
        ├── app/           # Next.js App Router
        ├── components/    # UI components
        ├── hooks/         # Custom hooks
        ├── lib/           # API client, validators
        ├── store/         # Zustand stores
        └── types/         # TypeScript types
```

## Variables de entorno

Ver `backend/.env.example` y `frontend/.env.local.example`
