# 검은 고양이 체형 보완 검토 — 2026-10-07

[Issue #122](https://github.com/perspicacia/last-dismissal/issues/122), [명세](../specs/cat-shape-polish.md). 기준 `codex/stable-local-preview` / `8fa6c35`, 작업 `codex/cat-shape-polish`.

## 실제 문제와 수정

밝은 네 방향에서 다리 윗면의 평평한 돌출 단면, 측면에서 얇은 판 같은 귀, 별도 타원처럼 붙은 코를 확인했다. 기존 `black-cat.js` 코드 메시를 보완했다.

- 닫힌 다리 시작점을 몸통 내부로 옮기고 부드러운 굵기 변화·발목 구간을 추가했다. 단면 방향은 중심선의 접선을 따르며 기존 hip/knee/paw 관절·발 접지는 유지한다.
- 어깨·가슴·등/엉덩이의 연속 표면과 작은 턱/주둥이 비율을 다듬었다. 코 브리지는 머리 표면 안에서 연결하며 별도 타원을 제거했다.
- 귀를 실제 두께가 있는 닫힌 곡면으로 만들고 좌우를 반사했다. 안쪽 색은 같은 표면의 정점 색으로 연결한다. 첫 수정의 곡면/평면 교차는 캡처에서 발견해 제거했다.
- 검은 털·작은 금빛 눈/세로 동공·수염·올라간 꼬리와 비공격·음향 역할을 유지한다. Canvas의 몸통/머리·귀/다리 실루엣도 같은 비율로 보완했다.

## 실행과 검증

기존 127.0.0.1:8080 관리 서버를 재사용했다. 이 프로젝트가 실행 중인 **사용자 Mac의 Chrome**에서 아래 주소를 연다.

- 밝은 비교: `http://127.0.0.1:8080/tests/fixtures/character-review.html?character=cat&view=angle`. 사선은 수평 45도이며 후면 버튼도 제공한다.
- 복도/교실·얼굴·발/보행·동작 줄이기: `http://127.0.0.1:8080/tests/fixtures/cat-review.html`. Canvas는 `?compat`, 일반 플레이는 `/`다.

실제 설치된 Mac Chrome의 **독립 headless 프로필/SwiftShader**, 1440×1000/DPR1에서 검증했다. 사용자 GUI 창/탭/설정은 조작하지 않았다. 고정 카메라/경로·무음 출력·배경 시계/발견 위치는 개발용이며 전체 수동 보행·사용자 GPU/청감 확인을 뜻하지 않는다.

Git 제외 `artifacts/cat-shape-polish/`에 원자료와 캡처를 보관했다. `black-cat-before.js`는 기준 Git 코드의 진단 복사본이며 의존 모듈 경로만 옮겼다. `before-review.html`과 최신 fixture의 **동일 밝은 조명·카메라**로 전후 네 방향을 촬영했다.

| 검증 | 결과 / 근거 |
| --- | --- |
| 자동 검사 | 전체 `npm test` **254/254**, 고양이/이벤트/음향 **16/16 통과** |
| 새 표면 검사 | 다리 끝의 몸 내부 ray 판정·귀 깊이/대칭·머리/몸/귀/다리 폐쇄/유한 좌표·Canvas 네 방향 투영 통과 |
| 기존 보행 회귀 | 모든 보행 표본의 관절 길이·접지·.58m 여유·바닥 관통/재사용·등장 간격/정리 통과 |
| 밝은 전후 | `before-bright-{front,angle,side,back}.png`, `final-bright-{front,angle,side,back}.png`, `bright-comparison-evidence.json`. 예외 0 |
| 학교 표시 | `final-school-{front,side,close,room,contact,swing}.png`. 실제 ThreeSchool 조명/가구 사용. 예외 0 |
| 브라우저 보행 | 0.2/0.6/1.0/1.3/1.6/2.2/2.8초 표시·지지 발 세계 Y=.023, 3초 숨김·연속 시각 진행·동작 줄이기 전발 접지·Canvas 표시 통과. `gait-evidence.json` |
| 실제 컨트롤러 | 등장 타이머만 강제한 고양이 1마리/게임 계속 → 일시정지 정리 → 3-1 입장 정리 → 무용실 여고생 GAME OVER → 다시 하기 방문/고양이 0. 예외 0. `flow-evidence.json`, `flow-{cat,gameover,retry}.png` |
| 보존 | 사람 적용 JS·모든 PNG/GLB·고양이 관절/이벤트/음향·카메라/학교 등 32개 파일을 기준 Git과 바이트 비교해 전부 동일. `preserved-files.json` |
| 구문/공백 | 수정 JS·fixture 모듈 구문과 `git diff --check` 통과 |

느린 소프트웨어 렌더에서 한 프레임이 3초를 넘으면 보행 fixture가 시간을 버리던 문제도 보완했다. 간격을 제한하고 반복의 남은 시간을 보존한다. 개발 화면의 수정이며 일반 게임 시간/보행 규칙은 그대로다.

## 한계

전문 스캔/털·골격 자산이 아닌 코드 기반 근사다. 1마리 메시 **44→41**, 삼각형 **30,692→35,478**로 표면 해상도는 조금 증가했다. GPU 시간/FPS 측정이나 성능 개선으로 보고하지 않는다. 사용자 GUI 외형 채택·GPU 성능·청감은 미확인이다. 다음 작은 작업은 사용자 실제 플레이에서 남은 실루엣을 구체적으로 확인하는 것이다. 새 설치·사람 모델 적용·main 병합·배포는 하지 않았다.
