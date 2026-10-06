# 음악실 남자아이 몸통

- 원작자: **Quaternius**
- 원본: Universal Base Characters **Standard (무료)**, `Superhero_Male_FullBody.gltf`
- 배포 페이지: https://quaternius.com/packs/universalbasecharacters.html
- 다운로드 페이지: https://quaternius.itch.io/universal-base-characters
- 다운로드: 2026-10-06. 유료 Source 파일은 사용하지 않았다.
- 라이선스: **CC0 1.0 Universal**, https://creativecommons.org/publicdomain/zero/1.0/
- 원본 라이선스: [License_Standard.txt](../../modeling/source/quaternius/License_Standard.txt)

`piano-boy-body.glb`는 원본 인체의 눈/눈썹/머리와 재질을 제외하고 어린아이 비율과 앉은 자세로 변형한 정적 몸통/사지다. 목 단면·좌석/발 접촉을 정리했다. 원작 모델의 얼굴·헤어·텍스처를 게임에 사용하지 않는다. 실제 게임은 기존 `piano-boy-ghost.png`의 얼굴/헤어 및 앞면 의상 질감을 연결한다. 사진에 없는 옆/뒤 의상은 원본의 옷/피부 색을 참고한 근사이며 원본 얼굴의 완전한 3D 복원이 아니다.

재현: `node modeling/build-piano-boy-body.mjs` (npm Three.js 의존성 필요). 저장소의 원본 `.gltf`/`.bin`은 기하/뼈대 처리에 사용하며 원본 재질 파일은 생략했다. 변환 도구는 파일의 재질/외부 이미지 참조를 제거한 뒤 메시를 읽으므로 생략한 파일이나 네트워크가 필요 없다.

원본 SHA-256:

- glTF: `e7fcea214ecf8855afbf910b50de6f9c7d1decfb71ca28bad8a4481452dafeb4`
- BIN: `459003f9745853ae562a85506a2b94dd56515c1f37728f9fa3d2ce1a3e4cd92f`

현재 변환 GLB SHA-256: `882836de372fce7620a674982edb60bed5d1fa54cc7b9c9d18e36503f2fbaa59`. 변환 스크립트 재실행 후 동일 바이트/해시를 확인했다.
