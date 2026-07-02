#!/usr/bin/env node
import path from 'path';
import { Command } from 'commander';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const program = new Command();

program
  .name('blog-post')
  .description('키워드로 네이버 뉴스를 분석하여 블로그 포스트를 자동 생성하는 CLI')
  .version('1.0.0');

program
  .command('post', { isDefault: true })
  .description('키워드로 뉴스를 검색하고 포스트를 생성하여 클립보드에 복사')
  .action(async () => {
    const { runPostCommand } = await import('./commands/post');
    await runPostCommand();
  });

program.parse();
