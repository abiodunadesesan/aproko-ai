export type LiveContextSseEventName = 'start' | 'delta' | 'done' | 'error';

export type LiveContextSseEvent = {
  event: LiveContextSseEventName;
  payload: {
    content?: string;
    message?: string;
    error?: string;
    model?: string;
  };
};

export function parseLiveContextSseEventsFromBuffer(buffer: string): {
  events: LiveContextSseEvent[];
  rest: string;
} {
  const frames = buffer.split('\n\n');
  const rest = frames.pop() ?? '';
  const events: LiveContextSseEvent[] = [];

  for (const frame of frames) {
    const lines = frame.split('\n');
    const eventLine = lines.find((line) => line.startsWith('event:'));
    const dataLine = lines.find((line) => line.startsWith('data:'));

    if (!eventLine || !dataLine) {
      continue;
    }

    const event = eventLine.replace('event:', '').trim() as LiveContextSseEventName;
    if (!['start', 'delta', 'done', 'error'].includes(event)) {
      continue;
    }

    try {
      const payload = JSON.parse(dataLine.replace('data:', '').trim()) as LiveContextSseEvent['payload'];
      events.push({ event, payload });
    } catch {
      // ignore malformed frame
    }
  }

  return { events, rest };
}

export function readLiveContextSseDelta(payload: LiveContextSseEvent['payload']): string {
  return payload.content?.trim() ? payload.content : '';
}

export function readLiveContextSseError(payload: LiveContextSseEvent['payload']): string {
  return payload.message?.trim() || payload.error?.trim() || 'Stream error';
}
