module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click')
  },
  html: {
    app: require('./html/app'),
    comments: require('./html/comments'),
    header: require('./html/header'),
    thread: require('./html/thread'), // TODO rename threadPrivate
    link: require('./html/link'),
    lightbox: require('./html/lightbox'),
    blogCard: require('./html/blogCard'),
    channelCard: require('./html/channelCard'),
    topNav: {
      topNavAddressBook: require('./html/topNav/topNavAddressBook'),
      topNavBlog: require('./html/topNav/topNavBlog'),
      topNavBack: require('./html/topNav/zz_topNavBack')
    },
    scroller: require('./html/scroller'),
    sideNav: {
      addressBook: require('./html/sideNav/sideNavAddressBook'),
      discovery: require('./html/sideNav/sideNavDiscovery'),
      notifications: require('./html/sideNav/sideNavNotifications')
    },
    warning: require('./html/warning')
  },
  obs: {
    pluginsOk: require('./obs/pluginsOk')
  },
  page: {
    addressBook: require('./page/addressBook'),
    blogIndex: require('./page/blogIndex'),
    blogNew: require('./page/blogNew'),
    blogSearch: require('./page/blogSearch'),
    blogShow: require('./page/blogShow'),
    channelShow: require('./page/channelShow'),
    channelSubscriptions: require('./page/channelSubscriptions'),
    notifications: require('./page/notifications'),
    error: require('./page/error'),
    userEdit: require('./page/userEdit'),
    userShow: require('./page/userShow'),
    settings: require('./page/settings'),
    splash: require('./page/splash'),
    statsShow: require('./page/statsShow'),
    threadNew: require('./page/threadNew'),
    threadShow: require('./page/threadShow')
  },
  sync: {
    initialize: {
      clickHandler: require('./sync/initialize/clickHandler'),
      settings: require('./sync/initialize/settings'),
      styles: require('./sync/initialize/styles'),
      suggests: require('./sync/initialize/suggests'),
      unreadCounters: require('./sync/initialize/unreadCounters'),
      zoomMemory: require('./sync/initialize/zoomMemory')
    }
  }
}
