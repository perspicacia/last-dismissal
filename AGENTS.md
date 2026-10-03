# 프로젝트 작업 규칙

- 게임의 목적과 범위는 [docs/PRD.md](docs/PRD.md), 실행 방법과 구조는 [README.md](README.md)를 참고한다. 캐릭터 설정은 [CHARACTERS.md](CHARACTERS.md)를 참고한다.
- 기능별 요구사항과 완료 조건은 `specs/`의 해당 문서를 따른다. 현재 기본 게임 명세는 [specs/hidden-rabbit-rooms.md](specs/hidden-rabbit-rooms.md)다. [specs/gameplay.md](specs/gameplay.md)는 이전 관찰 버전 기록이다. 새 기능은 구현 전에 명세와 Issue로 범위를 정한다.
- 기능 개발은 `codex/<작업명>` 별도 브랜치에서 진행한다. 테스트·플레이 확인 → 커밋·Push·PR → 리뷰 후 `main` 병합 → 통합 검증 순서로 작업한다. 배포는 요청된 경우에 진행한다.
- 병렬로 코드를 수정할 때는 작업자별 별도 워크트리를 사용하고 담당 파일·범위를 정한다.
- 게임 로직 변경 후 관련 테스트와 시작 → 플레이 → 종료(게임 오버 또는 탈출) → 재시작 흐름을 확인한다. UI·음향 변경은 실제 브라우저에서도 확인한다.
- 현재 탐색 플레이의 공격자는 토끼다. 학생 인형은 정적인 장식이며 창밖 귀신은 근접 미소를 보이는 분위기 요소다. 교실 연출·음향은 [specs/classroom-hauntings.md](specs/classroom-hauntings.md)를 따른다. 이전 학생 인형의 기립 조건은 [specs/classroom-doll.md](specs/classroom-doll.md)를 따른다. 음향은 음소거 상태에서도 판정할 수 있게 유지한다.
- 완료 보고에는 변경 내용, 실행한 검증, 결과, 미확인 사항을 포함한다. 테스트 통과와 실제 플레이 확인을 구분한다.
- 작업 후 [docs/progress.md](docs/progress.md)에 완료한 일, 검증 결과, 미확인 사항과 다음 작은 작업을 기록한다.
- 종료 화면은 [specs/game-over-screen.md](specs/game-over-screen.md)의 `GAME OVER`와 `다시 하기`를 따른다. 기존 토끼 발견/돌진 시간·음향·재시작 판정은 유지한다.
- 음악실 소품·악보 방향·귀신 미소/웃음은 [specs/music-ghost-polish.md](specs/music-ghost-polish.md), 첫 화면은 [specs/horror-title-screen.md](specs/horror-title-screen.md)를 따른다. 기존 캐릭터 PNG는 보존하고 코드 기반 도형·음향을 사용한다.
- 음악실 의자는 [specs/piano-boy-ghost.md](specs/piano-boy-ghost.md)의 정적인 어린 남자아이 귀신이다. 신규 이미지 제작은 사용자 요청으로 승인되었으며 공격/게임 오버 판정을 추가하지 않는다.
- 3-3 칠판 옆 얼굴 없는 학생은 [specs/faceless-student-upgrade.md](specs/faceless-student-upgrade.md)를 따른다. 사용자가 이번 신규 캐릭터의 디자인/제작/배치를 위임했으며 기존 캐릭터 이미지 제작 중단은 유지한다. 첫 화면에는 다섯 귀신을 포함한다.
- 남자아이·얼굴 없는 학생의 입체 외형, 3-2 의자의 뒷모습 여학생, 칠판/당번/분필·지우개의 최신 규칙은 [specs/classroom-character-depth.md](specs/classroom-character-depth.md)를 따른다. 남학생의 기존 PNG는 보존하고 앞면 사진을 닫힌 3D 인체 메시로 연결한다. 모두 정적 분위기 요소이며 토끼만 공격한다. 금발 학생 인형의 원본 외형 규칙은 유지한다.
- 학생 인형 측면·이미지 로딩의 최신 규칙은 [specs/student-doll-sides.md](specs/student-doll-sides.md)를 따른다. 과거의 완전 평면 앞면 규칙은 최신 완만한 곡면 연결로 대체한다.
- 학생 인형 외형의 최신 채택 기준은 [specs/student-doll-original-look.md](specs/student-doll-original-look.md)다. 일반 게임은 원본 PNG 기반 외형을 유지하고 단순 GLB 시안은 명시한 개발용 비교에서만 사용한다. 후속 3D 모델은 원본과 닮은 외형을 사용자에게 먼저 검토받는다.
- 문·토끼 비명은 [specs/reference-horror-audio.md](specs/reference-horror-audio.md)의 로컬 녹음 편집본을 우선 사용한다. 기존 코드 기반 음향 규칙에서 이 두 효과음만 대체하며 나머지 합성음·실패 시 대체음은 유지한다. 출처는 [assets/audio/README.md](assets/audio/README.md)를 확인한다.
- 교실 목재 창문·검은 고양이의 무작위 등장/울음은 [specs/windows-black-cat.md](specs/windows-black-cat.md)를 따른다. 고양이는 코드 기반 입체 분위기 요소로 공격/방문 판정을 바꾸지 않으며 방 이동/종료/재시작에서 정리한다.

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
