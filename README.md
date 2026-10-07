# 마지막 하교

학교를 배경으로 한 생존 공포게임. 목표는 짧은 플레이로 규칙과 분위기를 전달하는 것이다.

시작 화면은 토끼·교복 여고생 귀신·금발 인형·긴 머리 귀신·음악실 남자아이·얼굴 없는 학생을 모은 어두운 학교 포스터다. 여섯 캐릭터가 함께 등장하고, 영문 게임명 `LAST DISMISSAL`을 거친 페인트 펜 느낌의 Lacquer 서체로 표시한다. 제목과 시작·음향 조작만 남기며 화면 크기에 맞춰 캐릭터 배치를 바꾼다. [첫 화면 명세](specs/horror-title-screen.md), [서체 출처·OFL 라이선스](assets/fonts/README.md).

## 실행

프로젝트 폴더에서 `npm run preview`를 실행하거나 Mac Finder에서 `play.command`를 두 번 클릭하면 서버 상태를 확인한 뒤 **Mac의 Chrome**으로 게임을 연다. 플레이 주소는 아래 하나다. 앱 미리보기/파일 링크에서 오류가 나면 Chrome 주소창에 직접 입력한다.

```text
http://127.0.0.1:8080/
```

`npm start`는 Chrome을 열지 않고 서버만 준비한다. 정상 서버는 재사용하고 서버가 없으면 프로젝트 루트에서 독립된 관리 프로세스로 시작한다. **새 관리 서버는 실행 명령/터미널이 끝나도 유지된다.** Mac 재부팅 뒤에는 다시 실행한다. 로그인 항목이나 LaunchAgent를 추가하지 않는다. 기존 Python 서버를 재사용한 경우 수명은 기존 실행 방식에 따른다.

브라우저 실행은 저장소의 `vendor/` 모듈을 사용하므로 CDN 연결이나 추가 패키지 설치가 필요 없다. Node.js가 필요하며 게임 의존성을 다시 설치할 때만 `npm ci`를 사용한다. HTML 파일을 직접 열면 ES 모듈 제한 때문에 실행되지 않을 수 있으므로 위 서버 주소를 사용한다.

| 상황 | 실행 명령 |
| --- | --- |
| 게임 열기 / 서버가 없으면 복구 | `npm run preview` |
| 서버·현재 페이지/게임 모듈 응답 확인 | `npm run preview:status` |
| 자체 관리 서버 재시작 | `npm run preview:restart` |
| 자체 관리 서버 종료 | `npm run preview:stop` |
| 최근 서버 로그 확인 | `npm run preview:logs` |

관리 서버는 `.preview/`에 PID/인스턴스 정보와 로그를 남기고, 요청마다 최신 파일을 읽으며 캐시를 막는다. 코드를 수정한 뒤 Chrome에서 새로고침하면 된다. 재시작도 같은 8080 주소를 사용한다. 다른 프로젝트가 이 포트를 쓰거나 파일이 다르면 자동 종료/포트 변경을 하지 않고 오류를 알린다. 종료·재시작은 상태 파일과 실제 서버 인스턴스가 일치하는 자체 서버만 대상으로 한다.

`ERR_CONNECTION_REFUSED`가 나오면 `npm run preview`로 복구한다. **‘이 클라우드 파일을 불러오지 못했습니다’는 별도의 앱 파일 로딩 메시지**이며 프로젝트 서버 명령으로 앱 자체 파일/로그인 상태를 복구할 수는 없다. Chrome 직접 실행과 앱 미리보기의 성공 여부를 구분한다. 실행 명령 성공만으로 실제 플레이 성공을 판단하지 않는다. [미리보기 명세](specs/stable-local-preview.md), [실제 반복 검증과 한계](docs/local-preview-review.md).

