module.exports = {
  html: {
    backup: require('./html/backup')
  },
  async: {
    exportIdentity: require('./async/exportIdentity'),
    importIdentity: require('./async/importIdentity')
  }
}
