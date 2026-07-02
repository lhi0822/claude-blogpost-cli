import * as readline from 'readline';
import chalk from 'chalk';
import { PostStyle, Category } from '../types';

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function promptKeyword(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const input = (await ask(rl, chalk.cyan('> 키워드를 입력하세요: '))).trim();
      if (input) return input;
      console.log(chalk.yellow('키워드를 입력해주세요.'));
    }
  } finally {
    rl.close();
  }
}

export async function promptCategory(): Promise<Category> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const options: { label: string; value: Category }[] = [
    { label: '부동산', value: '부동산' },
    { label: '주식/증권', value: '주식' },
    { label: '경제/금융', value: '경제' },
    { label: 'IT/테크', value: 'IT' },
    { label: '정치', value: '정치' },
    { label: '사회', value: '사회' },
  ];
  try {
    console.log(chalk.bold('\n카테고리를 선택하세요:'));
    options.forEach((o, i) => console.log(`  [${i + 1}] ${o.label}`));
    while (true) {
      const input = (await ask(rl, chalk.cyan('> '))).trim();
      const idx = parseInt(input, 10) - 1;
      if (idx >= 0 && idx < options.length) return options[idx].value;
      console.log(chalk.yellow(`1~${options.length} 중에서 선택해주세요.`));
    }
  } finally {
    rl.close();
  }
}

export async function promptStyle(): Promise<PostStyle> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(chalk.bold('\n포스트 스타일을 선택하세요:'));
    console.log('  [1] 뉴스레터 (뉴스별 요약 리스트)');
    console.log('  [2] 칼럼    (서론-본론-결론 통합 글)');
    while (true) {
      const input = (await ask(rl, chalk.cyan('> '))).trim();
      if (input === '1') return 'newsletter';
      if (input === '2') return 'column';
      console.log(chalk.yellow('1 또는 2를 입력해주세요.'));
    }
  } finally {
    rl.close();
  }
}

export async function promptConfirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const input = (await ask(rl, chalk.cyan(`${question} (y/n): `))).trim().toLowerCase();
      if (input === 'y') return true;
      if (input === 'n') return false;
      console.log(chalk.yellow('y 또는 n을 입력해주세요.'));
    }
  } finally {
    rl.close();
  }
}
