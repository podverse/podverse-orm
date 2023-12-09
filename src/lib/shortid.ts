import shortid from 'shortid'

export const generateShortId = () => {
  return shortid.generate().slice(-14)
}
