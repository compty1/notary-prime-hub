/**
 * Competitor benchmarking and pricing intelligence display.
 * Enhancement #80 (Competitive pricing intelligence)
 */

export interface CompetitorBenchmark {
  service: string;
  ourPrice: number;
  marketLow: number;
  marketHigh: number;
  marketAvg: number;
  position: "below" | "at" | "above";
}

/** Ohio notary market averages (sourced from public data) */
const OHIO_MARKET_DATA: Record<string, { low: number; high: number; avg: number }> = {
  "notarization": { low: 2, high: 10, avg: 5 },
  "ron-session": { low: 25, high: 50, avg: 35 },
  "mobile-notary": { low: 50, high: 150, avg: 85 },
  "loan-signing": { low: 75, high: 200, avg: 125 },
  "apostille": { low: 50, high: 200, avg: 100 },
  "fingerprinting": { low: 25, high: 75, avg: 45 },
  "i9-verification": { low: 25, high: 75, avg: 40 },
  "estate-planning-notary": { low: 50, high: 150, avg: 75 },
};

/** Generate competitive benchmark analysis */
export function generateBenchmarks(
  ourPrices: Record<string, number>
): CompetitorBenchmark[] {
  return Object.entries(ourPrices)
    .filter(([key]) => OHIO_MARKET_DATA[key])
    .map(([service, price]) => {
      const market = OHIO_MARKET_DATA[service];
      let position: "below" | "at" | "above" = "at";
      if (price < market.avg * 0.9) position = "below";
      else if (price > market.avg * 1.1) position = "above";

      return {
        service,
        ourPrice: price,
        marketLow: market.low,
        marketHigh: market.high,
        marketAvg: market.avg,
        position,
      };
    });
}
