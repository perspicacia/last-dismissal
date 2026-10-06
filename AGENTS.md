# 프로젝트 작업 규칙

- 게임의 목적과 범위는 [docs/PRD.md](docs/PRD.md), 실행 방법과 구조는 [README.md](README.md)를 참고한다. 캐릭터 설정은 [CHARACTERS.md](CHARACTERS.md)를 참고한다.
- 기능별 요구사항과 완료 조건은 `specs/`의 해당 문서를 따른다. 현재 기본 게임 명세는 [specs/hidden-rabbit-rooms.md](specs/hidden-rabbit-rooms.md)다. [specs/gameplay.md](specs/gameplay.md)는 이전 관찰 버전 기록이다. 새 기능은 구현 전에 명세와 Issue로 범위를 정한다.
- 기능 개발은 `codex/<작업명>` 별도 브랜치에서 진행한다. 테스트·플레이 확인 → 커밋·Push·PR → 리뷰 후 `main` 병합 → 통합 검증 순서로 작업한다. 배포는 요청된 경우에 진행한다.
- 병렬로 코드를 수정할 때는 작업자별 별도 워크트리를 사용하고 담당 파일·범위를 정한다.
- 게임 로직 변경 후 관련 테스트와 시작 → 플레이 → 종료(게임 오버 또는 탈출) → 재시작 흐름을 확인한다. UI·음향 변경은 실제 브라우저에서도 확인한다.
- 현재 탐색 플레이의 공격자는 [specs/schoolgirl-attacker.md](specs/schoolgirl-attacker.md)의 교복 여고생 귀신이다. 2026-10-06 사용자 요청으로 신규 디자인·두 표정 이미지 제작/적용이 승인되었고 토끼는 [specs/rabbit-presence.md](specs/rabbit-presence.md)에 따라 3-1 교실과 첫 화면에 비공격 분위기 캐릭터로 유지한다. 토끼의 무표정/근접 이빨 표정은 여고생 공격 상태와 독립하며 시작 복도에는 표시하지 않는다. 최신 명세가 이전 토끼 공격자/신규 이미지 금지 규칙을 이 새 공격자에 한해 대체한다. 학생 인형은 정적인 장식이며 창밖 귀신은 근접 미소를 보이는 분위기 요소다. 교실 연출·음향은 [specs/classroom-hauntings.md](specs/classroom-hauntings.md)를 따른다. 이전 학생 인형의 기립 조건은 [specs/classroom-doll.md](specs/classroom-doll.md)를 따른다. 음향은 음소거 상태에서도 판정할 수 있게 유지한다.
- 공격자 최신 외형은 [specs/masked-schoolgirl-ghost.md](specs/masked-schoolgirl-ghost.md)의 하얀 가면 얼굴·가느다란 눈·남색 세일러 교복을 따른다. 사용자가 초기 여고생이 너무 아름답다고 지적하며 참고 이미지로 재디자인/두 표정 제작을 요청했다. 후속 입 모양 보완/얼굴 혈흔은 같은 명세의 도구 제약에 따라 작은 마른 자국으로 적용하며, 얼굴 전체 피칠갑이 완료됐다고 보고하지 않는다. 새 자산은 별도 이름으로 저장하고 이전 여고생 PNG는 보존한다. 기존 발견/돌진/음향/재시작·다른 캐릭터는 변경하지 않는다.
- 완료 보고에는 변경 내용, 실행한 검증, 결과, 미확인 사항을 포함한다. 테스트 통과와 실제 플레이 확인을 구분한다.
- 작업 후 [docs/progress.md](docs/progress.md)에 완료한 일, 검증 결과, 미확인 사항과 다음 작은 작업을 기록한다.
- 종료 화면은 [specs/game-over-screen.md](specs/game-over-screen.md)의 `GAME OVER`와 `다시 하기`를 따른다. 기존 토끼 발견/돌진 시간·음향·재시작 판정은 유지한다.
- 음악실 소품·악보 방향·귀신 미소/웃음은 [specs/music-ghost-polish.md](specs/music-ghost-polish.md), 첫 화면은 [specs/horror-title-screen.md](specs/horror-title-screen.md)를 따른다. 기존 캐릭터 PNG는 보존하고 코드 기반 도형·음향을 사용한다.
- 음악실 의자는 [specs/piano-boy-ghost.md](specs/piano-boy-ghost.md)의 정적인 어린 남자아이 귀신이다. 신규 이미지 제작은 사용자 요청으로 승인되었으며 공격/게임 오버 판정을 추가하지 않는다.
- 음악실 남자아이의 최신 몸통은 [specs/piano-boy-free-body.md](specs/piano-boy-free-body.md)를 따른다. 사용자가 무료 인체 활용을 채택했다. Quaternius Standard CC0의 실제 몸통/사지를 어린아이 비율·앉은 자세로 변형하고 원본 사진의 얼굴·머리·앞면 의상 느낌을 보존한다. 팔/다리 비율과 무릎 위 손·맨발 접촉을 유지하고 상의/소매·반바지는 별도 입체 의상으로 표현한다. 원본 손 사진을 바지에 중복하지 않는다. 머리–턱–목도 무료 인체의 연결 표면을 사용하며 원작 성인 얼굴의 굴곡은 완화하고 기존 어린아이 사진을 앞면에 적용한다. 각진 겹침 소매는 둥근 옷깃/내려오는 어깨의 연속 의상으로 대체한다. 얼굴의 옆/뒤는 근사이며 완전한 원본 얼굴 복원으로 보고하지 않는다. 출처/라이선스/변환 스크립트를 보관하고 로딩 실패 때 기존 외형을 유지한다. 다른 캐릭터와 공격·카메라·음향 규칙은 변경하지 않는다.
- 3-3 칠판 옆 얼굴 없는 학생은 [specs/faceless-student-upgrade.md](specs/faceless-student-upgrade.md)를 따른다. 사용자가 이번 신규 캐릭터의 디자인/제작/배치를 위임했으며 기존 캐릭터 이미지 제작 중단은 유지한다. 첫 화면에는 [토끼 등장 복구 명세](specs/rabbit-presence.md)에 따라 토끼·여고생과 기존 네 귀신을 포함한 여섯 캐릭터를 표시한다.
- 남자아이·얼굴 없는 학생의 입체 외형, 3-2 의자의 뒷모습 여학생, 칠판/당번/분필·지우개의 최신 규칙은 [specs/classroom-character-depth.md](specs/classroom-character-depth.md)를 따른다. 남학생의 기존 PNG는 보존하고 앞면 사진을 닫힌 3D 인체 메시로 연결한다. 모두 정적 분위기 요소이며 새 교복 여고생만 공격한다. 금발 학생 인형의 원본 외형 규칙은 유지한다.
- 칠판 글씨의 최신 외형은 [specs/chalkboard-writing.md](specs/chalkboard-writing.md)를 따른다. 로컬 한글 손글씨·분필 질감을 두 렌더에서 공유하며 게임 난수는 사용하지 않는다.
- 게시판 사진의 최신 일반 탐색 외형은 [specs/aged-erased-photo.md](specs/aged-erased-photo.md)를 따른다. 검게 지운 기존 초안에 코드 기반 낡은 인화지 질감을 더하며 PNG·크기/위치·이전 관찰 모드의 정상/이상 구분을 보존한다.
- 학생 인형 측면·이미지 로딩의 최신 규칙은 [specs/student-doll-sides.md](specs/student-doll-sides.md)를 따른다. 과거의 완전 평면 앞면 규칙은 최신 완만한 곡면 연결로 대체한다.
- 학생 인형 외형의 최신 채택 기준은 [specs/student-doll-original-look.md](specs/student-doll-original-look.md)다. 일반 게임은 원본 PNG 기반 외형을 유지하고 단순 GLB 시안은 명시한 개발용 비교에서만 사용한다. 후속 3D 모델은 원본과 닮은 외형을 사용자에게 먼저 검토받는다.
- 네 기존 캐릭터의 원본 입체 보완은 [specs/character-original-depth.md](specs/character-original-depth.md)를 따른다. 머리·몸의 다른 깊이/앞뒤 곡면이 이전 인형의 14cm 균일 깊이와 평면 얼굴 기준을 대체한다. 원본 PNG는 보존하고 사진 기반 근사를 완전한 3D 복원으로 보고하지 않는다.
- 문·토끼 비명은 [specs/reference-horror-audio.md](specs/reference-horror-audio.md)의 로컬 녹음 편집본을 우선 사용한다. 기존 코드 기반 음향 규칙에서 이 두 효과음만 대체하며 나머지 합성음·실패 시 대체음은 유지한다. 출처는 [assets/audio/README.md](assets/audio/README.md)를 확인한다.
- 교실 목재 창문·검은 고양이의 무작위 등장/울음은 [specs/windows-black-cat.md](specs/windows-black-cat.md)를 따른다. 고양이는 코드 기반 입체 분위기 요소로 공격/방문 판정을 바꾸지 않으며 방 이동/종료/재시작에서 정리한다.
- 검은 고양이 외형·보행·울음의 최신 기준은 [specs/black-cat-polish.md](specs/black-cat-polish.md)다. 검은 털/금빛 눈·접지하는 두 관절 보행·3초 등장·앙칼스러운 하악질/울음이 이전 큰 도약·1.6초 등장·낮은 울음을 대체한다.

