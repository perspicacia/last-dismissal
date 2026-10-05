# 학생 인형 GLB

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