- 일반 플레이: 3-1·3-2·3-3 교실·음악실·무용실을 둘러본다. 교복 여고생 귀신은 매번 무작위 방에 숨어 있고 시작 시 보이지 않는다. [공격자 교체 명세](specs/schoolgirl-attacker.md). 토끼는 3-1에 별도로 서 있으며 가까이 응시하면 이빨 표정을 보여도 게임 오버는 일으키지 않는다. [토끼 등장 명세](specs/rabbit-presence.md).
- WASD 이동(W/S 전후, A/D 옆걸음), 마우스 상하/좌우 시점. 시작/계속 클릭으로 마우스 잠금을 요청하고, 제한된 브라우저에서는 화면 드래그를 사용한다. ↑↓ 이동·←→ 느린 회전, Page Up/Down 위아래 보기·Home 정면 복귀도 지원한다. 가까운 문에서 E/클릭/입장 버튼, 안에서는 E/복귀 버튼으로 돌아간다.
- 걷는 중 카메라 높이를 고정하고 소품/계단 자동 시점과 흔들림을 없앴다. Esc 또는 일시정지 버튼으로 탐색/음향을 멈추고 커서를 해제한다. 일시정지 창에서 좌우/상하 감도(기본 65%/32.5%)를 따로 조절하거나 ‘상하 시점 고정’으로 정면 높이에서 좌우만 둘러볼 수 있다. 설정은 재시작과 새로고침에서도 유지하며 저장이 차단되면 기본값으로 진행한다. 포커스 이탈/잠금 해제도 일시정지하며 기존 위치/방문/귀신 배치를 유지한다. [최신 접근성 명세](specs/accessible-camera-controls.md), [기존 조작 명세](specs/mouse-look-comfort.md).
- 영역 캡처가 필요하면 **P → Mac ⌘⇧4 / Windows Win+Shift+S → 영역 선택** 순서로 사용한다. P 또는 Esc 메뉴의 ‘화면 캡처’는 장면·이벤트·소리를 고정하고 커서 잠금/드래그를 해제한다. 캡처 도구로 포커스가 바뀌어도 유지하며 P/계속하기로 재개한다. OS 단축키가 브라우저에 전달되면 자동 고정하지만 환경에 따라 P를 먼저 누르는 편이 확실하다. [캡처 명세](specs/capture-cursor-release.md).
- 방 안쪽에 3m 이내로 접근해 수평/수직으로 바라보면 패배가 확정되고 교복 여고생 귀신이 기본 표정으로 나타난 뒤 다가오면서 비명 표정으로 바뀐다. 두 표정 이미지가 준비되기 전에는 공격하지 않는다. 1.5초 연출 후 게임 오버가 된다. 귀신을 만나기 전 시간만으로 패배하지 않는다.
- 모든 방이 탐색 대상이다. 먼저 여고생 귀신을 만나면 탐색이 끝나며 현재 버전에는 탈출 승리가 없다.
- 금빛 눈의 검은 고양이가 복도·교실 앞쪽 안전한 통로에서 잠깐 경계한 뒤 바닥을 딛고 약 3초간 가속·감속하며 지나간다. 간헐적으로 하악질과 앙칼스러운 울음이 들리고 고양이를 만나도 게임은 계속된다. [외형·보행·울음 명세](specs/black-cat-polish.md).
- 복도 끝 계단 앞에 0.3초 머물면 아래층의 쇠 긁는 소리 뒤에 발소리가 점점 빠르게 다가오고 무겁게 울린다. 새 게임당 한 번이며 음소거 중에도 소비한다. 일시정지/교실 진입/종료에는 중지하고 새 공격·카메라 흔들림은 추가하지 않는다. [계단 연출 명세](specs/stair-haunt.md).
- 종료 화면에는 `GAME OVER`와 `다시 하기` 버튼을 표시한다. 클릭 또는 Enter/Space로 새 게임을 시작하고 방문 기록·배치·공격 연출을 초기화한다. 종료 화면에서 Escape는 처음 화면, 플레이 중 Escape는 일시정지다. M은 음소거다. [종료 화면 명세](specs/game-over-screen.md).
- `npm test`: 발견 거리/응시·무작위 배치·방 이동/충돌·렌더·음향과 이전 규칙 회귀 검증. 현재 명세는 [specs/hidden-rabbit-rooms.md](specs/hidden-rabbit-rooms.md).

## 저장소 구성

게임 소스는 프로젝트 루트에 있으며, 자산·문서·검증·모델 제작 도구는 폴더별로 나눈다. 아래 트리는 주요 파일만 표시한다.

