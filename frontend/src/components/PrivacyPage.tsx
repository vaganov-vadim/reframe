import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAllDeviceData } from '../services/storageService';

export function PrivacyPage() {
  const navigate = useNavigate();
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleWipe = () => {
    clearAllDeviceData();
    setConfirmWipe(false);
    navigate('/', { replace: true });
  };

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

      <section
        data-testid="privacy-wipe"
        style={{
          marginBottom: 'var(--space-xl)',
          padding: 'var(--space-md)',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}
      >
        <h2 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 var(--space-sm)' }}>
          Данные на этом устройстве
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 14,
            lineHeight: 1.5,
            margin: '0 0 var(--space-md)',
          }}
        >
          История и настройки лежат только здесь. Можно стереть их с устройства — без выгрузки на
          сервер (нам нечего «отдавать»).
        </p>
        {!confirmWipe ? (
          <button
            type="button"
            data-testid="privacy-wipe-start"
            onClick={() => setConfirmWipe(true)}
            style={{
              width: '100%',
              minHeight: 48,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Очистить всё на устройстве
          </button>
        ) : (
          <div data-testid="privacy-wipe-confirm">
            <p
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: 'var(--text-secondary)',
                margin: '0 0 var(--space-md)',
                lineHeight: 1.5,
              }}
            >
              Удалить историю, настройки и напоминания с этого устройства? Отменить нельзя.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                data-testid="privacy-wipe-confirm-yes"
                onClick={handleWipe}
                style={{
                  flex: 1,
                  minHeight: 48,
                  background: 'transparent',
                  color: 'var(--error)',
                  border: '1px solid var(--error)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Очистить
              </button>
              <button
                type="button"
                data-testid="privacy-wipe-cancel"
                onClick={() => setConfirmWipe(false)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Оставить
              </button>
            </div>
          </div>
        )}
      </section>

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
