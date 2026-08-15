# PaddleOCR worker (Sprint 24 A.2)

Python FastAPI service for scanned PDF text extraction.

## Endpoints

- `GET /health` — liveness probe
- `POST /extract` — `{ "fileUrl": "<signed-url>" }` → `{ "text": "..." }`

Optional auth: set `OCR_WORKER_SECRET` and send `Authorization: Bearer <secret>`.

## Local run

```bash
cd backend/workers/ocr
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

## Railway / Docker

Build from `backend/workers/ocr/Dockerfile` and set:

- `OCR_WORKER_SECRET` (must match web `OCR_WORKER_SECRET`)
- `PORT=8080`

Point the web app at the worker with:

- `OCR_WORKER_URL=https://<worker-host>`

Optional cron drain for queued jobs:

- `INGEST_WORKER_SECRET`
- `POST /api/v1/internal/ingest/process-ocr?limit=3` with `Authorization: Bearer <INGEST_WORKER_SECRET>`