```text
last-dismissal/
├── index.html                 # 게임 페이지와 화면 요소
├── style.css                  # 시작·플레이·종료 화면 스타일
├── game.js                    # 게임 시작, 화면 전환, 종료와 재시작
├── schoolgirl-attacker.js       # 여고생 표정·돌진 위치·원본 비율 공유
├── exploration.js             # 교실 탐색, 방문 기록, 숨은 여고생 귀신 발견
├── corridor.js                # 복도 이동과 렌더 연결
├── classroom.js               # 교실 이동과 Canvas 호환 화면
├── three-school.js            # 학교 실내 3D 화면
├── three-outdoors.js          # 창밖 풍경 3D 화면
├── school-tone.js             # 학교 색감·벽 얼룩·공유 화면 채도
├── school-surfaces.js         # 공유 색·노멀·거칠기 맵과 반사 환경
├── school-colliders.js        # 복도 책상 렌더·이동의 공유 치수
├── static-furniture.js        # 반복 책상·의자 인스턴싱
├── render-metrics.js          # 개발용 CPU 제출·프레임 간격 측정
├── shader-warmup.js           # 첫 화면의 방별 비동기 셰이더 준비
├── texture-warmup.js          # 첫 화면의 한 장씩 텍스처 업로드
├── board-photo.js             # 얼굴을 지운 게시판 사진·낡은 인화지 질감
├── camera-preferences.js      # 축별 감도·상하 고정 설정과 로컬 저장
├── audio.js                   # 음량·음소거와 효과음 재생
├── …                          # 입력·캐릭터·소품·공포 연출의 JS 모듈
├── assets/                    # 게임 자산과 출처 문서
│   ├── *.png                  # 캐릭터와 사진 이미지
│   ├── audio/                 # 문·공격자 비명의 WAV와 출처
│   ├── fonts/                 # 제목·칠판 서체와 라이선스
│   └── models/                # 음악실 남자아이 몸통 GLB·개발용 인형 시안
├── vendor/                    # 로컬 Three.js 모듈·로더와 라이선스
├── tests/
│   ├── *.test.js              # 판정·이동·연출·음향 등의 자동 테스트
│   └── fixtures/              # 브라우저에서 비교·플레이하는 개발용 화면
├── docs/
│   ├── PRD.md                 # 게임 목적과 현재 개발 범위
│   ├── progress.md            # 완료 작업, 검증 결과와 남은 과제
│   └── worklogs/              # 역할별 작업·검토 기록
├── specs/                     # 기능별 요구사항과 완료 조건
├── modeling/                  # 무료 인체 원본·앉은 자세 변환·GLB 제작 도구
├── scripts/                   # 레퍼런스 효과음 편집 도구
├── package.json               # 실행·테스트·모델 생성 명령과 의존성
├── package-lock.json          # npm 의존성 버전 고정
├── AGENTS.md                  # 작업 규칙과 역할 분담
├── CHARACTERS.md              # 캐릭터 설정
└── README.md                  # 프로젝트 소개, 실행 방법과 구조
```

| 역할 | 주요 파일 | 담당 내용 |
| --- | --- | --- |
| 게임 진행 | [game.js](game.js), [exploration.js](exploration.js) | 시작·일시정지·게임 오버·재시작, 방별 귀신 배치와 발견 판정 |
| 이동·조작 | [movement.js](movement.js), [mouse-controls.js](mouse-controls.js), [camera-preferences.js](camera-preferences.js), [capture-controls.js](capture-controls.js) | 이동·충돌, 축별 마우스 감도·상하 고정·키보드 시점/저장, 영역 캡처 조작 |
| 공간·조명 | [three-school.js](three-school.js), [three-outdoors.js](three-outdoors.js), [school-lighting.js](school-lighting.js), [school-tone.js](school-tone.js), [school-windows.js](school-windows.js), [stairs.js](stairs.js) | 실내·창밖 3D 공간, 조명 점멸·색감, 창문과 계단 |
| 교실 소품 | [room-props.js](room-props.js), [classroom-board.js](classroom-board.js), [music-instruments.js](music-instruments.js), [music-sheet.js](music-sheet.js) | 방별 소품과 충돌 범위, 칠판·분필, 악기·악보 |
| 캐릭터 외형 | [schoolgirl-attacker.js](schoolgirl-attacker.js), [doll-volume.js](doll-volume.js), [ghost-figures.js](ghost-figures.js), [piano-boy-volume.js](piano-boy-volume.js), [piano-boy-body.js](piano-boy-body.js), [character-shape.js](character-shape.js), [rabbit-pose.js](rabbit-pose.js), [rabbit-appearance.js](rabbit-appearance.js), [black-cat.js](black-cat.js), [cat-gait.js](cat-gait.js) | 원본 이미지 기반 인형의 두께, 무료 인체 기반 남자아이 몸통, 곡면 인물·고양이, 여고생 공격 표정·원본 비율과 고양이 접지 보행·토끼 원본 외형 보존 |
| 공포 이벤트 | [room-hauntings.js](room-hauntings.js), [schoolgirl-attacker.js](schoolgirl-attacker.js), [rabbit-arrival.js](rabbit-arrival.js), [rabbit-presence.js](rabbit-presence.js), [cat-event.js](cat-event.js), [stair-haunt.js](stair-haunt.js) | 교실 분위기 연출, 여고생 돌진, 3-1 토끼의 비공격 등장·근접 표정, 무작위 고양이와 계단 접근 이벤트 |
| 음향 | [audio.js](audio.js), [sound-effects.js](sound-effects.js), [recorded-effects.js](recorded-effects.js), [cat-voice.js](cat-voice.js), [stair-haunt-sound.js](stair-haunt-sound.js) | 공통 음량·음소거, 합성음과 로컬 녹음, 고양이·계단 효과음 |
| 개발용 모델 | [student-model.js](student-model.js), [character-assets.js](character-assets.js), [modeling/](modeling/) | 정적 시안·원본 기준 리깅 후보 제작, 전체 GLB 계층/스킨/클립 로딩과 독립 인스턴스. 일반 게임은 원본 PNG 기반 외형 사용 |
| 이전 규칙 | [survival.js](survival.js), [logic.js](logic.js) | 이전 생존·관찰 버전의 회귀 검증용 보존 모듈 |

