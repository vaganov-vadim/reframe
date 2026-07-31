import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <main
      data-testid="privacy-page"
      style={{ padding: 'var(--space-lg) var(--space-md) 80px', maxWidth: 480, margin: '0 auto' }}
    >
      <h1
        style={{
          margin: '0 0 var(--space-md)',
          fontSize: 'var(--font-size-heading)',
          color: 'var(--text-primary)',
        }}
      >
        Приватность
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
        Коротко и честно — без «всё только у вас на телефоне» в абсолюте.
      </p>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: 16, color: 'var(--accent)', margin: '0 0 var(--space-sm)' }}>
          На устройстве
        </h2>
        <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          История сессий, оценки тревоги, настройки темы — в localStorage браузера. Мы не забираем
          эту базу к себе.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: 16, color: 'var(--accent)', margin: '0 0 var(--space-sm)' }}>
          Наш сервер
        </h2>
        <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          Бэкенд — тонкий прокси: принять запрос, собрать промпт, вернуть ответ. Без базы данных и
          без логирования текстов записей.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: 16, color: 'var(--accent)', margin: '0 0 var(--space-sm)' }}>
          LLM-провайдер
        </h2>
        <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          Чтобы сделать рефрейминг, текст ситуации уходит к внешнему LLM (сейчас DeepSeek) на время
          запроса. Мы не контролируем их политику хранения, обучения моделей или субпроцессоров.
          Это ограничение облачного ИИ — не обещаем «провайдер ничего не увидит».
        </p>
      </section>

      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, marginBottom: 'var(--space-lg)' }}>
        Studio и дневник используют один и тот же прокси. Локальная история Studio в v2 не пишется —
        это отдельное решение продукта, не усиление приватности у провайдера.
      </p>

      <Link
        to="/"
        data-testid="privacy-back"
        style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
      >
        ← К дневнику
      </Link>
    </main>
  );
}
