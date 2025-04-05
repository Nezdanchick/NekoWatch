import { KODIK_TOKEN } from "@/types/kodik-token";

export const searchKodikByShikimoriId = async (shikimoriId: number) => {
  try {
    console.log('Searching anime in Kodik by Shikimori ID:', shikimoriId);
    const response = await fetch(
      `https://kodikapi.com/search?token=${KODIK_TOKEN}&shikimori_id=${shikimoriId}`
    );
    const data = await response.json();

    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      // Преобразуем ссылки в абсолютные
      const resultsWithAbsoluteLinks = data.results.map((result: any) => ({
        ...result,
        link: (result.link.startsWith('//') ? `https:${result.link}` : result.link) + "&season=1&episode=1&quality=720p",
      }));
      return resultsWithAbsoluteLinks; // Возвращаем массив с абсолютными ссылками
    }

    console.log('Failed to find anime in Kodik by Shikimori ID');
    return [];
  } catch (error) {
    console.error('Request error Kodik API:', error);
    throw new Error('Request error Kodik API');
  }
};