복도 게시판은 얼굴을 검게 지운 기존 단체사진 초안을 사용한다. [board-photo.js](board-photo.js)는 바랜 누런 색, 모서리 얼룩·긁힘과 닳은 인화지 테두리를 한 번 생성해 Three.js/Canvas에서 공유한다. 원본 PNG·사진 크기/위치는 보존하며 이전 관찰 모드의 정상/이상 사진은 별도로 유지한다. [명세](specs/aged-erased-photo.md), [브라우저 비교 화면](tests/fixtures/board-photo-review.html).

처음 살펴볼 때는 [기획과 범위](docs/PRD.md) → [현재 게임 규칙](specs/hidden-rabbit-rooms.md) → [게임 진입 코드](game.js) → [작업·검증 기록](docs/progress.md) 순서로 읽으면 된다. 자동 테스트는 `npm test`로 실행하며, `tests/fixtures/`는 일반 게임과 구분된 개발용 확인 화면이다.

## 음향 기획

검은 고양이의 최신 체형은 [표면 연결 보완 명세](specs/cat-shape-polish.md)를 따른다. [밝은 정면·45도·측면·후면 비교](tests/fixtures/character-review.html?character=cat&view=angle)와 [실제 복도/교실 보행](tests/fixtures/cat-review.html)에서 확인한다. 다리 시작점을 몸 안으로 연결하고 귀의 두께·가슴/주둥이 표면과 Canvas 실루엣을 보완했다. 기존 검은 털·금빛 눈·접지 보행·3초 등장·음향·비공격 역할을 유지한다. [검증 근거와 한계](docs/cat-shape-review.md).

고양이 외형은 `black-cat.js`에서 참고 모델의 둥근 가슴/몸·작은 금빛 눈·넓은 삼각 귀·위로 선 꼬리를 코드로 표현한다. 목과 몸을 하나의 곡면으로 연결하고 다리 표면은 공유 관절을 따라 연속적으로 변형한다. [최신 외형 명세](specs/cat-boy-likeness.md). 무작위 등장/이동은 `cat-event.js`, 발 접지와 두 관절 보행은 `cat-gait.js`, 하악질/울음 파형은 `cat-voice.js`가 담당한다. `tests/fixtures/cat-review.html`에서 정면/측면·복도/교실의 연속 보행과 동작 줄이기를 비교할 수 있다.

교실 창문은 작은 위 유리칸과 큰 아래 유리칸이 있는 목재 미닫이창이다. 3-3·무용실 귀신은 창살 대신 유리 중앙에 얼굴이 보이도록 정렬한다. `school-windows.js`는 두 렌더 방식이 공유하는 치수/창틀, `cat-event.js`는 안전 경로·무작위 시간, `black-cat.js`는 입체 고양이/Canvas 실루엣을 맡는다. 고양이는 10~22초 간격으로 약 3초간 등장하며 안전한 통로가 없으면 기다린다. 동작 줄이기에서는 이동 없이 나타났다 사라진다. [창문·고양이 명세](specs/windows-black-cat.md), [최신 외형·보행 명세](specs/black-cat-polish.md).

큰 소리로 놀라게 하기보다, 익숙한 공간이 낯설어지는 분위기를 만든다.

1. 시작 화면: 무음. 사용자가 시작 버튼을 누른 뒤에만 오디오를 켠다.
2. 복도: 낮은 드론과 형광등 소리. 드론은 작게 유지하고 장시간 들어도 부담이 적도록 한다.
3. 교실 입장: Opening Door(DRAGON-STUDIO)의 앞부분을 편집한 1.4초 목재 마찰/끼익 소리가 한 번 난다. 교실에서 12~22초 간격으로 먼 아기 울음이 들리고 나가거나 종료하면 정리한다.
4. 실제 이동: 목재 바닥을 밟는 충격과 신발 마찰음. 교실은 복도보다 작게 재생한다.
5. 인형 등장: 발견 후 .55초에 이빨을 드러낼 때 Monstrous Scream(Alex_Jauk)의 중간 부분을 편집한 .88초 괴물 비명을 한 번 재생한다. 원본 음높이를 유지하며 게임 오버 전에 잦아든다. 음량/음소거 공통 적용.
6. 창밖 귀신: 3-3·무용실 창가에서 접근해 응시하면 미소와 함께 짧은 여자 웃음 계열 합성음이 방문당 한 번 난다. 재응시만으로 반복하지 않고 방을 나갔다 다시 입장하면 재설정한다.
7. 이전 탈출 화음은 회귀용으로 보존한다.
8. 계단: 복도 끝 `z >= 22.1` 접근 후 약 3.6초의 쇠 마찰·가속하는 발소리·발 구름/계단 메아리를 한 번 재생한다. 발생 시 아래층 계단의 좌우 방향을 반영하고 전체 음량/음소거를 따른다. 소리 없이도 이벤트는 소비되며 방 이동/일시정지/종료에서 한 버퍼 전체를 취소한다.
9. 고양이: 9~21초 간격과 등장 시 한 번씩 짧은 하악질 뒤 올라갔다 갈라지는 날카로운 울음 합성음을 재생한다. 세 음색과 짧은 반사음을 사용하며 같은 시점의 중복 울음은 합치고 음소거 중에는 신호를 소비해 해제 후 밀린 소리가 나지 않는다. 방 이동/종료 시 정리한다.

