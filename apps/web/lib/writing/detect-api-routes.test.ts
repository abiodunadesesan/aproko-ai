import assert from 'node:assert/strict';
import test from 'node:test';
import { createWritingDetectRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/writing/detect/route';
import { buildTurnitinUnavailableResult } from '../ai/writing-detector-check';

test('writing detect POST returns 401 when unauthenticated', async () => {
  const handlers = createWritingDetectRouteHandlers({
    auth: async () => ({ userId: null }),
    checkWithGptZero: async () => {
      throw new Error('unused');
    },
    buildTurnitinUnavailableResult,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'Enough characters to pass the minimum length check for detect.',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 401);
});

test('writing detect POST validates empty text', async () => {
  const handlers = createWritingDetectRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    checkWithGptZero: async () => {
      throw new Error('unused');
    },
    buildTurnitinUnavailableResult,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '  ' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
});

test('writing detect POST returns gptzero + turnitin transparency payload', async () => {
  const handlers = createWritingDetectRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    checkWithGptZero: async () => ({
      provider: 'gptzero',
      available: true,
      classification: 'MIXED',
      aiProbability: 0.42,
      averageGeneratedProb: 0.38,
      confidence: 'medium',
      message: 'Transparency check only.',
      flaggedSentences: [{ text: 'Example sentence.', generatedProb: 0.91 }],
      externalCheckUrl: 'https://gptzero.me/',
    }),
    buildTurnitinUnavailableResult,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'Enough characters to pass the minimum length check for detect feature testing.',
        source: 'draft',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: {
      gptzero: { available: boolean; classification: string; aiProbability: number };
      turnitin: { available: boolean; provider: string };
    };
  };
  assert.equal(payload.data.gptzero.available, true);
  assert.equal(payload.data.gptzero.classification, 'MIXED');
  assert.equal(payload.data.gptzero.aiProbability, 0.42);
  assert.equal(payload.data.turnitin.available, false);
  assert.equal(payload.data.turnitin.provider, 'turnitin');
});
