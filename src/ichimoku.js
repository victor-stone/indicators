const DEFAULT_TENKAN = 9
const DEFAULT_KIJUN = 26
/**
 * Calculate Ichimoku Cloud
 *
 * Return array of calcuations for each candle includes future cloud predictions
 *
 * x - '0' is the current candle
 * x - < 0 := historial
 * x  > 0 := future cloud predictions
 *
 * chikouSpan - lagging price data
 *
 * tenkanSen - AKA Conversion 'short' (9) candle moving average
 *
 * kijunSen - AKA Baseline 'long' (26) candle moving average
 *
 * senkouSpanA - top of cloud
 *
 * senkouSpanB - bottom of cloud
 *
 * @returns {{open:number,close:number,high:number,low:number,x:number,chikouSpan:number,senkouSpanA:number,senkouSpanB:number,tenkanSen:number,kijunSen:number}[]}
 * @param {array} cxData array of market data
 * @param {number} tenkanParam Number of candles to average for 'short' period
 * @param {number} kijunParam  Number of candles to average for 'long' period
 */
const ichimoku = (cxData, tenkanParam = DEFAULT_TENKAN, kijunParam = DEFAULT_KIJUN) => {
  let ichimokuData = cxData.map((obj, i) => ({ ...obj, x: i + 1 - cxData.length }))

  const dateDiff = ichimokuData[1].date - ichimokuData[0].date
  let date = ichimokuData[cxData.length - 1].date
  for (let i = 0; i < kijunParam; i++) {
    date += dateDiff
    ichimokuData.push({ 'x': i + 1, date })
  }

  let releventIndices = {
    'tenkanSen': { 'highIndices': [], 'lowIndices': [] },
    'kijunSen': { 'highIndices': [], 'lowIndices': [] },
    'senkouSpanB': { 'highIndices': [], 'lowIndices': [] }
  }

  function slidingWindow (i, k, limits, data) {
    let h = limits.highIndices
    let l = limits.lowIndices
    if (i < k) {
      while (h.length > 0 && data[i].high >= data[h[h.length - 1]].high) { h.pop() }
      while (l.length > 0 && data[i].low <= data[l[l.length - 1]].low) { l.pop() }
      h.push(i)
      l.push(i)
    } else {
      while (h.length > 0 && h[0] <= i - k) { h.shift() }
      while (l.length > 0 && l[0] <= i - k) { l.shift() }
      while (h.length > 0 && data[i].high >= data[h[h.length - 1]].high) { h.pop() }
      while (l.length > 0 && data[i].low <= data[l[l.length - 1]].low) { l.pop() }
      h.push(i)
      l.push(i)
    }
    return { limits, avg: (data[h[0]].high + data[l[0]].low) / 2 }
  }

  let swReturn
  for (let i = 0; i < cxData.length; i++) {
    // Tenkan-sen (ConversionLine): (9-period high + 9-period low)/2))
    swReturn = slidingWindow(i, tenkanParam, releventIndices.tenkanSen, cxData)
    releventIndices.tenkanSen = swReturn.limits
    ichimokuData[i].tenkanSen = swReturn.avg

    // Kijun-sen (Base Line): (26-period high + 26-period low)/2))
    swReturn = slidingWindow(i, kijunParam, releventIndices.kijunSen, cxData)
    releventIndices.kijunSen = swReturn.limits
    ichimokuData[i].kijunSen = swReturn.avg

    // Senkou Span B (Leading Span B): (52-period high + 52-period low)/2))
    swReturn = slidingWindow(i, kijunParam * 2, releventIndices.senkouSpanB, cxData)
    releventIndices.senkouSpanB = swReturn.limits
    ichimokuData[i + kijunParam].senkouSpanB = swReturn.avg

    if (i >= kijunParam - 1) {
      // Senkou Span A (Leading Span A): (Conversion Line + Base Line)/2))
      ichimokuData[i + kijunParam].senkouSpanA = (ichimokuData[i].tenkanSen + ichimokuData[i].kijunSen) / 2
      ichimokuData[i - kijunParam + 1].chikouSpan = cxData[i].close
    }
  }
  // console.table(ichimokuData);
  // for (let i = 0; i < k + kijunParam; i++) ichimokuData.shift();
  return ichimokuData
}

module.exports.ichimoku = ichimoku
