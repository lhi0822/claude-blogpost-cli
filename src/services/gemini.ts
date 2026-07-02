import { GoogleGenAI } from '@google/genai';
import { NewsItem, BlogPost, PostStyle } from '../types';

function buildPrompt(keyword: string, articles: NewsItem[], style: PostStyle): string {
  const styleLabel = style === 'newsletter' ? '뉴스레터' : '칼럼';
  const newsList = articles
    .map((a) => `- 제목: ${a.title}\n  내용: ${a.description}\n  날짜: ${a.pubDate}`)
    .join('\n');

  return `키워드: ${keyword}
스타일: ${styleLabel}
뉴스 목록:
${newsList}

위 뉴스를 분석하여 블로그 포스트를 작성해주세요.

[필수 규칙]
1. 본문은 순수 텍스트로만 작성하세요. HTML 태그, 마크다운 기호(**, ##, - 등)를 절대 사용하지 마세요.
   - 단, 칼럼 스타일일 경우 문단이 바뀔 때 빈 줄(줄바꿈 2번)로 문단을 구분하세요.
2. 뉴스 출처 번호(예: (1), (7) 등)를 본문에 절대 넣지 마세요. 뉴스를 인용할 때도 번호 없이 자연스럽게 녹여 쓰세요.
3. 어투는 독자에게 말을 거는 방식이 아닌, 혼자 생각을 정리해 적는 독백 형식으로 작성하세요.
   - 본문 첫 문장은 반드시 '안녕하세요, 어닝데이입니다.' 로 시작하세요.
   - 반드시 피해야 할 표현: '~살펴보겠습니다', '~알아보겠습니다', '~들여다보겠습니다', '여러분', '오늘은 ~에 대해', '~어떨까요?', '함께'
   - 권장 어투: '~인 것 같습니다', '~라는 생각이 듭니다', '~가 눈에 띕니다', '개인적으로는', '솔직히', '생각해보면', '~라고 봅니다'
   - 문장은 존댓말 서술형(~합니다, ~입니다, ~같습니다)으로 마무리하세요. 반말(~다, ~이다, ~같다)을 절대 사용하지 마세요.
4. 태그는 최소 20개 작성하고, 각 태그 앞에 '#' 을 붙이며 띄어쓰기 없이 작성하세요. (예: #부동산 #서울아파트)
5. JSON의 "tags" 배열에 태그 목록을 넣으세요. (최소 20개, # 포함, 예: ["#부동산", "#서울아파트", ...])

분량: 1,000~1,500자
반드시 아래 JSON 형식으로만 응답 (마크다운 코드블록 없이 순수 JSON만):
{
  "title": "제목 (60자 이내)",
  "content": "순수 텍스트 본문",
  "tags": ["#태그1", "#태그2", "...최소 20개"]
}`;
}

export async function generateBlogPost(
  keyword: string,
  articles: NewsItem[],
  style: PostStyle
): Promise<BlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(keyword, articles, style);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text ?? '';

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Gemini 응답에서 JSON을 추출할 수 없습니다.');
  }

  // Escape literal control characters inside JSON string values
  const sanitized = match[0].replace(
    /"(?:[^"\\]|\\.)*"/g,
    (str) => str.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  );

  return JSON.parse(sanitized) as BlogPost;
}
