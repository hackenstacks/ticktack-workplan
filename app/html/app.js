const nest = require('depnest')
const { h, Value, onceTrue } = require('mutant')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.initialize': 'map',
  'app.html.header': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'router.sync.router': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',

  'invite.async.autofollow': 'first',
  'config.sync.load': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.async.get': 'first',
  'sbot.obs.connection': 'first', // TODO rm
})

exports.create = (api) => {
  var view

  return nest({
    'app.html.app': function app () {
      // TODO rm this 

      console.log('onceTrue starting')
      onceTrue(
        api.sbot.obs.connection,
        sbot => sbot.channels.get((err, data) => {
          if (err) throw err

          console.log('CHANNELS!!!', data)
        })
      )

      api.app.sync.initialize()

      view = Value()
      var app = h('App', view)
      api.history.obs.location()(renderLocation)

      startApp()

      return app
    }
  })

  function renderLocation (loc) {
    var page = api.router.sync.router(loc)
    if (page) view.set([
      api.app.html.header({location: loc, push: api.history.sync.push}),
      page
    ])
  }

  function startApp () {
    api.history.sync.push({page: 'splash'})

    const delay = process.env.STARTUP_DELAY || 2000
    setTimeout(enterApp, delay)
  }

  function enterApp() {
    const isOnboarded = api.settings.sync.get('onboarded')
    const initialPage = process.env.STARTUP_PAGE || 'blogIndex'
    if (isOnboarded) {
      autoPub()
      api.history.sync.push({page: initialPage})
    }
    else {
      api.history.sync.push({
        page:'userEdit',
        feed: api.keys.sync.id(),
        callback: (err, didEdit) => {
          if (err) throw new Error ('Error editing profile', err)

          // if they clicked something, just mark them onboarded
          api.settings.sync.set({ onboarded: true })

          autoPub()
          api.history.sync.push({page: initialPage})
        }
      })
    }

  }

  function autoPub () {
    var invite = api.config.sync.load().autoinvite
    var self_id = api.config.sync.load().keys.id
    if(invite) {
      api.sbot.async.friendsGet({dest: self_id}, function (err, friends) {
        //if you have less than 5 followers, maybe use the autoinvite
        if(Object.keys(friends).length <= 5)
          api.invite.async.autofollow(
            invite,
            function (err, follows) {
              if (err) console.error('Autofollow error:', err)
              else console.log('Autofollow success', follows)
            }
          )
        else
          console.log('no autoinvite - you have friends already')
      })
    }
    else
      console.log('no invite')
  }
}

