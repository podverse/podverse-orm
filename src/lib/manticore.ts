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
