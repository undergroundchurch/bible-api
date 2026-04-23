const moment = require('moment')

function formatDate(date, locale) {
  if (date != null) {
    return moment(String(date), 'YYYY-MM-DD hh:mm:ss')
      .locale(locale)
      .format('LL')
  }
  return 'Sorry, This Date Is Missing'
}

module.exports.formatDate = formatDate
