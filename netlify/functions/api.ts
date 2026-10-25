import { handleApi, type ApiEnv } from '../../src/server/api.ts';

const env = (): ApiEnv => ({
  SESSION_SECRET: process.env.SESSION_SECRET ?? '',
  STAFF_PIN: process.env.STAFF_PIN ?? '',
  OWNER_PIN: process.env.OWNER_PIN ?? '',
  BASE44_WRITE_API: process.env.BASE44_WRITE_API ?? '',
  BASE44_WRITE_TOKEN: process.env.BASE44_WRITE_TOKEN ?? '',
  GITHUB_REPO: process.env.GITHUB_REPO ?? 'JULIANJUAREZMX01/cantabria-pms-demo',
  GITHUB_READ_TOKEN: process.env.GITHUB_READ_TOKEN ?? '',
  DATA_PATH: process.env.DATA_PATH ?? 'data.js',
});

export default async (req: Request): Promise<Response> => handleApi(req, env());
export const config = { path: ['/api/login', '/api/event', '/api/snapshot'] };
