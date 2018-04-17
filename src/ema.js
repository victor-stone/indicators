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

module.exports.ema = ema
