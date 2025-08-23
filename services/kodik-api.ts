const BASE_URL = 'https://neko-kodik.deno.dev'

export const searchKodikByShikimoriId = async (shikimoriId: number, withMaterialData: boolean = false) => {
  try {
    console.log('Searching anime in Kodik by Shikimori ID:', shikimoriId);
    
    const url = `${BASE_URL}/api/anime/?shikimori_id=${shikimoriId}${withMaterialData ? '&with_material_data=true' : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      const resultsWithAbsoluteLinks = data.results.map((result: any) => ({
        ...result,
        link: `${BASE_URL}/api/player/?id=${result.id}`
      }));
      return resultsWithAbsoluteLinks;
    }

    console.log('No results found for this Shikimori ID');
    return [];
  } catch (error) {
    console.error('Request error Kodik API:', error);
    throw new Error(`Request error Kodik API: ${error instanceof Error ? error.message : String(error)}`);
  }
};