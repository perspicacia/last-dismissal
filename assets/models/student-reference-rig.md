# 원본 기준 리깅 인형 후보

2026-10-06, [학교 3D 보완 명세](../../specs/3d-quality-upgrade.md), [Issue #117](https://github.com/perspicacia/last-dismissal/issues/117).

## 출처와 내용

- 기존 프로젝트 `assets/doll-student-concept.png`의 1024×1536 RGBA 사진을 사용한다. 이 PNG와 기존 모델은 편집하지 않는다. 새 외부 사진/모델/이미지 생성 서비스를 사용하지 않았다.
- 조형: [modeling/reference-student.mjs](../../modeling/reference-student.mjs). 사진 기반 닫힌 앞머리/얼굴, 독립적으로 둥글게 조형한 후두부, 연결 목, 별도 블라우스/소매/주름 치마와 손·무릎·종아리·양말·신발 표면이다. 몸은 코드로 만든 회전체와 둥근 입체다.
- 얼굴·머리 앞면의 XY/UV를 유지한다. 머리 사진은 원본 픽셀을 그대로 내장한다. 몸/의상은 원본에 맞춰 투영하며 512×768의 별도 질감에서 사진 바깥의 투명 영역만 행별 색으로 연결한다. 후면에는 얼굴 사진을 반복하지 않는다.
- 본 17개: root/pelvis/chest/neck/head와 양쪽 upperarm/forearm/hand/thigh/calf/foot. 실제 `SkinnedMesh`/웨이트·역 바인드 행렬을 포함한다.
- 두 4초 검토용 클립: `GentleIdle` (작은 고개 회전), `JointInspection` (양팔 관절 확인). 공격·발견·새 게임 판정에 연결하지 않는다.
- glTF 2.0 binary **4,082,036 bytes**, 원본 제작 메시/스킨 **18개**, 로더의 두 재질 primitive 분리 후 **36개 SkinnedMesh**, **30,324 triangles**, 내장 PNG **2개**. 외부 URI나 런타임 모델 서비스가 필요 없다.
- SHA-256: `b6d1205176da36c33f82d6fe2993b36720c632325fa7c7abe059f79c2afacbe8`.
- 사진은 기존 프로젝트 자산이며 조형/내보내기 코드는 프로젝트 소스다. 제작/로딩 라이브러리 Three.js의 MIT 라이선스는 `vendor/THREE-LICENSE.txt`에 보관한다.

## 재생성과 로딩

프로젝트의 기존 npm 의존성이 준비되어 있으면 설치 없이 실행한다.

```sh
npm run model:reference-student
node --test tests/character-assets.test.js tests/3d-quality.test.js
```

[build-reference-student.mjs](../../modeling/build-reference-student.mjs)는 Three.js GLTFExporter와 Node 내장 PNG 어댑터를 사용한다. [character-assets.js](../../character-assets.js)는 전체 GLB 계층·스킨·재질·클립을 보존하고 SkeletonUtils로 뼈/재질이 독립적인 인스턴스를 만든다. 반복 요청은 공유하며 실패/빈 모델은 캐시에서 제거해 재시도한다. 인스턴스 종료 시 mixer/재질을 해제하고 공유 geometry/텍스처는 훼손하지 않는다.

비교용 누운 자세는 후두부와 치마의 지지 깊이를 맞춰 골반/목·머리 위치를 조절하고 고관절을 조금 굽힌다. 머리·치마·양 신발의 바닥 관통/부유를 자동 검증한다. 정면으로 돌아오면 본의 원래 위치/회전을 복원하며 같은 자세를 반복 선택해도 누적 변형하지 않는다. 이는 검토용 정적 자세이며 게임의 기립/공격 동작을 추가하지 않는다. 종료 시 독립 스켈레톤의 bone texture도 해제한다.

## 외형 검토와 한계

`http://127.0.0.1:8080/tests/fixtures/reference-character-review.html`에서 원본과 나란히 밝은 정면/사선/측면/뒤/얼굴/누운 자세, 실제 관절 동작과 학교 조명을 확인한다. 일반 게임에는 로딩하거나 대체하지 않는다.

원본의 옆/뒤 정보가 없어 얼굴 측면·귀·머리 컬과 후면 의상 디테일은 정확한 복원이 아니다. 앞머리 경계와 사진 투영은 근접/측면에서 단순한 흔적이 남고 팔다리/옷 비율도 채택 전 검토 대상이다. 표정 모프·독립 눈/입 조형·완성된 걷기/공격 클립·모든 캐릭터의 전환은 제공하지 않는다. 후속은 원본에 맞는 양옆/뒤 설계와 모델 전용 UV/질감을 확정하고 이 후보 한 개를 검토해 채택하는 것이다.
