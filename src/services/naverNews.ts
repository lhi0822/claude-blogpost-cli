import axios from 'axios';
import { NewsItem } from '../types';

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, '');
}

export async function searchNews(keyword: string, count = 10): Promise<NewsItem[]> {
  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다.');
  }

  const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
    headers: {
      'X-Naver-Client-Id':     clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    params: {
      query:   keyword,
      display: count,
      sort:    'date',
    },
  });

  return response.data.items.map((item: any) => ({
    title:       stripHtml(item.title),
    link:        item.link,
    description: stripHtml(item.description),
    pubDate:     item.pubDate,
  }));
}