배경음·발소리·아기 울음·귀신 웃음은 Web Audio 합성음이다. 문·공격자 비명은 사용자 레퍼런스를 편집한 `assets/audio/`의 로컬 WAV를 우선 사용한다. 시작 후 미리 디코딩하고 캐시하며, 로딩 실패/미완료 시 기존 합성음으로 대체한다. 실행 중 외부 사이트 연결은 필요 없다. [출처와 편집·이용 조건](assets/audio/README.md), [최신 명세](specs/reference-horror-audio.md). 음소거와 음량 조절을 제공하고, 소리가 없어도 판정 가능하도록 설계한다.

노트북 스피커에서도 들리도록 196~349Hz의 드론과 24초 반복 선율을 함께 사용한다. 기본 음량은 50%다. 시작 전에는 음악이 재생되지 않는다. 오디오 오류나 플레이 중 중단이 발생하면 ‘소리 확인’ 버튼을 표시해 오디오를 다시 시작하고 확인용 종소리를 재생한다. 상태는 브라우저의 오디오 실행 여부이며 기기나 브라우저 자체의 음소거 여부까지 확인하지는 않는다.

## 범위와 이후 개선

Three.js로 학교 실내와 거리별 창밖 공간을 표현한다. 일반 게임의 공격자는 작은 마른 혈흔이 있는 하얀 가면 같은 얼굴·가느다란 눈·남색 세일러복의 여고생 귀신이다. 기본/공격 표정의 새 투명 PNG를 공간 안의 빌보드로 이동시키며 원본 비율을 보존한다. 관절형 3D 모델은 아니다. 발견 .55초에 비명 표정/기존 녹음 효과음으로 전환하고 1.5초 뒤 게임 오버가 된다. 토끼용 팔 분할·피 얼룩은 새 인물에 적용하지 않으며 과거 토끼 자산/비교 모듈은 보존한다. [최신 공격자 명세](specs/schoolgirl-attacker.md), [최신 외형 명세](specs/masked-schoolgirl-ghost.md), [자산·최종 프롬프트](assets/schoolgirl-mask-stained.md). 음악실에는 피아노·악보·보면대, 무용실에는 벽 거울·연습 바·스피커를 배치한다. 거울의 실시간 플레이어 반사는 후속 범위다.

학생 인형은 3-2 바닥과 3-1 책상의 장식이다. 음악실 피아노 의자에는 창백한 어린 남자아이 귀신이 앉아 있다. 새 GLB 시안이 원본과 너무 다르다는 피드백으로 일반 게임은 모든 방에서 기존 PNG 기반 2.5D 외형을 유지한다. 원본 얼굴·유리 눈·금발 컬·세일러복이 외형 기준이다. [최신 외형 명세](specs/student-doll-original-look.md). 3-3과 무용실에는 공격하지 않는 창밖 귀신을 배치한다. 방 확장은 [specs/classrooms-doll-depth.md](specs/classrooms-doll-depth.md), 보존된 모델 시안은 [specs/student-doll-glb.md](specs/student-doll-glb.md)다. 원본과 닮은 실제 3D 모델·표정/기립 애니메이션과 창밖 귀신 공격·탈출 조건은 후속 범위다.

## 3D 화면과 검증

