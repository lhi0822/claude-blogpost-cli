import 'dotenv/config';
import { searchNews } from './src/services/naverNews';
import { generateBlogPost } from './src/services/gemini';

const KEYWORD = process.argv[2] ?? '부동산';
const STYLE = 'newsletter' as const;
const SEP = '─'.repeat(50);

async function main() {
  console.log(`\n${SEP}`);
  console.log('[DRY RUN] 실제 포스팅은 수행되지 않습니다');
  console.log(`키워드: ${KEYWORD}`);
  console.log(SEP);

  console.log('\n[1/2] 뉴스 수집 중...');
  const articles = await searchNews(KEYWORD, 10);
  console.log(`✔ ${articles.length}개 뉴스 수집 완료`);

  console.log('\n[2/2] AI 포스트 생성 중...');
  const post = await generateBlogPost(KEYWORD, articles, STYLE);
  console.log('✔ 포스트 생성 완료');

  console.log(`\n${SEP}`);
  console.log(`제목: ${post.title}`);
  console.log(`태그: ${(post.tags ?? []).join(' ')}`);
  console.log(SEP);
  console.log(post.content);
  console.log(SEP);
  console.log('\n드라이런 완료 — 포스팅 생략됨\n');
}

main().catch((e) => { console.error('오류:', e.message); process.exit(1); });
