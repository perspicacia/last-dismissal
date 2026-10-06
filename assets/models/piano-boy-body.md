# 음악실 남자아이 몸통

- 원작자: **Quaternius**
- 원본: Universal Base Characters **Standard (무료)**, `Superhero_Male_FullBody.gltf`
- 배포 페이지: https://quaternius.com/packs/universalbasecharacters.html
- 다운로드 페이지: https://quaternius.itch.io/universal-base-characters
- 다운로드: 2026-10-06. 유료 Source 파일은 사용하지 않았다.
- 라이선스: **CC0 1.0 Universal**, https://creativecommons.org/publicdomain/zero/1.0/
- 원본 라이선스: [License_Standard.txt](../../modeling/source/quaternius/License_Standard.txt)

`piano-boy-body.glb`는 무료 인체를 어린아이 비율과 앉은 자세로 변형한 정적 몸통/사지 및 머리–턱–목 표면이다. 원본 PNG의 얼굴·머리·앞면 의상은 보존한다. 인체의 두개골·턱·목 구조는 사용하지만 원작 성인 얼굴의 과도한 코/눈구멍 굴곡은 완만한 사진 앞면으로 대체하고, 원작 얼굴/눈/헤어 재질을 게임에 사용하지 않는다. 사진 윤곽을 늘린 머리와 별도 목 기둥은 이 실제 연결 표면으로 대체했다. 목의 아래쪽은 어린아이의 부드러운 타원 단면으로 조정했다.

내려오는 어깨·둥근 옷깃·넓은 짧은 소매를 연속된 상의로 만들었고, 헐렁한 반바지·작은 맨발/발가락과 무릎 위 손을 유지한다. 성인 근육 윤곽은 완화했고, 사진 바깥 투명 RGB가 피부색에 섞이지 않게 처리한다. 얼굴 앞면/의상은 기존 `piano-boy-ghost.png`를 사용하지만 사진에 없는 옆얼굴·머리 뒤·옆/뒤 의상은 근사다. 원본 얼굴의 완전한 3D 복원이 아니다.

재현: `node modeling/build-piano-boy-body.mjs` (npm Three.js 의존성 필요). 저장소의 원본 `.gltf`/`.bin`은 기하/뼈대 처리에 사용하며 원본 재질 파일은 생략했다. 변환 도구는 파일의 재질/외부 이미지 참조를 제거한 뒤 메시를 읽으므로 생략한 파일이나 네트워크가 필요 없다.

원본 SHA-256:

- glTF: `e7fcea214ecf8855afbf910b50de6f9c7d1decfb71ca28bad8a4481452dafeb4`
- BIN: `459003f9745853ae562a85506a2b94dd56515c1f37728f9fa3d2ce1a3e4cd92f`

현재 변환 GLB SHA-256: `fa32386f9982c1dd16dc71914c91d79bee432691bd17a446f30e011077f751b7`. 변환 스크립트 재실행 후 동일 바이트/해시를 확인했다.

2026-10-06 팔/다리·의상 후속 수정: 몸·옷·세부 피부 표면을 `_garment`/`_skindetail` 속성으로 구분한다. 원본 사진 속 손이 반바지에 다시 찍히거나 앞면 소매가 실제 팔에 겹치지 않게 마스크하며, 실제 손/발/목과 팔·다리는 원본의 불투명 피부색을 연결한다. 원본 의상 앞면 질감은 보존하지만 사진에 없는 소매·옆/뒤 주름은 근사다. 모든 부품은 정적 닫힌 표면이며 런타임 의상 시뮬레이션/애니메이션은 없다.