- 최신 색감은 그림자복도 공식 화면의 따뜻한 국소 조명과 어두운 공간 대비를 학교에 적용했다. 누런 전등, 청회색 창가/암부, 낮은 채도와 고정된 벽 얼룩을 사용한다. 노출 0.76, 주변광 0.28(3-3은 0.22), 달빛 0.35, 천장등 6.0·범위 9m로 바닥과 문/가구 경계를 살린다. `school-tone.js`의 팔레트·Canvas 채도는 두 렌더가 공유하고 UI 글자는 별도로 유지한다. 첫 화면/종료 배경도 같은 색감으로 연결한다. [학교 톤 명세](specs/shadow-corridor-tone.md).
- 토끼 외형에는 원본 털 무늬/투명도를 보존하는 결정적인 피 번짐을 겹친다. 3-1 교실의 비공격 등장과 첫 화면에 유지하며 게임 오버 공격은 여고생 귀신이 담당한다. [토끼 등장 복구](specs/rabbit-presence.md). 원본 PNG 파일은 수정하지 않는다. [피 얼룩 토끼 명세](specs/darker-school-blood-rabbit.md).
- 밤 학교의 기본 노출·주변광·천장등을 낮췄다. 복도 다섯 전등은 위치마다 다른 시점에 약 1~2초간 꺼졌다 켜지고, 교실은 고정 조명이다. 새 게임은 점멸 시계를 초기화하며 동작 줄이기 환경에서는 고정 조명으로 표시한다. [조명 명세](specs/horror-lighting.md), 개발용 비교 `http://127.0.0.1:8080/tests/fixtures/lighting-review.html` (`?compat`는 Canvas 호환).
- Three.js 0.186.1 (MIT). `package-lock.json` 버전을 고정하고 배포 모듈·라이선스를 `vendor/`에 보관한다. 라이브러리 갱신 시 `npm ci` 후 `node_modules/three/build/three.module.js`, `three.core.js` 및 LICENSE를 vendor에 동기화한다.
- WebGL2 지원 브라우저가 필요하다. 3D 초기화 실패 시 기존 Canvas 화면으로 전환하며 시작 화면에 호환 화면 안내를 표시한다. 모바일 성능은 별도 확인이 필요하다.
- 공격자 여고생·3-1 토끼·창밖 귀신은 투명 이미지의 빌보드다. 공간·가구·나무·계단의 3D 전환과 캐릭터 모델링 완료를 구분한다.
- 3D 정상/이상 비교: `http://127.0.0.1:8080/tests/fixtures/three-review.html`. 이 개발용 화면의 버튼은 일반 게임에 표시되지 않는다.
- 실제 탐색 UI/컨트롤러 검증: `http://127.0.0.1:8080/tests/fixtures/three-flow.html`. `?compat`를 붙이면 WebGL 실패를 강제해 Canvas 호환을 확인한다.

학교의 벽·목재·금속은 공유 색/노멀/거칠기 맵을 사용한다. 주요 천장등 한 개씩 실내 그림자를 계산하고 복도 소등 신호를 함께 따른다. 문·바닥·책상/의자의 마모와 재질 차이를 표현하며, 반사 환경은 작은 절차적 조명 근사다. 반복 교실 가구는 치수·회전을 유지하는 인스턴싱으로 그린다. 복도 책상은 보이는 치수와 같은 이동 충돌을 사용하고 표정 텍스처는 재사용한다. 재시작 때 교체되는 시계 맵은 해제한다. [명세](specs/3d-quality-upgrade.md), [검증 결과와 남은 외형 과제](docs/3d-quality-review.md).

재질·그림자·성능 비교: `http://127.0.0.1:8080/tests/fixtures/quality-review.html`. 표면 노멀/거칠기와 첫 전등 소등을 비교하고, `?legacyFurniture`로 같은 가구의 개별 렌더와 인스턴싱을 비교한다. CPU 제출 시간은 GPU 시간이 아니며 textures/geometries는 바이트가 아닌 개수다. 처음 장면의 준비 비용이 지난 뒤 120 samples에서 비교한다. 실제 컨트롤러의 개발용 경로는 `three-flow.html?safe&silent&activeClock&quality`다. 공격자 방을 무용실로 고정하고 소리 출력을 차단하며 포커스 우회 시계·위치 버튼을 제공한다. 일반 `/`에는 이 설정/버튼이 적용되지 않는다.

첫 화면에서는 방별 셰이더를 비동기로 하나씩 준비하고, 준비된 이미지 맵은 `initTexture`로 한 장씩 올린다. 시작을 기다리게 하지 않고 플레이/일시정지/캡처/숨김 탭에서는 다음 준비를 멈춘다. 셰이더 컴파일 중에는 새 업로드를 시작하지 않는다. 늦은 이미지/교체된 맵을 갱신하며 미지원/실패 시 일반 렌더를 유지한다. 준비 비용과 GPU 자원 확보 시점이 첫 화면으로 이동하므로 메모리 절약을 뜻하지 않는다.

첫 제출 비교는 `http://127.0.0.1:8080/tests/fixtures/shader-warmup-review.html`(텍스처 준비를 끈 셰이더 비교)과 `http://127.0.0.1:8080/tests/fixtures/texture-warmup-review.html`(셰이더를 준비한 텍스처 비교)이다. 각각 `?cold`는 해당 준비만 끄며 시스템/드라이버 캐시를 비운 상태를 뜻하지 않는다. 같은 새 페이지에서 준비 완료 후 방 하나를 처음 그려 CPU 제출·실제 업로드 호출을 비교한다. 깊이/그림자 패스·geometry 업로드·미리 준비하지 않은 표정 맵의 비용과 저사양 장치 검증은 남아 있다.

