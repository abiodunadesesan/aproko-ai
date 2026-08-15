import { Environment, Paddle } from '@paddle/paddle-node-sdk';

let paddleClient: Paddle | null = null;

export function getPaddleClient(apiKey?: string): Paddle {
  const secretKey = apiKey ?? process.env.PADDLE_API_KEY?.trim();
  if (!secretKey) {
    throw new Error('PADDLE_API_KEY is not configured');
  }

  if (!paddleClient) {
    const environmentName = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
    paddleClient = new Paddle(secretKey, {
      environment:
        environmentName === 'production' ? Environment.production : Environment.sandbox,
    });
  }

  return paddleClient;
}

export function resetPaddleClientForTests(): void {
  paddleClient = null;
}
