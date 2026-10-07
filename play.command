#!/bin/zsh -l
cd -- "${0:A:h}" || exit 1
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js를 찾을 수 없습니다. Node.js가 있는 터미널에서 npm run preview를 실행하세요.'
  exit 1
fi
node scripts/preview.mjs open
