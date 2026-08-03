import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ResponseView } from '../../src/components/ResponseView';
import type { ReframeResponse } from '../../src/types/session';

function render(data: ReframeResponse) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ResponseView data={data} loading={false} />
    </MemoryRouter>,
  );
}

describe('ResponseView', () => {
  const base: ReframeResponse = {
    distortions: [{ type: 'Чтение мыслей', thought: 'все думают', why: 'не знаешь' }],
    reframing: 'Опоздание — факт.',
    question: 'Что скажешь другу?',
    action: 'Спроси одного коллегу, заметил ли он опоздание.',
    pattern: 'Поспешные выводы',
  };

  it('shows action as hero before reframing and distortions', () => {
    const html = render(base);
    const actionIdx = html.indexOf('response-action');
    const reframingIdx = html.indexOf('Опоздание — факт.');
    const distortionsIdx = html.indexOf('КОГНИТИВНЫЕ ИСКАЖЕНИЯ');
    expect(actionIdx).toBeGreaterThan(-1);
    expect(html).toContain('Что сделать сегодня');
    expect(html).toContain(base.action!);
    expect(actionIdx).toBeLessThan(reframingIdx);
    expect(reframingIdx).toBeLessThan(distortionsIdx);
  });

  it('works without action for older responses', () => {
    const legacy: ReframeResponse = {
      distortions: base.distortions,
      reframing: base.reframing,
      question: base.question,
      pattern: base.pattern,
    };
    const html = render(legacy);
    expect(html).not.toContain('response-action');
    expect(html).toContain('Опоздание — факт.');
    expect(html).toContain('КОГНИТИВНЫЕ ИСКАЖЕНИЯ');
  });
});
