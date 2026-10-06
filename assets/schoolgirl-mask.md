# 가면 얼굴의 여고생 귀신 자산

최신 일반 게임은 [입 연결 보완·작은 마른 혈흔 두 표정](schoolgirl-mask-stained.md)을 사용한다. 이 문서와 기존 두 PNG는 이전 디자인/프롬프트 기록으로 보존한다.

2026-10-06 사용자가 기존 여고생이 너무 아름답다는 피드백과 새로운 참고 이미지를 주며 디자인 변경을 요청했다. 하얀 가면 같은 무표정·가늘고 긴 눈·남색 세일러복과 붉은 리본을 참고한 가상의 독자적인 귀신이다. 참고 그림의 배경이나 인물을 그대로 게임에 복사하지 않았다.

- 기본 얼굴: [schoolgirl-mask.png](schoolgirl-mask.png)
- 공격 얼굴: [schoolgirl-mask-attack.png](schoolgirl-mask-attack.png)
- 두 파일은 1024×1536 RGBA PNG이며 내장 image_gen 생성/편집 도구의 기본 모드를 사용했다. CLI/API나 별도 키를 사용하지 않았다. 생성된 크기/알파를 변환하지 않고 프로젝트로 복사했다.
- 기본 파일의 완전 투명 픽셀 1,160,568개, alpha>200 픽셀 386,700개. 공격 파일은 각각 1,163,932개와 390,659개다. 인물 밖 배경이 실제로 투명하다.
- 기본/공격의 머리·손·발을 포함한 alpha>200 경계는 각각 (301,24)–(723,1512), (299,23)–(724,1511)이다. 얼굴 아래 몸 윤곽의 불투명 영역 겹침은 약 99%다. 생성된 옷의 잔주름 질감에는 작은 차이가 있으나 전체 자세/프레이밍은 유지했다.
- 일반 Three.js와 Canvas, 첫 화면·게임 오버·비교 화면에서 사용한다. 첫 화면은 무표정, 돌진은 기본→공격 얼굴을 사용한다. 사진 기반 공간 빌보드이며 새로운 관절형 3D 모델은 아니다.
- 기존 `schoolgirl-ghost.png`, `schoolgirl-ghost-attack.png`와 토끼/기타 인물 자산은 보존했다. 이전 디자인/프롬프트는 [schoolgirl-ghost.md](schoolgirl-ghost.md)에 남긴다.
- [최신 명세](../specs/masked-schoolgirl-ghost.md), [Issue #113](https://github.com/perspicacia/last-dismissal/issues/113)

SHA-256:

- 기본: `8da4af919155d3b0b1e31566ac84b5a975705616ad5273a0d04bc881ef4fee59`
- 공격: `e10c7808e31a4b91aa630ad757a203dfe0d0f5b2b5ff4b49eb2fd5b4e59db563`

## 기본 얼굴 최종 편집 프롬프트

Use case: style-transfer. Asset type: neutral-expression full-body transparent cutout for the existing school horror game. Image 1 is the EDIT TARGET (existing full-body schoolgirl ghost); Image 2 is the user's DESIGN REFERENCE for an eerie MASK-LIKE face and navy sailor school uniform. Redesign the target character to capture the unnerving rigid, empty stare of the reference, without copying its artwork or background. Preserve target 1024x1536 portrait framing, centred front-facing standing human, natural anatomy and same head/hand/foot positions, full body from hair top to shoe soles, arms hanging beside thighs, no cropping. Replace the beautiful realistic actress-like face with a visibly inhuman CHALK-WHITE MASK-like elongated oval face, shallow facial relief, a barely defined tiny nose, extremely narrow dark horizontal slit eyes without catchlights, faint short high eyebrows, small dark burgundy closed lips and an utterly vacant calm expression. A subtle aged matte porcelain/painted-mask surface, hollow emotion, asymmetric small imperfections; NOT glamorous, not beautiful, not cute, not anime, no makeup enhancement. Straight black hair with centre part swept behind the shoulders, both ears visible, no forehead bangs. Replace blouse and vest with a worn dark NAVY LONG-SLEEVE SAILOR SCHOOL UNIFORM, broad white double stripes on navy sailor collar, muted dark red ribbon at chest, modest navy pleated knee-length skirt, dark knee socks and black loafers. Keep visible realistic pale hands with natural fingers. Soft cold frontal light makes the white mask, narrow eyes, collar and cloth readable, restrained aged fabric detail suitable for the game's existing semi-realistic environment. ONE figure on genuinely transparent alpha background with clean hair edges and small transparent margins above/below. No dark background, no scene, halo, fog, grey backdrop, ground shadow, props, writing, logos, watermark, extra limbs or extra characters. Neutral state only: mouth CLOSED, no teeth or scream, no gore. The core impression must be a lifeless uncanny school-uniform apparition, not an attractive girl.

## 공격 얼굴 최종 편집 프롬프트

Use case: identity-preserve. Asset type: attack-expression variant of this EXACT mask-faced school ghost for a horror game's texture swap. EDIT the attached transparent full-body image. Keep the same mask-faced apparition, white matte painted face, head silhouette, centre-part black hair, ears, navy sailor uniform, collar stripes, burgundy chest ribbon, skirt, hands, knees, socks, shoes, exact pose, 1024x1536 image framing, lighting and all pixels outside the face as unchanged as possible. Change ONLY the expression inside the mask face: the tiny closed burgundy lips OPEN into a deep unnatural BLACK OVAL SCREAM VOID, stretching vertically within the same jaw outline, a dark maroon thin lip rim and only a few plausible irregular small human teeth partially obscured in the deep upper-mouth shadows. The extremely narrow eyes remain unnerving empty BLACK SLITS, with no bright catchlights, irises or attractive eye detail. A few existing fine mask hairline cracks deepen around mouth/eye corners, no broken-off jaw, no gore. Keep the smooth shallow mask-like facial structure and blank rigid brows instead of restoring a beautiful human actress face. Strongly uncanny lifeless mask suddenly screaming, NOT cute, not glamour, not sexy, not anime; no cartoon fangs or rectangular uniform rows of teeth. Face ONLY edit; don't shift or rotate head/body, don't change hair or cloth, don't zoom/crop the image. Genuine transparent alpha background, same clean transparent outline, no new backdrop, halo, mist, cast shadow, text, props or extra people. This is a second aligned texture, not a different character or camera.
