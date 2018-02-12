const nest = require('depnest')
const { computed, Value } = require('mutant')
const { title } = require('markdown-summary')
const { isMsg } = require('ssb-ref')


exports.gives = nest('message.html.subject')

exports.needs = nest({
  'message.html.markdown': 'first',
  'message.sync.unbox': 'first',
  'sbot.async.get': 'first',
})

exports.create = function (api) {
  return nest('message.html.subject', subject)

  function subject (msg) {
    if (msg === undefined) debugger
    // test if it's a message ref, or a full message object
    if (isMsg(msg)) {
      var subject = Value()

      api.sbot.async.get(msg, (err, value) => {
        if (err) throw err

        subject.set(getMsgSubject({
          key: msg,
          value: api.message.sync.unbox(value)
        }))
      })

      return subject
    }
    else 
      return getMsgSubject(msg)
  }

  function getMsgSubject (msg) {
    const { subject, text } = msg.value.content
    if(!(subject || text)) return

    return subject
      ? api.message.html.markdown(subject)
      : api.message.html.markdown(title(text))
  }
}

