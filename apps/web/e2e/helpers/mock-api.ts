import type { Page } from '@playwright/test';

const WORKSPACE_ID = 'default-workspace';

const MOCK_PROJECT = { id: 'proj-e2e', name: 'Research', slug: 'research' };
const MOCK_FOLDER = { id: 'folder-e2e', name: 'Notes', slug: 'notes' };

type MockSource = {
  id: string;
  name: string;
  project: string;
  folder: string;
  size: number;
  updatedAt: string | null;
};

type MockApiState = {
  sources: MockSource[];
  sessionId: string | null;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ id: string; title: string; snippet: string; sourceType: string }>;
  }>;
};

export async function installWorkspaceMocks(page: Page): Promise<void> {
  const state: MockApiState = {
    sources: [],
    sessionId: null,
    messages: [],
  };

  await page.route(/\/api\/v1\/workspaces\/default-workspace\/projects$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: [MOCK_PROJECT] } });
      return;
    }
    await route.continue();
  });

  await page.route(
    /\/api\/v1\/workspaces\/default-workspace\/projects\/[^/]+\/folders/,
    async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: { data: [MOCK_FOLDER] } });
        return;
      }
      await route.continue();
    },
  );

  await page.route(/\/api\/v1\/workspaces\/default-workspace\/sources/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: state.sources } });
      return;
    }

    if (route.request().method() === 'POST') {
      const file = route.request().postDataBuffer();
      const fileName = file ? 'e2e-upload.txt' : 'upload.txt';
      const uploaded: MockSource = {
        id: `src-${Date.now()}`,
        name: fileName,
        project: MOCK_PROJECT.slug,
        folder: MOCK_FOLDER.slug,
        size: file?.byteLength ?? 12,
        updatedAt: new Date().toISOString(),
      };
      state.sources = [uploaded, ...state.sources];
      await route.fulfill({ json: { data: uploaded } });
      return;
    }

    await route.continue();
  });

  await page.route(/\/api\/v1\/workspaces\/default-workspace\/chat\/sessions/, async (route) => {
    const url = route.request().url();
    const isMessagesRoute = url.includes('/messages');

    if (isMessagesRoute) {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            data: state.messages.map((message) => ({
              id: message.id,
              workspaceId: WORKSPACE_ID,
              sessionId: state.sessionId,
              role: message.role,
              content: message.content,
              responseTransport: 'sse',
              model: 'openai:gpt-4o-mini',
              modelProvider: 'openai',
              modelName: 'gpt-4o-mini',
              status: 'completed',
              metadata: {},
              citations: message.citations ?? [],
              createdAt: new Date().toISOString(),
            })),
          },
        });
        return;
      }

      if (route.request().method() === 'POST') {
        let userContent = 'What is object-oriented programming?';
        try {
          const body = route.request().postDataJSON() as { content?: string };
          if (body.content?.trim()) {
            userContent = body.content.trim();
          }
        } catch {
          // Playwright may not parse JSON for all requests; keep default prompt.
        }

        const userMessageId = `msg-user-${Date.now()}`;
        const assistantMessageId = `msg-assistant-${Date.now()}`;
        const assistantContent = 'Object-oriented programming uses classes and objects.';
        const citations = [
          {
            id: 'cite-e2e',
            title: 'OOP Lecture Notes.pdf',
            snippet: 'Classes are blueprints for objects.',
            sourceType: 'workspace-source',
          },
        ];

        state.messages = [
          { id: userMessageId, role: 'user', content: userContent },
          { id: assistantMessageId, role: 'assistant', content: assistantContent, citations },
        ];

        const sseBody = [
          'id: 1\nevent: start\ndata: {"transport":"sse","version":1,"model":"openai:gpt-4o-mini","memoryContext":[]}\n\n',
          `id: 2\nevent: delta\ndata: {"index":0,"content":"${assistantContent}"}\n\n`,
          'id: 3\nevent: done\ndata: {"totalChunks":1,"citations":[{"id":"cite-e2e","title":"OOP Lecture Notes.pdf","snippet":"Classes are blueprints for objects.","sourceType":"workspace-source"}],"model":"openai:gpt-4o-mini","memoryContext":[]}\n\n',
        ].join('');

        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
          body: sseBody,
        });
        return;
      }
    }

    if (route.request().method() === 'GET') {
      const sessions = state.sessionId
        ? [
            {
              id: state.sessionId,
              workspaceId: WORKSPACE_ID,
              title: 'E2E session',
              contextMode: 'workspace',
              modelProvider: 'openai',
              modelName: 'gpt-4o-mini',
              lastMessageAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : [];
      await route.fulfill({ json: { data: sessions } });
      return;
    }

    if (route.request().method() === 'POST') {
      state.sessionId = `session-${Date.now()}`;
      await route.fulfill({
        json: {
          data: {
            id: state.sessionId,
            workspaceId: WORKSPACE_ID,
            title: 'E2E session',
            contextMode: 'workspace',
            modelProvider: null,
            modelName: null,
            lastMessageAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });
      return;
    }

    await route.continue();
  });
}

export async function installBillingMocks(page: Page): Promise<void> {
  await page.route(/\/api\/v1\/billing\/subscription/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          workspaceId: WORKSPACE_ID,
          planCode: 'free',
          status: 'active',
          provider: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      }),
    });
  });

  await page.route(/\/api\/v1\/billing\/checkout/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          status: 'pending_provider',
          planCode: 'pro_monthly',
          checkoutUrl: null,
          provider: 'stripe',
          message: 'Stripe checkout is pending in staging.',
        },
      }),
    });
  });
}
