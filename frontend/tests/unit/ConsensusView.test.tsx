import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsensusView } from '../../src/components/v2/ConsensusView';

describe('ConsensusView', () => {
  it('renders hero title Что унести with text (typewriter off for SSR)', () => {
    const html = renderToStaticMarkup(
      <ConsensusView text="Проблема в интерпретации." typewriter={false} />,
    );
    expect(html).toContain('consensus-view');
    expect(html).toContain('Что унести');
    expect(html).toContain('Проблема в интерпретации.');
    expect(html).toContain('consensus-text');
  });

  it('renders skeleton loading instead of Собираю вывод', () => {
    const html = renderToStaticMarkup(<ConsensusView text={null} loading />);
    expect(html).toContain('Что унести');
    expect(html).toContain('consensus-loading');
    expect(html).toContain('studio-skeleton');
    expect(html).not.toContain('Собираю вывод');
  });

  it('renders nothing when idle without text', () => {
    const html = renderToStaticMarkup(<ConsensusView text={null} loading={false} />);
    expect(html).toBe('');
  });
});
