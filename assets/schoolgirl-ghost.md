# 교복 여고생 귀신 자산

최신 일반 게임은 사용자가 새 참고 이미지로 요청한 [가면 얼굴·남색 세일러복 디자인](schoolgirl-mask.md)을 사용한다. 이 문서와 두 PNG는 이전 디자인 기록으로 보존한다.

2026-10-06 사용자가 토끼 대신 학교에 어울리는 여고생 공격자를 요청하며 신규 디자인·이미지 제작·게임 적용을 승인했다. 참고 영화 장면은 분위기만 참고했고 인물 사진을 게임 자산으로 복사하지 않았다. 가상의 독자적인 귀신이다.

- 기본 얼굴: [schoolgirl-ghost.png](schoolgirl-ghost.png)
- 공격 얼굴: [schoolgirl-ghost-attack.png](schoolgirl-ghost-attack.png)
- 두 파일: 1024×1536, 8-bit RGBA, 실제 투명 배경. 생성된 알파와 원본 크기를 보존했다.
- 내장 image_gen 생성·편집 도구 사용 (기본 모드, CLI/API 미사용).
- 기본 생성 결과를 편집 대상 이미지로 사용해 공격 표정을 제작했다. 두 표정의 같은 전신 프레이밍·교복·머리·팔/발 위치를 확인했다. 기존 토끼 PNG는 보존했다.
- Three.js는 공간 안의 사진 빌보드, Canvas는 같은 시간/원본 비율의 투영이다. 리깅·전 방향 조형 모델이 아니며 공격 외형을 정면으로 보여주는 구현이다.
- [구현 명세](../specs/schoolgirl-attacker.md), [Issue #109](https://github.com/perspicacia/last-dismissal/issues/109)

## 기본 얼굴 최종 생성 프롬프트

Use case: stylized-concept. Asset type: photorealistic horror game character, one full-body transparent PNG cutout for a dark abandoned Korean school. Primary request: an original terrifying female high-school ghost in a modest worn school uniform, inspired by the mood of East Asian school horror films, NOT an identifiable actor or movie character. Subject: long tangled straight jet-black hair falling over both shoulders, ashen pale human face, gaunt cheeks, deep dark eye sockets with dull very small pupils, cold blank threatening stare and lips slightly parted, slight head tilt. Worn off-white long-sleeved school blouse with faint dried dark red stains at collar and sleeve cuffs, loose dark navy school vest, muted burgundy ribbon untied at one end, dark navy pleated knee-length skirt, charcoal knee socks and worn black loafers. Long naturally proportioned arms hanging slightly away from the body, both hands entirely visible beside thighs, realistic fingers. Composition: ONE character, facing directly forward, centred, full body from top of hair to soles fully visible, feet together, straight-on camera and neutral standing posture, portrait 1024x1536, small empty transparent margin above hair and below shoes, no ground shadow or surrounding scene. Lighting: soft cold frontal light making face and uniform clearly readable, cinematic realistic skin/hair/fabric, ominous unsmiling expression, unsettling human presence, not a doll, not cute, not anime. Constraints: genuine transparent alpha background, no text, logo, watermark, extra people, props, beds, scenery, halos or glow, no cartoon monster teeth, no wounds exposing tissue. Preserve coherent anatomy and uniform silhouette for reuse as a game sprite.

## 공격 얼굴 최종 편집 프롬프트

Use case: identity-preserve. Asset type: the attack-expression variant of this exact horror game ghost cutout. Edit target: the attached full-body female high-school ghost. Keep the SAME original girl, hair silhouette, uniform, body pose, arm position, proportions, shoes, framing, image dimensions, camera and lighting. Change ONLY the expression within the face: a terrifying wide unnatural human grin becoming an open-mouthed scream, slightly tilted brow, fully dark eyes with tiny dull pupils, gaunt cheeks and tight wrinkled corners of lips. Show believable irregular HUMAN teeth partly in shadow, natural gum placement, no cartoon spikes or rectangular picket-fence teeth. This is an ominous cinematic human school ghost, never cute or anime. Preserve the existing faint dried stains without adding gore. Preserve full-body exact alignment for a smooth in-game texture swap. Genuine transparent alpha background, remove any haze behind the subject, NO scenery, text, watermark, props, shadow or glowing border.
