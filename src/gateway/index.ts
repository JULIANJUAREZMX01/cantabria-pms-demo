import { HOTEL } from '@/lib/config.ts';
import { todayIn } from '@/lib/dates.ts';
import { LegacyGateway } from './legacy.ts';
import { MockGateway } from './mock.ts';
import { ProxyGateway } from './proxy.ts';
import type { Gateway, KeyValueStore } from './types.ts';

const browserKV = (): KeyValueStore => ({
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue en memoria de la sesión */
    }
  },
  remove: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignorar */
    }
  },
});

/** Selecciona el gateway según PUBLIC_GATEWAY_MODE (demo por defecto). */
export function createGateway(): Gateway {
  const env = import.meta.env;
  if (env.PUBLIC_GATEWAY_MODE === 'proxy') {
    return new ProxyGateway({ apiBase: env.BASE_URL.endsWith('/') ? env.BASE_URL : `${env.BASE_URL}/` });
  }
  if (env.PUBLIC_GATEWAY_MODE === 'legacy') {
    return new LegacyGateway({
      writeApi: env.PUBLIC_WRITE_API ?? '',
      token: env.PUBLIC_WRITE_TOKEN ?? '',
      staffPin: env.PUBLIC_STAFF_PIN ?? '',
      ownerPin: env.PUBLIC_OWNER_PIN ?? '',
      baseUrl: env.BASE_URL.endsWith('/') ? env.BASE_URL : `${env.BASE_URL}/`,
    });
  }
  return new MockGateway(browserKV(), () => todayIn(HOTEL.timeZone), env.PUBLIC_DEMO_PIN ?? '0000');
}