- 음악실 남자아이의 앞뒤 곡면·원본 색 연결·좌석 접촉의 최신 규칙은 [specs/piano-boy-depth-repair.md](specs/piano-boy-depth-repair.md)를 따른다. 원본 XY/UV를 보존하면서 앞면도 조형하고, 후면에 얼굴 사진을 반복하지 않는다.
- 남자아이의 근접 얼굴은 [specs/piano-boy-face-repair.md](specs/piano-boy-face-repair.md)를 따른다. 얼굴 특징의 과도한 깊이 차이를 줄이고 밝은 확대/실제 음악실 정면·양쪽 사선에서 원본 비율을 확인한다.
- 검은 고양이의 참고 모델 비율·올라간 꼬리·연속 다리 표면과 음악실 남자아이의 원본 앞면/뒤 볼륨은 [specs/cat-boy-likeness.md](specs/cat-boy-likeness.md)를 따른다. 남자아이를 여러 구형 사진 부품으로 되돌리지 않는다. 같은 원본 XY/UV를 보존하며 옆/뒤는 근사다. 기존 위치·좌석·발 접촉·비공격·고양이 보행/정리 규칙은 유지한다.

- 현재 일반 게임의 조작/카메라/Esc 규칙은 [specs/mouse-look-comfort.md](specs/mouse-look-comfort.md)를 따른다. WASD 옆걸음·수동 마우스 시점·고정 카메라·일시정지가 이전 A/D 회전·자동 시점·Esc 초기화 규칙을 대체한다.
- 시점 조작의 최신 감도/고정/대체 입력은 [specs/accessible-camera-controls.md](specs/accessible-camera-controls.md)를 따른다. 좌우/상하 65%/32.5% 독립 감도·정면 높이 고정·Page Up/Down/Home·설정 저장은 이전 단일 감도를 대체한다. 토끼 수직 시야·일시정지/캡처와 고정 카메라는 유지한다.
- 영역 캡처는 [specs/capture-cursor-release.md](specs/capture-cursor-release.md)를 따른다. P/일시정지 메뉴로 장면을 고정하고 커서·드래그를 해제한다. OS 캡처 단축키를 막지 않으며 캡처 중 포커스 이탈은 고정을 유지한다. 재개/처음 화면에서 상태를 정리한다.

