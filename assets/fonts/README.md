# 게임의 로컬 서체

- Lacquer Regular: `Lacquer-Regular.ttf`
- 라이선스: SIL Open Font License 1.1, 원문 `Lacquer-OFL.txt` 보관.
- 공식 원본: https://github.com/google/fonts/tree/main/ofl/lacquer
- 제작자 저장소/소개: https://github.com/Lacquer-Font/Lacquer
- 2026-10-03 Google Fonts 공식 저장소의 `Lacquer-Regular.ttf`를 수정 없이 내려받았다. 게임 실행에서는 외부 폰트/CDN에 접근하지 않고 이 로컬 파일을 사용한다.

손으로 그린 페인트 펜의 거친 가장자리와 흘러내리는 형태를 사용해 `LAST DISMISSAL`의 공포 표지 분위기를 표현한다. 본문·버튼은 시스템 서체를 유지한다. CSS에는 `font-display: swap`과 대체 서체가 있어 폰트 로딩 실패가 시작 동작을 막지 않는다.

## 칠판 한글 손글씨

- Nanum Pen Script Regular: `NanumPenScript-Regular.ttf`
- 제작: Sandoll Communications, 저작권 © 2010 NHN Corporation.
- SIL Open Font License 1.1: 원문 `NanumPenScript-OFL.txt` 보관.
- 공식 원본: https://github.com/google/fonts/tree/main/ofl/nanumpenscript
- 서체 소개: https://fonts.google.com/specimen/Nanum+Pen+Script
- 2026-10-04 Google Fonts 공식 저장소의 TTF와 OFL을 수정 없이 내려받았다. 글꼴 파일은 약 3.2MB이며 한글 전체를 포함한다. 게임 실행 중 외부 연결은 필요 없다.

`classroom-board.js`가 첫 칠판 생성 전에 로컬 글꼴을 읽는다. 분필 가루/농담은 Canvas로 그리며 원본 글꼴을 수정하지 않는다. 파일 로딩 실패는 시스템 cursive로 대체한다. UI 본문/버튼은 시스템 서체를 유지한다.
