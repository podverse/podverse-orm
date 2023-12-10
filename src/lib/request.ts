import axios, { AxiosRequestConfig } from 'axios'
import { config } from '../config'
const { userAgent } = config

export const request = async (config: AxiosRequestConfig) => {
  const headers = (config && config.headers) || {}
  const response = await axios({
    timeout: 15000,
    headers: {
      ...headers,
      'User-Agent': userAgent
    },
    ...config
  })

  return response
}
