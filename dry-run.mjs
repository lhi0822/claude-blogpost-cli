import { config } from 'dotenv';
import { searchNews } from './dist/index.js';

// dist/index.js는 CLI 진입점이라 직접 import가 안 되므로
// 빌드된 서비스를 직접 require 방식으로 사용
config();

// dist는 CJS이므로 createRequire 사용
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { searchNews: search } = require('./dist/index.js');
