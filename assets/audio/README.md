# 게임 효과음 출처

사용자가 지정한 레퍼런스 녹음을 게임 연출에 맞게 편집한 로컬 WAV다. 다운로드 확인일: 2026-10-02. 원본 MP3는 이 저장소에 포함하지 않는다.

| 게임 파일 | 원본·제작자 | 편집 |
| --- | --- | --- |
| `door-creak.wav` | [Opening Door — DRAGON-STUDIO](https://pixabay.com/sound-effects/film-special-effects-opening-door-450444/) | 원본 0~1.40초, 최대 피크 .65, 시작 5ms·끝 80ms 페이드 |
| `rabbit-scream.wav` | [Monstrous Scream — Alex_Jauk](https://pixabay.com/sound-effects/horror-monstrous-scream-187949/) | 원본 .38~1.26초, 최대 피크 .85, 시작 5ms·끝 70ms 페이드 |

두 파일 모두 48kHz·16-bit PCM·스테레오이며 재생 속도·음높이는 원본과 같다. 토끼 비명은 이빨을 드러내는 .55초부터 .88초 동안 재생해 게임 오버 전 끝난다. 기존 공통 음량(master 50% 기본)·음소거가 적용되며, 문과 비명의 효과별 gain은 .27/.58로 유지했다.

두 원본 페이지에서 Pixabay Content License 적용을 확인했다. [라이선스 요약](https://pixabay.com/service/license-summary/), [전체 이용 조건](https://pixabay.com/service/terms/)을 참고한다. 무료 이용·수정이 허용되지만 음원 자체의 독립 재판매·재배포에는 제한이 있다. 이 파일은 게임 연출의 구성 요소이며 별도의 음원 배포용이 아니다. 제작자 표시는 의무 여부와 별개로 출처 확인을 위해 남긴다.

편집은 `scripts/prepare-reference-sounds.py`로 재현한다. macOS의 `afconvert`로 원본 MP3를 48kHz 16-bit PCM WAV로 변환한 뒤 실행한다. 이 준비 과정은 개발용이며 일반 실행·검증에는 Python 표준 라이브러리와 Node.js만 사용한다. 로컬 파일 로딩이 실패하면 `sound-effects.js`의 기존 합성음으로 대체한다.
