const metrics = require('./metrics')

function plugin(options) {
  var plugin = {
    register: server => {
      const routeOpts = options.route || {}

      const opts = {
        method: 'GET',
        path: options.url,
        handler: (req, h) => {
          return h.response(metrics.summary()).type('text/plain')
        }
      }
      Object.assign(opts, routeOpts)
      server.route(opts)

      server.ext('onRequest', (request, h) => {
        request.epimetheus = {
          start: process.hrtime()
        }
        return h.continue
      })

      server.events.on('response', request => {
        metrics.observe(
          request.method,
          request.route.path,
          request.response.statusCode,
          request.epimetheus.start
        )
      })
    },

    name: 'epimetheus',
    version: '1.0.0'
  }

  return plugin
}

function instrument(server, options) {
  server.register(plugin(options))
}

function instrumentable(server) {
  return server && !server.use && server.register
}

module.exports = {
  instrumentable: instrumentable,
  instrument: instrument
}
