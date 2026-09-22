import express, { type RequestHandler } from 'express';

// Express 4 does not forward rejected async route promises automatically.
export function asyncRouter() {
  const router = express.Router();
  for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
    const register = router[method].bind(router);
    router[method] = ((path: string, ...handlers: RequestHandler[]) =>
      register(
        path,
        ...handlers.map((handler) => (req, res, next) => {
          try {
            Promise.resolve(handler(req, res, next)).catch(next);
          } catch (error) {
            next(error);
          }
        }),
      )) as (typeof router)[typeof method];
  }
  return router;
}
