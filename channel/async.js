var nest = require('depnest')
var ref = require('ssb-ref')

exports.needs = nest({
  'keys.sync.id': 'first',
  'sbot.async.publish': 'first',
  'channel.obs.subscribed': 'first'
})

exports.gives = nest({
  'channel.async': ['subscribe', 'unsubscribe']
})

exports.create = function (api) {
  return nest({
    'channel.async': {subscribe, unsubscribe}
  })

  function subscribe (channel, cb) {
    channel = channel.replace(/^#/, '')
    if (!channel) throw new Error('a channel must be specified')
    api.sbot.async.publish({
      type: 'channel',
      channel: channel,
      subscribed: true
    }, cb)
  }

  function unsubscribe (channel, cb) {
    channel = channel.replace(/^#/, '')
    if (!channel) throw new Error('a channel must be specified')
    api.sbot.async.publish({
      type: 'channel',
      channel: channel,
      subscribed: false
    }, cb)
  }
}
