const nest = require('depnest')
const { h, Array: MutantArray, resolve, computed } = require('mutant')
const Scroller = require('mutant-scroll')
const pull = require('pull-stream')

const Next = require('pull-next')
const get = require('lodash/get')
const clone = require('lodash/cloneDeep')

exports.gives = nest('app.page.blogIndex')

exports.needs = nest({
  'app.html.blogCard': 'first',
  'app.html.topNav': 'first',
  'app.html.sideNav': 'first',
  'blog.sync.isBlog': 'first',
  'sbot.pull.stream': 'first',
  'sbot.obs.connection': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'contact.obs.followers': 'first',
  'channel.obs.isSubscribedTo': 'first',
  'message.sync.isBlocked': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var blogsCache = MutantArray()

  return nest('app.page.blogIndex', function (location) {
    // location here can expected to be: { page: 'blogIndex', filter: 'All' }
    const { page, filter = 'All' } = location

    var strings = api.translations.sync.strings()
    blogsCache.clear()

    var blogs = Scroller({
      classList: ['content'],
      prepend: [
        api.app.html.topNav(location),
        // Filters()
      ],
      streamToTop: Source({ reverse: false, live: true, old: false, limit: 20 }, api, filter),
      streamToBottom: Source({ reverse: true, live: false, limit: 20 }, api, filter),
      updateTop: update,
      updateBottom: update,
      store: blogsCache,
      render
    })

    // HACK
    blogs.insertBefore(Filters(), blogs.querySelector('.content'))

    function Filters () {
      const goTo = (loc) => () => api.history.sync.push(loc)
      return h('Filters', [
        h('span -filter', {
          className: filter === 'All' ? '-active' : '',
          'ev-click': goTo({ page, filter: 'All' })
        }, 'All'),
        h('span', '|'),
        h('span -filter', {
          className: filter === 'Subscriptions' ? '-active' : '',
          'ev-click': goTo({ page, filter: 'Subscriptions' })
        }, 'Subscriptions'),
        h('span', '|'),
        h('span -filter', {
          className: filter === 'Friends' ? '-active' : '',
          'ev-click': goTo({ page, filter: 'Friends' })
        }, 'Friends')
      ])
    }

    return h('Page -blogIndex', { title: strings.home }, [
      api.app.html.sideNav(location),
      blogs
    ])
  })

  function Source (opts, api, filter) {
    const commonOpts = {
      query: [{
        $filter: {
          value: {
            content: {
              type: 'blog'
            },
            timestamp: { $gt: 0, $lt: undefined }
          }
        }
      }]
    }

    const myId = api.keys.sync.id()
    const { followers } = api.contact.obs

    const filterbyFriends = (msg) => {
      if (filter !== 'Friends') return true

      const feed = msg.value.author
      const theirFollowers = followers(feed)
      const youFollowThem = computed(theirFollowers, followers => followers.includes(myId))

      return resolve(youFollowThem)
    }

    const filterBySubscription = (msg) => {
      if (filter !== 'Subscriptions') return true

      if (!msg.value.content.hasOwnProperty('channel')) {
        return false
      }

      const channel = msg.value.content.channel

      return resolve(api.channel.obs.isSubscribedTo(channel))
    }

    return pull(
      StepperStream(
        (options) => api.sbot.pull.stream(sbot => sbot.query.read(options)),
        Object.assign(commonOpts, opts)
      ),
      pull.filter(api.blog.sync.isBlog), // isBlog or Plog?
      pull.filter(filterBySubscription),
      pull.filter(filterbyFriends),
      // pull.filter(msg => !msg.value.content.root), // show only root messages
      pull.filter(msg => !api.message.sync.isBlocked(msg)) // this is already in feed.pull.type
    )
  }

  function update (soFar, newBlog) {
    soFar.transaction(() => {
      var object = newBlog // Value(newBlog)

      const index = indexOf(soFar, (blog) => newBlog.key === resolve(blog).key)
      // if blog already in cache, not needed again
      if (index >= 0) return

      const justOlderPosition = indexOf(soFar, (msg) => newBlog.value.timestamp > resolve(msg).value.timestamp)

      if (justOlderPosition > -1) {
        soFar.insert(object, justOlderPosition)
      } else {
        soFar.push(object)
      }
    })
  }

  function render (blog) {
    const { recps, channel } = blog.value.content
    var onClick
    if (channel && !recps) { onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' })) }
    return api.app.html.blogCard(blog, { onClick })
  }
}

function indexOf (array, fn) {
  for (var i = 0; i < array.getLength(); i++) {
    if (fn(array.get(i))) {
      return i
    }
  }
  return -1
}

// this is needed because muxrpc doesn't do back-pressure yet
// this is a modified pull-next-step for ssb-query
function StepperStream (createStream, _opts) {
  var opts = clone(_opts)
  var last = null
  var count = -1

  return Next(() => {
    if (last) {
      if (count === 0) return
      // mix: not sure which case this ends stream for
      //

      var value = get(last, ['value', 'timestamp'])
      if (value == null) return

      if (opts.reverse) {
        opts.query[0].$filter.value.timestamp.$lt = value
      } else {
        opts.query[0].$filter.value.timestamp.$gt = value
      }
      last = null
    }

    return pull(
      createStream(clone(opts)),
      pull.through(
        (msg) => {
          count++
          if (!msg.sync) {
            last = msg
          }
        },
        (err) => {
          // retry on errors...
          if (err) {
            count = -1
            return count
          }
          // end stream if there were no results
          if (last == null) last = {}
        }
      )
    )
  })
}
