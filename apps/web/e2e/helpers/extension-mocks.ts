import type { Page } from '@playwright/test';

const WORKSPACE_ID = 'ws_e2e_user';

export async function installExtensionLiveMocks(page: Page): Promise<void> {
  await page.route(/\/api\/v1\/workspaces\/current\/?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          data: {
            workspaceId: WORKSPACE_ID,
            name: 'Personal',
            slug: WORKSPACE_ID,
            role: 'owner',
          },
        },
      });
      return;
    }
    await route.continue();
  });

  await page.route(
    new RegExp(`/api/v1/workspaces/${WORKSPACE_ID}/live-context/chat$`),
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      let userQuery = 'Summarize this page';
      try {
        const body = route.request().postDataJSON() as { userQuery?: string };
        if (body.userQuery?.trim()) {
          userQuery = body.userQuery.trim();
        }
      } catch {
        // keep default
      }

      const assistantContent = `Live context answer for: ${userQuery}`;
      const sseBody = [
        'id: 1\nevent: start\ndata: {"transport":"sse","version":1,"model":"groq:openai/gpt-oss-20b"}\n\n',
        `id: 2\nevent: delta\ndata: {"index":0,"content":"${assistantContent}"}\n\n`,
        'id: 3\nevent: done\ndata: {"totalChunks":1,"model":"groq:openai/gpt-oss-20b"}\n\n',
      ].join('');

      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sseBody,
      });
    },
  );
}

export async function postMockLiveContext(page: Page): Promise<void> {
  await page.getByRole('heading', { name: 'Ask about this page' }).waitFor({ timeout: 30_000 });
  await page.waitForFunction(() =>
    Boolean(
      (window as Window & { __aprokoLiveContextInject?: unknown }).__aprokoLiveContextInject,
    ),
  );

  await page.evaluate(() => {
    const inject = (
      window as Window & {
        __aprokoLiveContextInject?: (payload: {
          url: string;
          title: string;
          pageText: string;
          activeHoverContext?: string;
          capturedAt: string;
        }) => void;
      }
    ).__aprokoLiveContextInject;

    inject?.({
      url: 'https://example.com/quiz',
      title: 'Example Quiz',
      pageText: 'Question 1: Which characteristic is common to all living organisms?',
      activeHoverContext: 'living organisms',
      capturedAt: new Date().toISOString(),
    });
  });
}
