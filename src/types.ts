export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface BlogPost {
  title: string;
  content: string; // HTML
  tags: string[];  // 20개+
}

export type PostStyle = 'newsletter' | 'column';

export type Category = '부동산' | '주식' | '경제' | 'IT' | '정치' | '사회';

export interface NaverToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
