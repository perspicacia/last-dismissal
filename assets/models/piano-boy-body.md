# 음악실 남자아이 몸통

- 원작자: **Quaternius**
- 원본: Universal Base Characters **Standard (무료)**, `Superhero_Male_FullBody.gltf`
- 배포 페이지: https://quaternius.com/packs/universalbasecharacters.html
- 다운로드 페이지: https://quaternius.itch.io/universal-base-characters
- 다운로드: 2026-10-06. 유료 Source 파일은 사용하지 않았다.
- 라이선스: **CC0 1.0 Universal**, https://creativecommons.org/publicdomain/zero/1.0/
- 원본 라이선스: [License_Standard.txt](../../modeling/source/quaternius/License_Standard.txt)

`piano-boy-body.glb`는 원본 인체의 눈/눈썹/머리와 재질을 제외하고 어린아이 비율과 앉은 자세로 변형한 정적 몸통/사지다. 기존 구간별 확대를 제거하고 손목/팔꿈치·종아리·발의 비율을 조정했다. 별도의 헐렁한 상의/짧은 소매와 반바지, 작은 발가락 표면을 추가했고, 원본 턱 아래까지 좁은 목을 연결했다. 옷에 덮인 성인 어깨는 앉은 자세에서 닫아 의상 위로 돌출하지 않게 한다. 원작 모델의 얼굴·헤어·텍스처를 게임에 사용하지 않는다. 실제 게임은 기존 `piano-boy-ghost.png`의 얼굴/헤어 및 앞면 의상 질감을 연결한다. 사진에 없는 옆/뒤 의상은 원본의 옷/피부 색을 참고한 근사이며 원본 얼굴의 완전한 3D 복원이 아니다.

재현: `node modeling/build-piano-boy-body.mjs` (npm Three.js 의존성 필요). 저장소의 원본 `.gltf`/`.bin`은 기하/뼈대 처리에 사용하며 원본 재질 파일은 생략했다. 변환 도구는 파일의 재질/외부 이미지 참조를 제거한 뒤 메시를 읽으므로 생략한 파일이나 네트워크가 필요 없다.

원본 SHA-256:

- glTF: `e7fcea214ecf8855afbf910b50de6f9c7d1decfb71ca28bad8a4481452dafeb4`
- BIN: `459003f9745853ae562a85506a2b94dd56515c1f37728f9fa3d2ce1a3e4cd92f`

현재 변환 GLB SHA-256: `47a629c42299cd127a0bf2e3ba57eaf85f02b8d4a00b8d2df45db8d4c08ef0da`. 변환 스크립트 재실행 후 동일 바이트/해시를 확인했다.

2026-10-06 팔/다리·의상 후속 수정: 몸·옷·세부 피부 표면을 `_garment`/`_skindetail` 속성으로 구분한다. 원본 사진 속 손이 반바지에 다시 찍히거나 앞면 소매가 실제 팔에 겹치지 않게 마스크하며, 실제 손/발/목과 팔은 원본 피부색을 연결한다. 원본 의상 앞면 질감은 보존하지만 사진에 없는 소매·옆/뒤 주름은 근사다. 모든 부품은 정적 닫힌 표면이며 런타임 의상 시뮬레이션/애니메이션은 없다.
