const BASE_URL = 'http://neko-kodik.deno.dev'

export interface KodikTranslation {
  title: string,
}

export interface KodikMaterialData {
  description: string,
  poster_url: string,
  anime_poster_url: string,
}

export interface KodikSerial {
  id: string,
  title: string,
  translation: KodikTranslation,
  material_data: KodikMaterialData,
  screenshots: string[],
}

export const searchKodikByShikimoriId = async (shikimoriId: number) => {
  try {
    console.log('Searching anime in Kodik by Shikimori ID:', shikimoriId);
    const response = await fetch(
      `${BASE_URL}/api/anime/?shikimori_id=${shikimoriId}`
    );
    const data = await response.json();

    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      // Преобразуем ссылки в абсолютные
      const resultsWithAbsoluteLinks = data.results.map((result: any) => ({
        ...result,
        link: `${BASE_URL}/api/player/?id=${result.id}`
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