export const defaultSchema= {
  app: {
    id: {
      default: 'monorepo-starter',
      env: 'APP_ID',
    },
    name: {
      default: 'Monorepo Starter Platform',
      env: 'APP_NAME',
    },
    shorthand: {
      default: 'platform',
      env: 'APP_SHORTHAND',
    },
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'acceptation', 'staging', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  debug: {
    doc: 'Debug mode',
    default: false,
    env: 'DEBUG',
  },
  port: {
    doc: 'The port the application runs on',
    default: 80,
    env: 'PORT',
  },
  cors: {
    origin: {
      default: 'http://localhost',
      env: 'CORS_ORIGIN',
    },
    credentials: {
      default: true,
      env: 'CORS_CREDENTIALS',
    },
    exposed_headers: {
      default: ['x-total'],
      env: 'CORS_EXPOSED_HEADERS',
    },
  },
  log: {
    level: {
      default: '',
      env: 'LOG_LEVEL',
    },
    force: {
      default: '',
      env: 'LOG_FORCE',
    },
  },
  graphql: {
    playground: {
      default: false,
      env: 'GRAPHQL_PLAYGROUND',
    },
  },
  rollbar: {
    accessToken: {
      default: '',
      env: 'ROLLBAR_ACCESS_TOKEN',
    },
    environment: {
      default: '',
      env: 'ROLLBAR_ENVIRONMENT',
    },
    level: {
      default: '',
      env: 'ROLLBAR_LEVEL',
    },
  },
  mongodb: {
    main: {
      url: {
        doc: 'MongoDB connection url',
        default: 'mongodb://127.0.0.1:27017/monorepo-starter',
        env: 'MONGODB_MAIN_URL',
      },
    },
  },
  jwt: {
    secret: {
      doc: 'Private secret to create jwt tokens',
      default: '',
      env: 'JWT_SECRET'
    }
  },
};

export type DefaultSchema = typeof defaultSchema;
