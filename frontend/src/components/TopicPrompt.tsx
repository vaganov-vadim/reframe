import { useState } from 'react';

const TOPICS = [
  { text: 'Что тревожит прямо сейчас?', category: 'общее' },
  { text: 'Расскажите о ситуации на работе', category: 'работа' },
  { text: 'Что произошло сегодня?', category: 'общее' },
  { text: 'Опишите недавний конфликт', category: 'отношения' },
  { text: 'Что не даёт уснуть?', category: 'здоровье' },
  { text: 'Какая мысль крутится в голове?', category: 'общее' },
  { text: 'Расскажите о разговоре, который вас задел', category: 'отношения' },
  { text: 'Что вы думаете о своём будущем?', category: 'будущее' },
  { text: 'Опишите ситуацию, где вы чувствуете себя неуверенно', category: 'самооценка' },
  { text: 'Что сегодня пошло не так?', category: 'работа' },
  { text: 'Расскажите о своём самочувствии', category: 'здоровье' },
  { text: 'Какое решение вас мучает?', category: 'работа' },
];

export function TopicPrompt() {
  const [topic] = useState(() => TOPICS[Math.floor(Math.random() * TOPICS.length)]);

  return (
    <div style={{ textAlign: 'center' as const, padding: '0 var(--space-md) var(--space-md)', maxWidth: '280px', margin: '0 auto' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-xs) 0' }}>
        О чём сегодня?
      </p>
      <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
        «{topic.text}»
      </p>
    </div>
  );
}
