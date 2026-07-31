import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsensusView } from '../../src/components/v2/ConsensusView';

describe('ConsensusView', () => {
  it('renders hero title Что унести with text', () => {
    const html = renderToStaticMarkup(<ConsensusView text="Проблема в интерпретации." />);
    expect(html).toContain('consensus-view');
    expect(html).toContain('Что унести');
    expect(html).toContain('Проблема в интерпретации.');
  });

  it('renders loading state Собираю вывод', () => {
    const html = renderToStaticMarkup(<ConsensusView text={null} loading />);
    expect(html).toContain('Что унести');
    expect(html).toContain('Собираю вывод');
    expect(html).toContain('consensus-loading');
  });

  it('renders nothing when idle without text', () => {
    const html = renderToStaticMarkup(<ConsensusView text={null} loading={false} />);
    expect(html).toBe('');
  });
});
