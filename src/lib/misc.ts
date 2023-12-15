export const chunkArray = (arr, chunkSize = 10) => {
  let i
  let j
  const chunks = []
  for (i = 0, j = arr.length; i < j; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize) as never // TODO: What does this mean?
    chunks.push(chunk)
  }
  return chunks
}

export const offsetDate = (minutesOffset = 0) => {
  const todayDate = new Date()
  todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset() + minutesOffset)
  return todayDate.toISOString().slice(0, 10)
}

export const convertSecondsToDaysText = (seconds) => {
  const totalDays = Math.round(parseInt(seconds, 10) / 86400)
  return `${totalDays > 1 ? `${totalDays} days` : '24 hours'}`
}

export const generateQueryParams = (query: any) => {
  return Object.keys(query)
    .map((key) => {
      return `${key}=${query[key]}`
    })
    .join('&')
}

export const addOrderByToQuery = (qb, type, sort, sortDateKey, allowRandom, isFromManticoreSearch?) => {
  const ascKey = 'ASC'
  const descKey = 'DESC'

  if (!sort && isFromManticoreSearch) {
    // apply no sorting
  } else if (sort === 'live-item-start-asc') {
    qb.orderBy(`liveItem.start`, ascKey)
  } else if (sort === 'live-item-start-desc') {
    qb.orderBy(`liveItem.start`, descKey)
  } else if (sort === 'top-past-hour') {
    qb.orderBy(`${type}.pastHourTotalUniquePageviews`, descKey)
  } else if (sort === 'top-past-day') {
    qb.orderBy(`${type}.pastDayTotalUniquePageviews`, descKey)
  } else if (sort === 'top-past-month') {
    qb.orderBy(`${type}.pastMonthTotalUniquePageviews`, descKey)
  } else if (sort === 'top-past-year') {
    qb.orderBy(`${type}.pastYearTotalUniquePageviews`, descKey)
  } else if (sort === 'top-all-time') {
    qb.orderBy(`${type}.pastAllTimeTotalUniquePageviews`, descKey)
  } else if (sort === 'most-recent') {
    qb.orderBy(`${type}.${sortDateKey}`, descKey)
  } else if (sort === 'oldest') {
    qb.orderBy(`${type}.${sortDateKey}`, ascKey)
  } else if (sort === 'alphabetical') {
    qb.orderBy(`${type}.sortableTitle`, ascKey)
  } else if (sort === 'random' && allowRandom) {
    qb.orderBy('RANDOM()')
  } else if (sort === 'chronological' && type === 'mediaRef') {
    qb.orderBy(`${type}.startTime`, ascKey)
  } else if (sort === 'createdAt') {
    qb.orderBy(`${type}.createdAt`, descKey)
  } else if (sort === 'episode-number-asc') {
    qb.orderBy(`${type}.itunesEpisode`, ascKey)
  } else {
    // sort = top-past-week
    qb.orderBy(`${type}.pastWeekTotalUniquePageviews`, descKey)
  }

  return qb
}


export const removeObjectKeysWithEmptyValues = (obj) =>
  Object.keys(obj).forEach((key) => obj[key] == null && delete obj[key])

export const convertToSlug = (str) => str.replace(/\s+/g, '-').toLowerCase().replace(/\W/g, '').trim()

export const convertToSortableTitle = (title: string) => {
  const sortableTitle = title
    ? title
        .toLowerCase()
        .replace(/\b^the\b|\b^a\b|\b^an\b/i, '')
        .trim()
    : ''
  return sortableTitle ? sortableTitle.replace(/#/g, '') : ''
}

export const isValidDate = (date: any) => date instanceof Date && !isNaN(date as any)

// export const cleanFileExtension = (fileExtension: string) => {
//   // If an invalid extension is provided, try to correct it.
//   if (fileExtension.indexOf('png') >= 0) {
//     return 'png'
//   } else if (fileExtension.indexOf('jpg') >= 0) {
//     return 'jpg'
//   } else if (fileExtension.indexOf('jpeg') >= 0) {
//     return 'jpeg'
//   } else if (fileExtension.indexOf('svg') >= 0) {
//     return 'svg'
//   } else {
//     return 'png'
//   }
// }

export const hasSupportedLanguageMatch = (lang1, lang2) => {
  if (lang1 && lang2) {
    const firstLang = lang1.split('-')[0]
    return lang2.indexOf(firstLang) >= 0
  } else {
    return false
  }
}

export const removeProtocol = (str: string) => {
  return str ? str.replace(/^https?\:\/\//i, '') : ''
}

export const parseProp = (item: any, key: string, defaultValue: any) => {
  let val = defaultValue
  if (typeof item === 'object' && item[key]) {
    try {
      val = JSON.parse(item[key])
    } catch (error) {
      console.log(`parseProp ${key} error`, error)
    }
  }
  return val
}

export const saltRounds = 10
