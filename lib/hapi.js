const metrics = require('./metrics')

function plugin(options) {
  var plugin = {
    register: server => {
      const opts = {
        method: 'GET',
        handler: (req, h) => {
          return h.response(metrics.summary()).type('text/plain')
        }
      }
      Object.assign(opts, options)
      server.route(opts)

      server.ext('onRequest', (request, h) => {
        request.epimetheus = {
          start: process.hrtime()
        }
        return h.continue
      })

      server.on('response', response => {
        metrics.observe(
          response.method,
          response.path,
          response.response.statusCode,
          response.epimetheus.start
        )
      })
    },

    name: 'epimetheus',
    version: '1.0.0'
  }

  return plugin
}

function instrument(server, options) {
  server.register({ plugin, options })
}

function instrumentable(server) {
  return server && !server.use && server.register
}

module.exports = {
  instrumentable: instrumentable,
  instrument: instrument
}
