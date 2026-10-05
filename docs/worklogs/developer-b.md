# 개발 Agent B — 음향·공포 이벤트

## 변경

- `audio.js`: `SchoolAudio.cue(name)` 추가. `key-pickup`은 작은 장난감 종소리, `door-unlock`은 안내방송 시작음 같은 짧은 불협화음, `mascot-reveal`은 낮은 불협화음이다. 최대 개별 음색 gain은 0.04이며 기존 master 출력에 연결되어 음량·음소거를 따른다. 갑작스러운 큰 소리·점멸·외부 음원은 추가하지 않았다.
- `horror-events.js`: `createHorrorEvents()`의 `takeEvent(name)`은 같은 이벤트를 복도당 한 번만 허용한다. `reset()`은 새 복도·시작·재시작에서 호출한다. 이동·판정·오디오 지원 상태와 독립적인 표현 상태다.
- `audio.stop()`과 `start()`에서 이전 ambient 자동화 예약을 취소한다. 탈출 페이드 상태가 재시작에 남지 않게 명시적으로 초기화했다. 실제 브라우저에서 오류를 재현한 것으로 보고하지 않는다.

## 통합 전달

```js
import { createHorrorEvents } from './horror-events.js';
const horrorEvents = createHorrorEvents();
// 새 복도·게임 시작·재시작
horrorEvents.reset();
// 시각적인 획득/문 개방/얼굴 전환 상태를 먼저 처리하고 효과음을 연결
if (horrorEvents.takeEvent('door-unlock')) audio.cue('door-unlock');
```

지원 이름: `key-pickup`, `door-unlock`, `mascot-reveal`. 모듈 자체는 게임 로직을 변경하거나 입력을 잠그지 않는다. 학생 인형은 이미지·기획 상태를 유지한다.

## 검증

- `npm test`: 기존 7개와 새 4개, 합계 11개 통과.
- 새 검증: 이벤트 중복·초기화와 인스턴스 분리, master 출력 및 음소거·볼륨, 오디오 미지원·중지 상태, 재시작의 ambient 예약 취소.
- `git diff --check`: 통과.
- 실제 브라우저의 문 개방·토끼 공개·재시작 흐름은 통합 후 확인해야 한다. 스피커 실제 청취는 미확인이다. 자동 테스트의 AudioContext 모형은 청취 검증을 대신하지 않는다.

## 다음 작은 작업

통합 담당자가 획득·문 개방·토끼 공개 콜백에 API를 연결하고 브라우저에서 음소거 상태에서도 통행과 판정이 가능함을 확인한다.
