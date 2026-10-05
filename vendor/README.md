# Three.js vendor

Three.js 0.186.1, MIT (`THREE-LICENSE.txt`). 코어는 `three/build/three.module.js`, `three.core.js`다.

GLB 로딩에 필요한 `GLTFLoader.js`, `BufferGeometryUtils.js`, `SkeletonUtils.js`는 같은 버전의 `three/examples/jsm/`에서 복사했다. bare `three`를 `./three.module.js`로, 로더의 유틸리티 경로를 같은 디렉터리로 바꿨다. 그 외 원본 로직은 변경하지 않았다. 라이브러리 갱신 시 세 addon도 같은 버전으로 동기화한다.
