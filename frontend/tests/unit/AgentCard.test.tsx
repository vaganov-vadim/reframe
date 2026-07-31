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
    expect(html).toContain('Смотрю');
    expect(html).toContain('искажения и перефраз');
  });

  it('renders structured Burns payload with reframing first, then distortions, then question', () => {
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
    expect(html).toContain('agent-burns-payload');
    expect(html).toContain('agent-burns-reframing');
    expect(html).toContain('agent-burns-distortions');
    expect(html).toContain('agent-burns-question');
    expect(html).toContain('Факт: опоздание на 5 минут.');
    expect(html).toContain('Чтение мыслей');
    expect(html).toContain('Что бы сказал другу?');
    const reframingIdx = html.indexOf('agent-burns-reframing');
    const distortionsIdx = html.indexOf('agent-burns-distortions');
    const questionIdx = html.indexOf('agent-burns-question');
    expect(reframingIdx).toBeLessThan(distortionsIdx);
    expect(distortionsIdx).toBeLessThan(questionIdx);
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
    expect(html).toContain('Вне контроля — мнение других.');
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
