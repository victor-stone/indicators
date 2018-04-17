const ema = windowSize => {

  const isNotDefined = obj => obj === void 0

  return data => {

    const alpha = 2 / (windowSize + 1)
    let previous
    let initialAccumulator = 0
    let skip = 0

    return data.map((v, i) => {

      if (isNotDefined(previous) && isNotDefined(v)) {
        skip++
        return undefined
      } else if (i < windowSize + skip - 1) {
        initialAccumulator += v
        return undefined
      } else if (i === windowSize + skip - 1) {
        initialAccumulator += v
        const initialValue = initialAccumulator / windowSize
        previous = initialValue
        return initialValue
      } else {
        const nextValue = v * alpha + (1 - alpha) * previous
        previous = nextValue
        return nextValue
      }
    })
  }
}

const ema816 = (data, key) => {
  const closes = data.map(({[key]: value}) => value)
  const ema8 = ema(8) // 8 15min periods is 2 hrs
  const ema8data = ema8(closes)
  const ema16 = ema(16) // 16 15min periods is 4 hrs
  const ema16data = ema16(closes)
  return data.map((e,i) => {
    e.ema1 = ema8data[i]
    e.ema2 = ema16data[i]
    return e
  })

}
module.exports.ema = ema
module.exports.ema816 = ema816
