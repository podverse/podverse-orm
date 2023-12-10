import { config } from '../config'
import ManticoreSearch from 'manticoresearch'

/* Connect to Manticore API */

const { manticore } = config
const { domain, port, protocol } = manticore

const client = new ManticoreSearch.ApiClient()
client.basePath = `${protocol}://${domain}:${port}`

export const searchApi = new ManticoreSearch.UtilsApi(client)

/* Helpers */

export const manticoreWildcardSpecialCharacters = (str: string) => str.replace(/\?|-|!| |%|:|\(|\)|\//g, "'")

export const getManticoreOrderByColumnName = (sort) => {
  let orderByColumnName = ''
  let orderByDirection = 'desc'

  if (sort === 'top-past-hour') {
    orderByColumnName = 'pasthourtotaluniquepageviews'
  } else if (sort === 'top-past-week') {
    orderByColumnName = 'pastweektotaluniquepageviews'
  } else if (sort === 'top-past-month') {
    orderByColumnName = 'pastmonthtotaluniquepageviews'
  } else if (sort === 'top-past-year') {
    orderByColumnName = 'pastyeartotaluniquepageviews'
  } else if (sort === 'top-all-time') {
    orderByColumnName = 'pastalltimetotaluniquepageviews'
  } else if (sort === 'oldest') {
    orderByColumnName = 'created_date'
    orderByDirection = 'asc'
  } else if (sort === 'most-recent') {
    orderByColumnName = 'created_date'
  } else if (sort === 'alphabetical') {
    orderByColumnName = 'sortabletitle'
    orderByDirection = 'asc'
  } else {
    /*
      Default to pastmonthtotaluniquepageviews for all other searches
      so there is at least some popularity ranking in the match score.
    */
    orderByColumnName = 'pastmonthtotaluniquepageviews'
  }

  return { orderByColumnName, orderByDirection }
}
