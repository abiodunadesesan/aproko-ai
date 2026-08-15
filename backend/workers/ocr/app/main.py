from __future__ import annotations

import io
import os
import tempfile
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title='Aproko OCR Worker', version='0.1.0')


class ExtractRequest(BaseModel):
    file_url: str = Field(alias='fileUrl')
    mime_type: str | None = Field(default=None, alias='mimeType')


class ExtractResponse(BaseModel):
    text: str


def _require_auth(authorization: str | None) -> None:
    secret = os.getenv('OCR_WORKER_SECRET', '').strip()
    if not secret:
        return

    expected = f'Bearer {secret}'
    if authorization != expected:
        raise HTTPException(status_code=401, detail='Unauthorized')


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        from paddleocr import PaddleOCR
    except ImportError as error:
        raise HTTPException(
            status_code=503,
            detail='PaddleOCR is not installed in this worker image.',
        ) from error

    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        temp_file.write(pdf_bytes)
        temp_path = temp_file.name

    try:
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        result = ocr.ocr(temp_path, cls=True)
    finally:
        os.unlink(temp_path)

    lines: list[str] = []
    for page in result or []:
        for line in page or []:
            text = line[1][0] if line and len(line) > 1 else None
            if isinstance(text, str) and text.strip():
                lines.append(text.strip())

    return ' '.join(lines).strip()


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/extract', response_model=ExtractResponse)
async def extract(
    payload: ExtractRequest,
    authorization: str | None = Header(default=None),
) -> ExtractResponse:
    _require_auth(authorization)

    async with httpx.AsyncClient(timeout=120.0) as client:
        download = await client.get(payload.file_url)
        if download.status_code >= 400:
            raise HTTPException(status_code=502, detail='Unable to download source file for OCR.')
        pdf_bytes = download.content

    text = _extract_pdf_text(pdf_bytes)
    if not text:
        raise HTTPException(status_code=422, detail='OCR returned empty text.')

    return ExtractResponse(text=text)
