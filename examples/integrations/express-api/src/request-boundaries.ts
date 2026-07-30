import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export interface ExpressAppOptions {
  corsOrigin?: string;
  jsonLimit?: string;
  urlEncodedLimit?: string;
}

const defaultCorsOrigin = 'http://localhost:3000';
const defaultBodyLimit = '100kb';

export function configureRequestBoundaries(app: Express, options: ExpressAppOptions = {}) {
  const corsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || defaultCorsOrigin;
  const jsonLimit = options.jsonLimit || process.env.JSON_BODY_LIMIT || defaultBodyLimit;
  const urlEncodedLimit =
    options.urlEncodedLimit || process.env.URLENCODED_BODY_LIMIT || defaultBodyLimit;

  app.use(helmet());
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (corsOrigin === '*') {
          return callback(null, '*');
        }

        return callback(null, requestOrigin === corsOrigin ? corsOrigin : false);
      },
      credentials: corsOrigin !== '*',
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  app.use(express.json({ limit: jsonLimit }));
  app.use(express.urlencoded({ extended: true, limit: urlEncodedLimit }));
}

export function addRequestErrorHandler(app: Express) {
  app.use(
    (
      err: Error & { type?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Error:', err);

      const status = err.type === 'entity.too.large' ? 413 : 500;
      res.status(status).json({
        error: status === 413 ? 'Payload Too Large' : 'Internal Server Error',
        message:
          status === 413
            ? 'Request body exceeds the configured limit.'
            : process.env.NODE_ENV === 'development'
              ? err.message
              : 'An error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    }
  );
}
