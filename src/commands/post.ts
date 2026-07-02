import ora from 'ora';
import chalk from 'chalk';
import { promptKeyword, promptCategory, promptStyle, promptConfirm } from '../prompts/input';
import { searchNews } from '../services/naverNews';
import { generateBlogPost } from '../services/gemini';
import { copyPostToClipboard } from '../services/naverBlog';

const DIVIDER = '─────────────────────────────────';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim();
}

export async function runPostCommand(): Promise<void> {
  // [1] 키워드 입력
  const keyword = await promptKeyword();

  // [2] 카테고리 선택
  const category = await promptCategory();

  // [3] 스타일 선택
  const style = await promptStyle();

  // [4] 뉴스 수집 (키워드 + 카테고리 조합 검색)
  const searchQuery = `${keyword} ${category}`;
  const newsSpinner = ora(`네이버 뉴스 검색 중... [${searchQuery}]`).start();
  const news = await searchNews(searchQuery);
  newsSpinner.succeed(`뉴스 ${news.length}개 수집 완료`);

  // [4] AI 생성
  const aiSpinner = ora('Gemini로 블로그 포스트 생성 중...').start();
  const post = await generateBlogPost(keyword, news, style);
  aiSpinner.succeed('포스트 생성 완료');

  // [5] 미리보기 출력
  console.log('\n' + DIVIDER);
  console.log(`제목: ${chalk.bold(post.title)}`);
  console.log(`태그: ${(post.tags ?? []).join(' ')}`);
  console.log(DIVIDER);
  console.log(stripHtml(post.content));
  console.log(DIVIDER + '\n');

  // [6] 확인
  const ok = await promptConfirm('클립보드에 복사할까요?');
  if (!ok) {
    console.log('취소되었습니다.');
    return;
  }

  // [7] 클립보드 복사
  const copySpinner = ora('클립보드에 복사 중...').start();
  await copyPostToClipboard(post);
  copySpinner.succeed('클립보드에 복사 완료!');

  // [8] 완료 출력
  console.log(`\n제목: ${chalk.bold(post.title)}`);
  console.log(`태그: ${(post.tags ?? []).join(' ')}`);
  console.log(chalk.green('블로그 글쓰기 화면에서 Ctrl+V로 붙여넣기 하세요.'));
}
