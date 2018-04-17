"use strict";

var ema = function ema(windowSize) {

  var isNotDefined = function isNotDefined(obj) {
    return obj === void 0;
  };

  return function (data) {

    var alpha = 2 / (windowSize + 1);
    var previous = void 0;
    var initialAccumulator = 0;
    var skip = 0;

    return data.map(function (v, i) {

      if (isNotDefined(previous) && isNotDefined(v)) {
        skip++;
        return undefined;
      } else if (i < windowSize + skip - 1) {
        initialAccumulator += v;
        return undefined;
      } else if (i === windowSize + skip - 1) {
        initialAccumulator += v;
        var initialValue = initialAccumulator / windowSize;
        previous = initialValue;
        return initialValue;
      } else {
        var nextValue = v * alpha + (1 - alpha) * previous;
        previous = nextValue;
        return nextValue;
      }
    });
  };
};

module.exports.ema = ema;
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var DEFAULT_TENKAN = 9;
var DEFAULT_KIJUN = 26;
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
var ichimoku = function ichimoku(cxData) {
  var tenkanParam = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_TENKAN;
  var kijunParam = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_KIJUN;

  var ichimokuData = cxData.map(function (obj, i) {
    return _extends({}, obj, { x: i + 1 - cxData.length });
  });

  var dateDiff = ichimokuData[1].date - ichimokuData[0].date;
  var date = ichimokuData[cxData.length - 1].date;
  for (var i = 0; i < kijunParam; i++) {
    date += dateDiff;
    ichimokuData.push({ 'x': i + 1, date: date });
  }

  var releventIndices = {
    'tenkanSen': { 'highIndices': [], 'lowIndices': [] },
    'kijunSen': { 'highIndices': [], 'lowIndices': [] },
    'senkouSpanB': { 'highIndices': [], 'lowIndices': [] }
  };

  function slidingWindow(i, k, limits, data) {
    var h = limits.highIndices;
    var l = limits.lowIndices;
    if (i < k) {
      while (h.length > 0 && data[i].high >= data[h[h.length - 1]].high) {
        h.pop();
      }
      while (l.length > 0 && data[i].low <= data[l[l.length - 1]].low) {
        l.pop();
      }
      h.push(i);
      l.push(i);
    } else {
      while (h.length > 0 && h[0] <= i - k) {
        h.shift();
      }
      while (l.length > 0 && l[0] <= i - k) {
        l.shift();
      }
      while (h.length > 0 && data[i].high >= data[h[h.length - 1]].high) {
        h.pop();
      }
      while (l.length > 0 && data[i].low <= data[l[l.length - 1]].low) {
        l.pop();
      }
      h.push(i);
      l.push(i);
    }
    return { limits: limits, avg: (data[h[0]].high + data[l[0]].low) / 2 };
  }

  var swReturn = void 0;
  for (var _i = 0; _i < cxData.length; _i++) {
    // Tenkan-sen (ConversionLine): (9-period high + 9-period low)/2))
    swReturn = slidingWindow(_i, tenkanParam, releventIndices.tenkanSen, cxData);
    releventIndices.tenkanSen = swReturn.limits;
    ichimokuData[_i].tenkanSen = swReturn.avg;

    // Kijun-sen (Base Line): (26-period high + 26-period low)/2))
    swReturn = slidingWindow(_i, kijunParam, releventIndices.kijunSen, cxData);
    releventIndices.kijunSen = swReturn.limits;
    ichimokuData[_i].kijunSen = swReturn.avg;

    // Senkou Span B (Leading Span B): (52-period high + 52-period low)/2))
    swReturn = slidingWindow(_i, kijunParam * 2, releventIndices.senkouSpanB, cxData);
    releventIndices.senkouSpanB = swReturn.limits;
    ichimokuData[_i + kijunParam].senkouSpanB = swReturn.avg;

    if (_i >= kijunParam - 1) {
      // Senkou Span A (Leading Span A): (Conversion Line + Base Line)/2))
      ichimokuData[_i + kijunParam].senkouSpanA = (ichimokuData[_i].tenkanSen + ichimokuData[_i].kijunSen) / 2;
      ichimokuData[_i - kijunParam + 1].chikouSpan = cxData[_i].close;
    }
  }
  // console.table(ichimokuData);
  // for (let i = 0; i < k + kijunParam; i++) ichimokuData.shift();
  return ichimokuData;
};

module.exports.ichimoku = ichimoku;

