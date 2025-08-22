import { ShikimoriInfo } from "@/types/anime";
import { Platform } from "react-native";

const GRAPHQL_URL = "https://shikimori.one/api/graphql";
const USER_AGENT = "NekoWatch (https://github.com/nezdanchick/NekoWatch)";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getHeaders = () => ({
  "User-Agent": USER_AGENT,
  "Content-Type": "application/json",
  ...(Platform.OS === 'web' && { "Origin": "https://shikimori.one" })
});

const animesQuery = `
  id
  name
  russian
  kind
  score
  airedOn { date }
  poster { mainUrl }
`;

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      await delay(2000);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    if (response.status >= 500 && retries > 0) {
      await delay(1000);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await delay(1000);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  try {
    const response = await fetchWithRetry(GRAPHQL_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) return null;

    const { data, errors } = await response.json();
    if (errors) throw new Error(JSON.stringify(errors));

    return data;
  } catch (error) {
    console.error("GraphQL request error:", error);
    return null;
  }
}

export async function fetchAnimeList(
  page = 1,
  limit = 20,
  order: "ranked" | string = "ranked",
  kind?: string,
  status?: string,
  season?: string,
  score?: number
): Promise<ShikimoriInfo[]> {
  const query = `
query(
  $page: PositiveInt
      $limit: PositiveInt
      $order: OrderEnum
      $kind: AnimeKindString
      $status: AnimeStatusString
      $season: SeasonString
      $score: Int
) {
  animes(
    page: $page
        limit: $limit
        order: $order
        kind: $kind
        status: $status
        season: $season
        score: $score
  ) {
    ${animesQuery}
  }
}
`;

  const variables = { page, limit, order, kind, status, season, score };
  const data = await graphqlRequest<{ animes: ShikimoriInfo[] }>(query, variables);
  return data?.animes || [];
}

export async function fetchAnimeDetails(id: number): Promise<ShikimoriInfo | null> {
  const query = `
query($ids: String!) {
  animes(ids: $ids) {
    ${animesQuery}
  }
}
`;

  try {
    await delay(300);
    const data = await graphqlRequest<{ animes: ShikimoriInfo[] }>(query, { ids: String(id) });
    return data?.animes?.[0] || null;
  } catch (error) {
    console.error("Error fetching anime details:", error);
    return null;
  }
}

export async function searchAnime(query: string, page = 1, limit = 20): Promise<ShikimoriInfo[]> {
  if (!query.trim()) return [];

  const gqlQuery = `
query($search: String!, $page: Int, $limit: Int) {
  animes(search: $search, page: $page, limit: $limit) {
    ${animesQuery}
  }
}
`;

  const variables = { search: query, page, limit };
  const data = await graphqlRequest<{ animes: ShikimoriInfo[] }>(gqlQuery, variables);
  return data?.animes || [];
}
