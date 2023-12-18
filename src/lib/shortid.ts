const shortid = require('shortid')

export const generateShortId = () => {
  return shortid.generate().slice(-14)
}
