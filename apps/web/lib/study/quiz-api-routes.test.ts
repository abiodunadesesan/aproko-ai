import assert from 'node:assert/strict';
import test from 'node:test';
import { createQuizzesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/quizzes/route';
import { createQuizByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/route';
import { createQuizGenerateRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/generate/route';
import { createQuizAttemptsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/attempts/route';
import { createQuizAttemptSubmitRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/quizzes/[quizId]/attempts/[attemptId]/submit/route';

test('quizzes GET returns 401 when unauthenticated', async () => {
  const handlers = createQuizzesRouteHandlers({
    auth: async () => ({ userId: null }),
    listQuizzes: async () => [],
    createQuiz: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('quizzes POST creates quiz', async () => {
  const handlers = createQuizzesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listQuizzes: async () => [],
    createQuiz: async () => ({
      id: 'quiz-1',
      workspaceId: 'ws-1',
      title: 'Biology Quiz',
      sourceNoteId: 'note-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Biology Quiz', sourceNoteId: 'note-1' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; title: string } };
  assert.equal(payload.data.id, 'quiz-1');
  assert.equal(payload.data.title, 'Biology Quiz');
});

test('quiz by id GET returns quiz with questions', async () => {
  const handlers = createQuizByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getQuizById: async () => ({
      id: 'quiz-1',
      workspaceId: 'ws-1',
      title: 'Biology Quiz',
      sourceNoteId: 'note-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    listQuizQuestions: async () => [
      {
        id: 'q-1',
        workspaceId: 'ws-1',
        quizId: 'quiz-1',
        prompt: 'Which organelle produces ATP?',
        options: ['Mitochondria', 'Nucleus'],
        correctOptionIndex: 0,
        explanation: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', quizId: 'quiz-1' }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { quiz: { id: string }; questions: Array<{ id: string }> };
  };
  assert.equal(payload.data.quiz.id, 'quiz-1');
  assert.equal(payload.data.questions[0]?.id, 'q-1');
});

test('quiz generate POST creates questions from note', async () => {
  const handlers = createQuizGenerateRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getQuizById: async () => ({
      id: 'quiz-1',
      workspaceId: 'ws-1',
      title: 'Biology Quiz',
      sourceNoteId: 'note-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    getWorkspaceNoteById: async () => ({
      id: 'note-1',
      workspaceId: 'ws-1',
      title: 'Cell Biology',
      content:
        'The cell membrane controls what enters and leaves the cell. Mitochondria produce ATP for energy.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    createQuizQuestion: async (_workspaceId, quizId, prompt, options, correctOptionIndex) => ({
      id: `${quizId}-${prompt.slice(0, 3)}`,
      workspaceId: 'ws-1',
      quizId,
      prompt,
      options,
      correctOptionIndex,
      explanation: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ noteId: 'note-1' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', quizId: 'quiz-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: Array<{ id: string }> };
  assert.ok(payload.data.length > 0);
});

test('quiz attempts POST returns created result', async () => {
  const handlers = createQuizAttemptsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getQuizById: async () => ({
      id: 'quiz-1',
      workspaceId: 'ws-1',
      title: 'Biology Quiz',
      sourceNoteId: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    listQuizAttempts: async () => [],
    createQuizAttempt: async () => ({
      id: 'attempt-1',
      workspaceId: 'ws-1',
      quizId: 'quiz-1',
      score: 3,
      totalQuestions: 5,
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        answers: [{ questionId: 'q-1', selectedOptionIndex: 0 }],
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', quizId: 'quiz-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; score: number } };
  assert.equal(payload.data.id, 'attempt-1');
  assert.equal(payload.data.score, 3);
});

test('quiz attempt submit POST returns submission result', async () => {
  const handlers = createQuizAttemptSubmitRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getQuizById: async () => ({
      id: 'quiz-1',
      workspaceId: 'ws-1',
      title: 'Biology Quiz',
      sourceNoteId: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    createQuizAttempt: async () => ({
      id: 'attempt-2',
      workspaceId: 'ws-1',
      quizId: 'quiz-1',
      score: 4,
      totalQuestions: 5,
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        answers: [{ questionId: 'q-1', selectedOptionIndex: 0 }],
      }),
    }),
    {
      params: Promise.resolve({
        workspaceId: 'ws-1',
        quizId: 'quiz-1',
        attemptId: 'client-attempt-1',
      }),
    },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: { id: string; clientAttemptId: string } };
  assert.equal(payload.data.id, 'attempt-2');
  assert.equal(payload.data.clientAttemptId, 'client-attempt-1');
});
