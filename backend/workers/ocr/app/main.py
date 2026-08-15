from __future__ import annotations

import os
import tempfile
from urllib.parse import urlparse

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


def _suffix_for_source(mime_type: str | None, file_url: str) -> str:
    normalized = (mime_type or '').lower().strip()
    if 'pdf' in normalized:
        return '.pdf'
    if 'png' in normalized:
        return '.png'
    if 'jpeg' in normalized or 'jpg' in normalized:
        return '.jpg'
    if 'webp' in normalized:
        return '.webp'
    if 'gif' in normalized:
        return '.gif'
    if 'tiff' in normalized or 'tif' in normalized:
        return '.tiff'
    if 'bmp' in normalized:
        return '.bmp'

    path = urlparse(file_url).path.lower()
    for ext in ('.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.tif', '.tiff', '.bmp'):
        if path.endswith(ext):
            return '.jpg' if ext == '.jpeg' else ext

    return '.pdf'


def _extract_ocr_text(file_bytes: bytes, suffix: str) -> str:
    try:
        from paddleocr import PaddleOCR
    except ImportError as error:
        raise HTTPException(
            status_code=503,
            detail='PaddleOCR is not installed in this worker image.',
        ) from error

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
        temp_file.write(file_bytes)
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
        file_bytes = download.content

    suffix = _suffix_for_source(payload.mime_type, payload.file_url)
    text = _extract_ocr_text(file_bytes, suffix)
    if not text:
        raise HTTPException(status_code=422, detail='OCR returned empty text.')

    return ExtractResponse(text=text)
