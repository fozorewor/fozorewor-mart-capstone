'use strict'

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'fozorewor-mart-backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  distributed_tracing: {
    enabled: true,
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
    },
  },
}
