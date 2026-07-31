import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentCard } from '../../src/components/v2/AgentCard';
import type { AgentEvent } from '../../src/types/session';

describe('AgentCard', () => {
  it('renders loading state with role', () => {
    const event: AgentEvent = { agent: 'burns', name: 'Д-р Бёрнс', status: 'loading' };
    const html = renderToStaticMarkup(<AgentCard event={event} />);
    expect(html).toContain('Д-р Бёрнс');
    expect(html).toContain('agent-loading');
    expect(html).toContain('искажения и перефраз');
  });

  it('shows reframing and collapsed details by default', () => {
    const event: AgentEvent = {
      agent: 'burns',
      name: 'Д-р Бёрнс',
      status: 'ok',
      payload: {
        distortions: [{ type: 'Чтение мыслей', thought: 'все думают', why: 'не знаешь' }],
        reframing: 'Факт: опоздание на 5 минут.',
        question: 'Что бы сказал другу?',
      },
    };
    const html = renderToStaticMarkup(<AgentCard event={event} />);
    expect(html).toContain('agent-burns-reframing');
    expect(html).toContain('Факт: опоздание на 5 минут.');
    expect(html).toContain('agent-burns-more');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('agent-burns-details');
    expect(html).not.toContain('Чтение мыслей');
  });

  it('renders stoic role and text payload', () => {
    const event: AgentEvent = {
      agent: 'stoic',
      name: 'Стоик',
      status: 'ok',
      payload: { text: 'Вне контроля — мнение других.' },
    };
    const html = renderToStaticMarkup(<AgentCard event={event} />);
    expect(html).toContain('agent-text-payload');
    expect(html).toContain('что в контроле / что отпустить');
  });

  it('renders error state', () => {
    const event: AgentEvent = {
      agent: 'stoic',
      name: 'Стоик',
      status: 'error',
      error: 'LLM API error',
    };
    const html = renderToStaticMarkup(<AgentCard event={event} />);
    expect(html).toContain('agent-error');
    expect(html).toContain('LLM API error');
  });
});