- 계단 접근 공포음은 [specs/stair-haunt.md](specs/stair-haunt.md)를 따른다. 새 게임당 한 번이며 음소거 중 소비하고 방 이동/일시정지/종료에서 정리한다. 공격자·카메라 조작은 변경하지 않는다.

- 학교 조도와 토끼 얼굴 피 얼룩은 [specs/darker-school-blood-rabbit.md](specs/darker-school-blood-rabbit.md)를 따른다. 원본 두 표정의 털/투명도를 유지하는 코드 기반 번짐을 사용하고 돌진/비명/만세/재시작 시간은 유지한다. 캐릭터 외형 비교 화면의 조명을 낮춰 외형 문제를 숨기지 않는다.
- 학교 색감/최신 광원은 [specs/shadow-corridor-tone.md](specs/shadow-corridor-tone.md)를 따른다. 그림자복도의 따뜻한 국소 광원 대비를 참고해 청회색 암부와 낮은 채도를 적용하되 문·바닥/가구 경계·귀신 얼굴 식별을 유지한다. 원본 이미지·게임 난수·공포/소등 시간·동작 줄이기/캡처 규칙은 보존한다.

## 역할 분담

| 담당 | 범위와 결과물 |
| --- | --- |
| 디자인 Agent | 컨셉, 맵 배치, 캐릭터 외형·표정과 연출 제안. 컨셉 문서·맵 배치도·캐릭터 이미지·개발 전달 사항을 작성한다. |
| 개발 Agent A | 열쇠·문·퍼즐과 관련 조작·화면·상태 피드백을 구현하고 테스트한다. |
| 개발 Agent B | 사운드·공포 이벤트, 조명 변화와 캐릭터 등장 연출을 구현하고 확인 기록을 남긴다. |
| 검토 Agent | 재시작·진행 불가·기능 충돌을 점검하고 재현 절차, 기대 결과, 실제 결과가 있는 오류 목록을 작성한다. 수정은 담당 개발 Agent가 맡는다. |
| 사용자 | 디자인·공포 강도·우선순위·최종 채택을 결정한다. |

- 디자인 제안은 사용자가 채택한 뒤 해당 기능 명세에 반영한다. 개발 Agent는 채택된 명세를 구현한다.
- A와 B가 공통 파일을 수정해야 하면 작업 전에 담당자와 통합 순서를 정한다. 검토 Agent는 기본적으로 읽기와 검증을 맡는다.
- 디자인은 다음 기능을 준비하고 개발은 이미 정해진 기능을 진행할 수 있다. 역할 수와 실제 동시 실행 수는 구분하고, 실행 가능한 인원만 병렬 배정한다.
- 역할 합의 자체는 개별 작업의 착수나 제작 중단 요청의 해제를 뜻하지 않는다. 기존 캐릭터의 추가 이미지 제작 중단은 유지하며, 사용자가 요청한 기존 이미지의 게임 연결은 진행한다.

## 실행·검증 명령

프로젝트 루트에서 실행한다. Node.js/npm과 Python 3가 필요하며 일반 실행은 로컬 vendor 모듈을 사용한다. Three.js 의존성을 재설치할 때는 `npm ci`를 실행한다.

```sh
npm start
```

`http://127.0.0.1:8080`에서 플레이한다. 이미 서버가 실행 중이면 재사용한다.

```sh
npm test
node --test tests/logic.test.js
node --test tests/movement.test.js
git diff --check
```

`npm test`는 전체 테스트, 아래 두 명령은 판정과 이동·조사·토끼 표정 조건을 각각 검증한다. 자동 테스트가 브라우저 플레이 검증을 대신하지는 않는다.