3-3 칠판 옆 오른쪽 구석에는 얼굴 없는 교복 학생이 정적으로 서 있다. 기존 인형과 같은 실사풍 재질의 새 투명 PNG를 사용하고 원본 비율/발 접촉을 유지한다. 해당 위치만 관통을 막으며 중앙 통로·책상/의자 충돌과 여고생 귀신 발견 규칙은 유지한다. 첫 화면에도 함께 등장한다. [추가·점검 명세](specs/faceless-student-upgrade.md), [자산/생성 프롬프트](assets/faceless-student.md). 현재 Three.js에서는 정면 사진을 닫힌 3D 인체 메시와 연결하며 Canvas는 기존 사진 투영을 유지한다. 한 장의 사진 기반 근사 모델이므로 측면 디테일의 한계는 남는다. [최신 입체 외형 명세](specs/classroom-character-depth.md).

교실 금발 인형: 현재 탐색 플레이에서는 바닥에 누워 있는 장식이다. 이전 이상현상 기립 연출은 개발용 비교 화면에서 보존한다. [상세 조건](specs/classroom-doll.md).

일반 교실 칠판은 로컬 Nanum Pen Script 손글씨에 분필 입자·불균일한 농담·작은 획 끊김·지우개 자국을 더한다. 반 이름과 당번 문구는 유지한다. 방별 고정 질감을 한 번 만들어 Three.js/Canvas가 공유하고 게임 난수는 소비하지 않는다. 서체 실패 시 시스템 서체로 표시한다. [글씨 명세](specs/chalkboard-writing.md), [서체 출처·라이선스](assets/fonts/README.md).

학생 인형의 기본 2.5D 화면은 `doll-volume.js`에서 기존 사진의 XY·UV 비율을 보존하는 닫힌 메시로 만든다. 머리·몸·팔다리의 깊이를 구분하고 머리 앞뒤를 둥글게 연결한다. 일반 게임과 기본 교실 비교에 사용하고, Canvas 호환은 기존 이미지를 렌더한다. 최신 [원본 입체 보완 명세](specs/character-original-depth.md)는 이전 14cm 균일 깊이와 평면 얼굴 기준을 대체한다. 낮은 측면·후면을 사진과 동일한 실제 인체로 복원한 것은 아니다.

남자 마네킹(얼굴 없는 학생)은 턱·어깨·소매·바지를 연속 곡면으로 연결하고 원본 사진을 앞에 유지한다. 앉은 여학생은 긴 검은 머리·교복·흰 양말을 유지하며 얇은 머리카락 결·접힌 치마와 좌석 접촉을 갖는다. 검은 고양이는 연결된 몸·머리·좁은 코·작은 금빛 눈을 사용하며 기존 두 관절 보행은 유지한다. `tests/fixtures/character-review.html`에서 음악실 남자아이를 포함한 다섯 외형의 정면/사선/측면·낮은 시점과 고양이 보행을 비교한다. 음악실 남자아이는 후면과 원본 얼굴을 확대해 정면/양쪽 사선으로도 비교할 수 있다. 이 화면의 밝은 비교 조명과 버튼은 일반 게임에 적용하지 않는다.

개발용 GLB 비교는 `http://127.0.0.1:8080/tests/fixtures/room-review.html?model=glb`에서 명시적으로 선택한다. 일반 실행에서는 GLB를 자동 로딩/대체하지 않는다. `student-model.js`는 이 비교에서 로컬 `GLTFLoader`로 `assets/models/student-doll.glb`를 읽는다. 1.55m 정적 모델이며 실제 누운 경계로 바닥 높이를 계산한다. 원본보다 단순한 시안으로 리깅/새 표정은 없다. 자산에는 메시·PBR 재질·절차적 천/머리 무늬가 포함되며 추가 캐릭터 이미지는 생성하지 않았다.

모델 재생성은 `npm ci` 후 `npm run model:student`다. `modeling/student-doll.js`가 조형/재질 소스이고 `modeling/build-student-doll.mjs`가 Three.js GLTFExporter로 내보낸다. 일반 플레이에는 Node 또는 모델링 도구가 필요 없다. [자산 정보](assets/models/README.md). 개발용 정면/양옆/후면/누운 자세 확인: `http://127.0.0.1:8080/tests/fixtures/student-model-review.html`.

새 원본 기준 리깅 후보는 `http://127.0.0.1:8080/tests/fixtures/reference-character-review.html`에서 비교한다. 원본 사진을 보존한 닫힌 머리와 별도 의상/사지, 17개 뼈·웨이트, 두 관절 확인 동작을 포함한다. 밝은 정면/사선/측면/후면/얼굴/누운 자세와 학교 조명을 제공한다. 머리 앞면은 사진 기반이며 보이지 않는 옆/뒤·몸/의상은 근사다. 전 방향 얼굴/머리카락 복원이나 일반 게임의 캐릭터 교체 완료로 보지 않는다. 생성은 기존 Node 의존성이 준비된 환경에서 `npm run model:reference-student`, 검증은 `node --test tests/character-assets.test.js tests/3d-quality.test.js`다. [출처·재생성·한계](assets/models/student-reference-rig.md).

