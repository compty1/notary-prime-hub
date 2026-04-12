/**
 * Revenue forecasting with trend analysis.
 * Enhancement #32 (Revenue forecasting)
 */

export interface ForecastPoint {
  month: string;
  actual?: number;
  forecast: number;
  lowerBound: number;
  upperBound: number;
}

/** Simple exponential smoothing forecast */
export function forecastRevenue(
  historicalData: Array<{ month: string; revenue: number }>,
  forecastMonths = 6,
  alpha = 0.3
): ForecastPoint[] {
  if (historicalData.length < 3) return [];

  const values = historicalData.map((d) => d.revenue);
  
  // Calculate exponential smoothing
  let level = values[0];
  const smoothed: number[] = [level];
  
  for (let i = 1; i < values.length; i++) {
    level = alpha * values[i] + (1 - alpha) * level;
    smoothed.push(level);
  }

  // Calculate standard deviation for confidence bands
  const errors = values.map((v, i) => v - smoothed[i]);
  const stdDev = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);

  // Build result with actuals
  const result: ForecastPoint[] = historicalData.map((d, i) => ({
    month: d.month,
    actual: d.revenue,
    forecast: Math.round(smoothed[i]),
    lowerBound: Math.round(smoothed[i] - 1.96 * stdDev),
    upperBound: Math.round(smoothed[i] + 1.96 * stdDev),
  }));

  // Generate future forecasts
  const lastLevel = smoothed[smoothed.length - 1];
  const lastDate = new Date(historicalData[historicalData.length - 1].month + "-01");

  for (let i = 1; i <= forecastMonths; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    const month = futureDate.toISOString().slice(0, 7);
    
    result.push({
      month,
      forecast: Math.round(lastLevel),
      lowerBound: Math.max(0, Math.round(lastLevel - 1.96 * stdDev * Math.sqrt(i))),
      upperBound: Math.round(lastLevel + 1.96 * stdDev * Math.sqrt(i)),
    });
  }

  return result;
}

/** Calculate month-over-month growth rate */
export function calculateGrowthRate(data: Array<{ month: string; revenue: number }>): number {
  if (data.length < 2) return 0;
  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
  const recent = sorted.slice(-3);
  if (recent.length < 2) return 0;
  
  const avgGrowth = recent.reduce((sum, d, i) => {
    if (i === 0) return 0;
    const prev = recent[i - 1].revenue;
    return sum + (prev > 0 ? (d.revenue - prev) / prev : 0);
  }, 0) / (recent.length - 1);

  return Math.round(avgGrowth * 100 * 10) / 10;
}
