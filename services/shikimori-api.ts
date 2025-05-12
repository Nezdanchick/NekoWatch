import { AnimeDetailed, AnimeShort } from "@/types/anime";
import { Platform } from "react-native";

const BASE_URL = "https://shikimori.one/api";
const USER_AGENT = "NekoWatch/1.0 (https://github.com/nezdanchick/NekoWatch)";

// Добавляем задержку между запросами для избежания rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Улучшенные заголовки для запросов
const getHeaders = () => {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  
  if (Platform.OS === 'web') {
    headers["Origin"] = "https://shikimori.one";
  }
  
  return headers;
};

// Функция для выполнения запросов с повторными попытками
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Если получили 429 (Too Many Requests), ждем и пробуем снова
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited, retrying in 2 seconds... (${retries} attempts left)`);
      await delay(2000);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    // Если получили 5xx ошибку, пробуем снова
    if (response.status >= 500 && retries > 0) {
      console.log(`Server error ${response.status}, retrying in 1 second... (${retries} attempts left)`);
      await delay(1000);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Network error, retrying in 1 second... (${retries} attempts left)`);
      await delay(1000);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function fetchAnimeList(
  page = 1,
  limit = 20,
  order = "popularity",
  kind?: string,
  status?: string,
  season?: string,
  score?: number
): Promise<AnimeShort[]> {
  try {
    let url = `${BASE_URL}/animes?page=${page}&limit=${limit}&order=${order}`;
    
    if (kind) url += `&kind=${kind}`;
    if (status) url += `&status=${status}`;
    if (season) url += `&season=${season}`;
    if (score) url += `&score=${score}`;
    
    console.log(`Fetching anime list: ${url}`);
    
    const response = await fetchWithRetry(url, { 
      headers: getHeaders(),
      method: 'GET'
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${await response.text()}`);
      return [];
    }
    
    const data = await response.json();
    
    // Проверяем, что получили массив
    if (!Array.isArray(data)) {
      console.warn("Unexpected data format from API:", data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching anime list:", error);
    return [];
  }
}

export async function fetchAnimeDetails(id: number): Promise<AnimeDetailed | null> {
  try {
    if (!id || isNaN(id)) {
      console.error("Invalid anime ID:", id);
      return null;
    }
    
    const url = `${BASE_URL}/animes/${id}`;
    console.log(`Fetching anime details: ${url}`);
    
    await delay(300);
    
    const response = await fetchWithRetry(url, { 
      headers: getHeaders(),
      method: 'GET'
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${await response.text()}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching anime details for ID ${id}:`, error);
    return null;
  }
}

export async function searchAnime(query: string, page = 1, limit = 20): Promise<AnimeShort[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const url = `${BASE_URL}/animes?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    console.log(`Searching anime: ${url}`);
    
    const response = await fetchWithRetry(url, { 
      headers: getHeaders(),
      method: 'GET'
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${await response.text()}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn("Unexpected data format from API:", data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
}

export async function fetchGenres() {
  try {
    const url = `${BASE_URL}/genres`;
    console.log(`Fetching genres: ${url}`);
    
    const response = await fetchWithRetry(url, { 
      headers: getHeaders(),
      method: 'GET'
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${await response.text()}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}