교실 공포 연출: [명세](specs/classroom-hauntings.md). 3-1 창밖 공은 창을 바라볼 때만 튀며, 3-2 뒤 오른쪽 구석에 웅크린 그림자가 있다. 3-3·무용실 귀신은 창가 2.2m 이내에서 응시하면 미소와 고개 기울임을 보인다. 공격자는 새 교복 여고생 귀신 하나이며 귀신 연출은 패배를 일으키지 않는다. 동작 줄이기에서는 공은 정지하고 미소만 표시한다.

음악실 소품은 `music-instruments.js`의 곡선 통기타·88건반 목재 업라이트 피아노와 `music-sheet.js`의 창작 악보로 보완했다. 열린 악보에는 오선·음자리표·마디·빔·슬러·제본을 그리며, 보면대의 악보 면은 연주자 의자 방향이다. `ghost-smile-shape.js`는 3D/Canvas가 공유하는 곡선 입과 위아래 날카로운 치아를 정의한다. 소품은 완전한 사진 재현이 아니며, 악보는 외부 악곡을 복제한 것이 아닌 분위기용 창작 기보다.

누운 인형의 찌그러짐 피드백으로 [실제 3D 전환 진단](docs/student-doll-3d-plan.md)과 정적 GLB 시안을 만들었다. 사용자는 시안의 외형 차이를 지적해 원본 모습 복구를 요청했다. 후속 모델은 원본과 닮은 정면/양옆/누운 외형을 검토한 뒤 게임에 적용한다.

녹음 효과음의 개발용 확인 화면은 `http://127.0.0.1:8080/tests/fixtures/reference-audio-review.html`이다. 검증 버튼은 장치 출력을 차단한 그래프에서 디코딩·호출·음소거·종료를 확인하며 실제 청감 확인은 파일 플레이어로 한다. 실제 게임 컨트롤러 검증은 `tests/fixtures/three-flow.html?safe&silent`에서 공격자를 무용실에 고정하고 소리 출력 없이 할 수 있다. 일반 플레이에는 이 검증 버튼/설정이 없다.

음악실 의자의 새 귀신은 [명세](specs/piano-boy-ghost.md)에 따라 짧은 검은 머리·낡은 밝은 옷·맨발의 어린 남자아이로 교체했다. [원본 투명 PNG와 프롬프트](assets/piano-boy-ghost.md)는 보존한다. 정적인 분위기 요소이며 별도 공격·소리·표정 변화는 없다. 현재 Three.js는 Quaternius Standard의 무료 CC0 인체에서 원작 머리를 제외한 로컬 `piano-boy-body.glb`를 불러온다. 어린아이 비율과 무릎 위 손·앉은 허벅지·종아리로 변형해 엉덩이는 의자 위, 맨발은 바닥에 맞췄다. 얼굴의 눈·코·입·턱 사진 비율을 보존한 앞면과 둥근 뒷머리를 실제 몸통에 연결하고, 원본 의상은 앞면에만 투영한다. 상의/소매와 반바지는 인체와 분리된 느슨한 입체 표면으로 보완했다. 손목/무릎/종아리 비율과 발가락을 조정하고 원본의 손 사진을 바지에 중복하지 않는다. 사진의 알파를 늘려 만든 몸통은 대체했다. 옆/뒤 의상은 원본 색을 참고한 근사이며 머리도 사진 기반이므로 정확한 옆얼굴 조형은 아니다. 로딩 실패 때 이전 외형으로 플레이를 계속하고 다음 음악실 입장에 다시 시도한다. Canvas는 원본 사진 투영이다. 실행 중 외부 모델 서비스나 계정이 필요 없다. [최신 명세](specs/piano-boy-free-body.md), [모델 출처·CC0·재현 방법](assets/models/piano-boy-body.md).

3-2 가운데 오른쪽 의자에는 칠판을 바라보는 긴 머리 여학생의 입체 뒷모습을 추가했다. 일반 교실 세 곳은 높이 1.55m의 칠판과 금속 프레임/받침, 분필·지우개, ‘오늘의 당번’ 글씨를 사용한다. 새 여학생도 공격하지 않는 정적인 분위기 요소다.

여고생의 기본/공격 얼굴과 돌진 구도 비교: `http://127.0.0.1:8080/tests/fixtures/attacker-review.html` (`?compat`는 Canvas). 비교 화면에는 게임 판정이 없고 실제 시작·발견·게임 오버·재시작은 일반 게임 컨트롤러로 확인한다.
