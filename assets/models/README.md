# 3D 모델 자산

## 음악실 남자아이 몸통

`piano-boy-body.glb`는 Quaternius의 무료 CC0 인체를 어린아이 비율과 앉은 자세로 변형한 정적 몸통/사지다. 일반 Three.js 게임의 음악실에 적용한다. 원작 모델의 얼굴/눈/헤어 재질을 제외하고 두개골–턱–목은 어린아이로 변형해 기존 `piano-boy-ghost.png`의 얼굴/머리와 앞면 의상 질감을 연결한다. 인체와 분리한 헐렁한 상의/소매·반바지와 실제 손/발가락 표면을 포함한다. 내려오는 어깨·둥근 목선·소매는 연속 의상 표면이다. 옆/뒤 옷과 사진을 적용한 머리의 측면은 근사이며 완전한 원본 얼굴 복원은 아니다.

- glTF 2.0 binary, 496,792 bytes, 2 meshes, 11,227 vertices, 22,390 triangles. 스킨/애니메이션/외부 텍스처 없음.
- 출처·CC0 문서·원본 SHA-256·변형 범위: [piano-boy-body.md](piano-boy-body.md).
- 재현: `node modeling/build-piano-boy-body.mjs`. 원본 무료 `.gltf`/`.bin`과 라이선스는 `modeling/source/quaternius/`에 보관한다.
- 로딩 실패에는 기존 사진 기반 외형으로 탐색을 계속하고 다음 음악실 입장에서 다시 시도한다. Canvas는 원본 사진을 유지한다.
- 실제 GLB/원본 얼굴/로딩 검증: `node --test tests/piano-boy-body.test.js`. 첫 파일 로딩 실패→입장 재시도: `tests/fixtures/three-flow.html?safe&silent&activeClock&bodyFailOnce`.

## 학생 인형 GLB 시안

`student-doll.glb`는 이 프로젝트를 위해 코드로 조형한 정적 모델이다. 외부 모델/사진/악곡 자산을 포함하지 않는다. 기존 금발 학생 인형의 금발 단발, 호박색 유리 눈, 도자기 관절, 남색 세일러복, 크림 칼라/리본/양말, 메리 제인 신발을 참고한다. 원본 사진과 정확히 같은 외형은 아니며 첫 3D 조형은 더 단순하다.

- glTF 2.0 binary, 1,711,608 bytes, 17 meshes, 62,700 triangles.
- 모델 높이 1.55m. 정면 -Z, 발 Y=0. 목·몸·다리는 누운 자세에서 지지면에 가까워지도록 굽혀 있다. 게임에서 X축 90°로 눕힌다.
- 메시·법선·UV·PBR 재질과 128×128 절차적 머리/천 무늬 2개를 내부에 포함한다. PNG 전신 사진을 매핑하거나 알파 윤곽에 두께를 붙인 구조가 아니다.
- 도자기와 유리 눈, 천과 머리/가죽의 서로 다른 거칠기를 사용한다. 그림자는 게임의 기존 조명을 사용한다.
- 스킨/본/모프/애니메이션 없음. GLB 실패 및 Canvas에서는 원본 이미지 기반 화면으로 대체한다. 기존 PNG는 보존했다.
- 현재 일반 게임에서는 사용하지 않는 비교 시안이다. 사용자 피드백으로 원본 외형을 복구했다. `tests/fixtures/room-review.html?model=glb`를 명시한 개발용 비교에서만 3-2 바닥 인형을 대체한다. [최신 외형 규칙](../../specs/student-doll-original-look.md).

프로젝트 루트에서 재생성:

```sh
npm ci
npm run model:student
node --test tests/student-model.test.js
```

조형과 재질은 `modeling/student-doll.js`, 내보내기는 `modeling/build-student-doll.mjs`다. Three.js 0.186.1 GLTFExporter와 Node 내장 API만 사용하므로 별도의 Blender/이미지 라이브러리가 필요 없다. 내장 RGBA→PNG 어댑터는 절차적 DataTexture만 내보내며 원본 캐릭터 이미지를 편집하지 않는다.

개발용 `tests/fixtures/student-model-review.html`에서 정면·양옆·후면·얼굴·누운 자세를 확인한다. GLB 시안의 실제 컨트롤러 비교는 `tests/fixtures/three-flow.html?safe&silent&model=glb`, 로딩 실패는 `?safe&silent&modelFail`, Canvas 호환은 `?safe&silent&compat`다. 일반 플레이와 `?safe&silent`는 원본 인형 외형을 유지한다. 검증 설정/버튼은 일반 플레이에 적용하지 않는다.
