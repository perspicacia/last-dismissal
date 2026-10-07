# 로컬 미리보기 실행·복구 검증 — 2026-10-07

범위: [Issue #119](https://github.com/perspicacia/last-dismissal/issues/119), [명세](../specs/stable-local-preview.md). 캐릭터 모델/이미지·게임 로직은 변경하지 않았다.

## 확인한 원인과 경계

1. 이전 임시 `nohup` Python 서버는 응답 확인 뒤 종료됐다. 터미널/실행 작업 수명과 분리되지 않은 실행 경로가 있었다. 이번 시작 시점에는 기존 8080 PID 9038과 임시 8081 PID 71454 모두 정상이며 문서 루트도 프로젝트였다. 따라서 현재의 앱 오류를 서버 다운으로 재현한 것은 아니다.
2. 두 포트와 실행/비교 화면 주소를 번갈아 안내한 이력이 있어 접속 경로가 혼동됐다. 플레이 주소를 `http://127.0.0.1:8080/`로 통일했다. 기존 프로젝트 서버의 실제 명령·PID·cwd·LISTEN을 검증한 뒤 관리 서버로 교체하고, 이전 작업에서 만든 임시 8081 서버만 정리했다.
3. 사용자가 보낸 ‘이 클라우드 파일을 불러오지 못했습니다’ 배너는 앱 대화 화면에 있다. 프로젝트 코드와 실제 HTTP 페이지에는 이 문구가 없고, 독립 Mac Chrome에서 게임 첫 화면이 정상 표시됐다. 앱 파일 로딩 실패의 구체적 원인은 확인하지 못했다. 서버 성공과 앱 미리보기 복구를 같다고 보고하지 않는다.

새 서버는 프로젝트 내부 `.preview/`에 상태/로그를 남기는 독립 Node 프로세스다. 실행 명령이 끝난 뒤 다른 명령에서 같은 PID의 정상 응답을 확인했다. OS 로그인 항목/LaunchAgent나 네트워크·보안 설정을 변경하지 않았다. 재부팅 뒤에는 `npm run preview` 또는 Finder의 `play.command`로 실행한다.

## 구현

- [preview.mjs](../scripts/preview.mjs): 시작·상태·Chrome 열기·재시작·종료·최근 로그. 실제 페이지와 필수 모듈을 로컬 파일과 비교하며 다른 서버를 자동 종료하거나 다른 포트로 이동하지 않는다. PID 기록과 실제 인스턴스의 토큰/루트/포트를 함께 확인해 자체 서버만 종료한다.
- [preview-server.mjs](../scripts/preview-server.mjs): 파일 요청 시 최신 내용을 읽고 `Cache-Control: no-store`를 적용한다. 실행 위치에 관계없이 프로젝트 루트를 제공하며 127.0.0.1에만 바인딩한다. JS/CSS/PNG/GLB/음향/폰트 MIME과 HEAD를 지원한다.
- [play.command](../play.command): Mac Finder에서 두 번 클릭하면 자기 프로젝트 폴더에서 서버를 확인하고 기본 Chrome으로 게임 주소를 여는 요청을 보낸다. Chrome 창 표시 확인과 명령 성공을 구분한다.
- [README](../README.md)에 실행·복구 명령과 앱 오류 경계를 기록했다. 추가 npm 패키지를 설치하지 않았다.

## 자동 검사

- 전체 `npm test`: **251/251 통과**. 추가 서버 검사 5개 포함.
- 신규 검사는 서버 없음→시작, 반복/동시 시작 재사용, 파일 수정 반영, 자체 서버 재시작·종료, 다른 루트/기존 서버 유지, 오래된 PID 보호, 쿼리/HEAD/MIME/파일 범위를 실제 임시 HTTP 서버와 프로세스로 검증한다. 임시 테스트 포트는 플레이 주소에 안내하지 않았다.
- 새 JS 2개와 Mac 실행 스크립트 구문, `git diff --check` 통과. 프로젝트 밖 `/tmp`에서 실행한 상태 명령도 정확한 문서 루트/8080 서버를 확인했다.
- `index.html`, `game.js`, `three-school.js`, 세 캐릭터 모듈 및 기존 PNG/GLB의 HEAD 바이트 동일성을 확인했다.

## Mac Chrome 반복 검증

사용자 Mac에 설치된 Chrome을 **별도 headless 프로필/SwiftShader**로 실행했다. 기존 GUI Chrome의 탭/프로필/설정은 사용하거나 닫지 않았다. 테스트 디버깅 포트는 이 별도 프로필의 localhost 임시 포트이며 플레이 주소는 모든 단계에서 8080이다. 테스트 후 독립 브라우저와 임시 프로필을 정리했다.

| 시나리오 | 실제 확인 결과 |
| --- | --- |
| 관리 서버에서 첫 열기 | 제목 LAST DISMISSAL, intro, Three.js, 음악실 몸통 ready, 포스터 이미지 ready |
| 진단용 JS 수정 후 같은 URL에서 일반 새로고침 | 모듈 revision 1→2. 쿼리 값을 바꾸거나 캐시 강제 무시 없이 반영 |
| 서버 재시작 뒤 같은 탭 새로고침 | 관리 PID 변경, 새 문서 생성 시각과 Three.js/몸통 ready 확인 |
| 테스트 탭 닫고 같은 주소 다시 열기 | 새 문서에서 동일 첫 화면·모델 ready |

네 번의 실제 문서 응답은 모두 HTTP 200 / `no-store`였다. 각 새로고침에서 `performance.timeOrigin`이 바뀐 뒤 준비 상태를 검사해 이전 문서를 정상 상태로 잘못 읽지 않았다. JavaScript 런타임 예외 **0건**. 로컬 페이지의 클라우드 배너 **없음**.

검증용 JS는 Git 제외 `artifacts/preview-reliability/live-reload-probe.js`다. 실제 게임 JS를 테스트 목적으로 덮어쓰지 않았다. 로컬 증거는 같은 폴더의 `browser-evidence.json`, `browser-check.mjs`, `managed-title.png`, `after-restart-title.png`, `reopened-title.png`다. 파일은 Git 제외 자료이며 공개 PR에 이미지가 업로드됐다고 보고하지 않는다.

처음 CLI 캡처는 [Chrome 공식 headless 실행](https://developer.chrome.com/docs/automation-and-testing/headless-cli)을 참고해 시간 제한을 사용했다. 반복 검증은 별도 Chrome에서 실제 페이지 새로고침과 탭 재열기를 실행했다.

## 남은 확인과 도구 설치 조회

- 사용자 GUI Chrome 창의 현재 상태와 앱 내 클라우드 파일 배너의 구체 원인은 미확인이다. 현재 CUA/브라우저 GUI 도구가 제공되지 않는다. 직접 Chrome 열기 명령의 성공을 사용자 GUI 플레이 성공으로 확대하지 않는다.
- 이번은 실행/접근/새로고침 검사다. 수동 시작→교실 탐색→GAME OVER→재시작, 청감·GPU 성능·Mac 재부팅 후 실행까지 새로 검증한 것은 아니다. 게임 로직 변경은 없다.
- 설치 조회: `/Applications`, `~/Applications`의 앱 이름과 PATH에서 Blender/Godot/MeshLab 등 편집 도구를 찾지 못했다. 다른 임의 설치 위치까지 없다고 단정하지 않는다. 설치/설정은 하지 않았다.
- 기존 모델은 Node·Three.js `GLTFExporter`, 로컬 Quaternius Standard CC0 인체와 `modeling/build-piano-boy-body.mjs`/`boy-clothes.mjs`로 제작됐다. 기존 도구로 과도한 변형·접합·사진 혼합의 코드 보완은 가능하고 플레이에는 추가 설치가 필요 없다. 측면 두상/교복을 직접 조형하고 전용 UV를 편집할 후속 작업에서는 Blender 같은 모델 편집 도구를 고려할 수 있다. [공식 UV 작업 설명](https://docs.blender.org/manual/en/5.0/modeling/meshes/uv/unwrapping/introduction.html). 기존 자산을 유지한 시안 검토와 별도 범위 확정이 먼저이며 이번에 캐릭터 외형은 바꾸지 않았다.
