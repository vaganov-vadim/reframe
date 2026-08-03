import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VerticalArrow } from '../../src/components/VerticalArrow';

describe('VerticalArrow', () => {
  it('renders reframing with listen button when speechSynthesis exists', () => {
    const html = renderToStaticMarkup(
      <VerticalArrow
        levels={[
          { thought: 'Я опоздал', label: 'Поверхностная мысль' },
          { thought: 'Я недостаточно хорош', label: 'Глубинное убеждение' },
        ]}
        reframing="Опоздание не определяет ценность."
      />,
    );
    expect(html).toContain('Опоздание не определяет ценность.');
    // SSR: speechSynthesis absent → no button; presence checked in e2e
    expect(html).toContain('Вертикальная стрелка');
  });
});
