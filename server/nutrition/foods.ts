import type { FoodPortion } from '../../src/health.js';
import { fail } from '../ai/provider.js';
import { getPool } from '../postgres.js';

export async function foodPortion(query: string, grams: number): Promise<FoodPortion> {
  if (!process.env.FOOD_DATA_API_KEY)
    throw fail('Food lookup is not configured. Enter nutrition from a food label manually.', 503);
  if (!query.trim() || query.length > 150 || !Number.isFinite(grams) || grams <= 0 || grams > 2000)
    throw fail('Specify a food and a portion between 1 and 2000 grams.');
  const cacheKey = query.trim().toLowerCase();
  const cached = (
    await getPool().query(
      "SELECT payload FROM health_food_cache WHERE query=$1 AND fetched_at > now()-interval '30 days'",
      [cacheKey],
    )
  ).rows[0]?.payload;
  let food = cached;
  if (!food) {
    let response: Response;
    try {
      response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(process.env.FOOD_DATA_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({ query, dataType: ['Foundation', 'SR Legacy'], pageSize: 1 }),
        },
      );
    } catch {
      throw fail('Food lookup timed out. Please try again or log manually.', 503);
    }
    if (!response.ok)
      throw fail('Food lookup is unavailable. Please try again or log manually.', 503);
    food = (await response.json()).foods?.[0];
    if (!food)
      throw fail(
        `No food match for "${query}". Describe ingredients separately or use a food label.`,
        422,
      );
    await getPool().query(
      'INSERT INTO health_food_cache(query,payload) VALUES($1,$2) ON CONFLICT(query) DO UPDATE SET payload=EXCLUDED.payload, fetched_at=now()',
      [cacheKey, JSON.stringify(food)],
    );
  }
  const nutrient = (id: number) => {
    const n = food.foodNutrients?.find((x: any) => x.nutrientId === id);
    if (!n || !Number.isFinite(n.value) || n.value < 0)
      throw fail(
        'This food has incomplete nutrient data. Choose a different match or log manually.',
        422,
      );
    return Math.round(((n.value * grams) / 100) * 10) / 10;
  };
  // USDA search results report these nutrients per 100 g; portions are explicit.
  return {
    foodId: food.fdcId,
    name: food.description,
    grams,
    calories: nutrient(1008),
    proteinGrams: nutrient(1003),
    carbsGrams: nutrient(1005),
    fatsGrams: nutrient(1004),
    source: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`,
  };
}
