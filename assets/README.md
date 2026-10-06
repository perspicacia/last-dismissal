# 게임 이미지

문·토끼 비명의 로컬 녹음 파일과 출처·이용 조건은 [audio/README.md](audio/README.md)에 기록한다.

## 게시판 단체사진

`school-group-photo.png`와 `school-group-photo-erased.png`는 내장 image_gen 도구로 생성·편집한 1536×1024 PNG다. 실제 인물을 촬영한 사진이 아니라 가상의 학생들을 실사 느낌으로 표현한 이미지다. 정상·이상 사진은 같은 구도를 사용한다.

현재 일반 탐색 게임은 얼굴을 검게 지운 초안을 사용한다. `board-photo.js`가 코드로 누런 인화지·색바램·얼룩·긁힘·닳은 모서리를 덧입힌 공유 Canvas 질감을 생성한다. PNG 원본 두 파일은 보존한다. 이전 관찰 모드의 정상/이상 구분은 유지한다. [최신 명세](../specs/aged-erased-photo.md).

정상 사진 최종 프롬프트:

Use case: photorealistic-natural. Asset type: landscape school group photograph texture for a Korean school horror game's bulletin board. Create an ordinary realistic camera photograph of 10 fictional Korean high-school students in navy school uniforms on a school trip, two clear rows of five, standing and seated in front of leafy trees and a modest school courtyard. All look directly at camera, natural subtle smiles, distinct realistic human faces, realistic skin hair fabric, softly overcast daylight. Composition: straight-on horizontal 3:2 group photo, heads well separated and all fully visible, no overlap, face centers roughly aligned in two regular rows. Upper row faces approximately 25% image height; lower row faces approximately 56% image height; five columns around 14%,32%,50%,68%,86% width. Slightly faded consumer-camera printed photograph from early 2000s, believable candid school-trip keepsake. Fill entire image with the photo itself, no frame, no bulletin board, no writing, no watermarks. No cartoon, no illustration, no 3D render, no horror, no distorted faces. These are fictional people, not identifiable real students.

이상 사진 최종 편집 프롬프트:

Use case: precise-object-edit. Edit this exact school group photograph for an anomaly in a horror game. Change ONLY the ten faces: obscure every face from hairline to chin, including eyes nose and mouth, with an opaque uneven pitch-black rubbed ink/smudged charcoal patch as if somebody scribbled over the faces on the printed photograph. Each patch must cover all facial features completely, with no eyes or smiles visible. Preserve everything else exactly: all ten students, same head shapes, hair, uniforms, hands, poses, seating, background trees and building, lighting, image framing and dimensions. No new people, no gore, no text, no change in photo style. All ten faces must be noticeably black and erased, including the five upper row and five lower row faces.

## 학교 토끼 마스코트

`mascot-rabbit-open.png`는 같은 캐릭터의 입을 벌린 대체 이미지다. 내장 image_gen 편집 도구를 사용했으며 원본을 별도로 보존했다.

## 입 벌림 버전 최종 편집 프롬프트

Use case: precise-object-edit. Edit the supplied original rabbit school mascot game sprite. Change ONLY its closed stitched smile into a frightening wide open mouth: a deep dark mouth cavity with two clearly visible rows of long sharp ivory triangular teeth, predatory yet still a plush toy. Stretch the mouth vertically inside the cream muzzle, preserving the nose and eyes and head silhouette. No blood or gore. Keep all other pixels and composition as closely matched as possible: identical mint fur, button eyes, ears, scarf, body, arms, legs, same neutral pose, same full-body frontal camera, same lighting, exact same 1024x1536 canvas and scale, same margins and foot position. Preserve true transparent background and alpha. ONE full-body character, not a sheet or comparison. This is the scary open-mouth alternate sprite of the same cute character, for a smooth in-game face change.

`mascot-rabbit.png`는 내장 image_gen 도구로 생성한 원본 PNG다. 투명 배경의 정면 전신 이미지를 게임 속 빌보드로 사용한다. 원본 알파 채널을 보존한다.

## 최종 생성 프롬프트

Use case: stylized-concept. Asset type: transparent game character billboard sprite for a first-person school horror game. Create ONE original cute-but-unsettling full-body rabbit school mascot, front view, standing still and staring directly at viewer. Rounded large head, tall soft ears one slightly bent, pastel mint worn plush fur, cream muzzle and tummy, stubby mitten hands, big padded feet, a small faded school neckerchief. A cute toy silhouette but eerie vacant glossy dark button eyes with tiny pinprick reflections, fixed slightly too-wide stitched smile, subtle uneven facial seams. No fangs, no gore, no monster mouth. Detailed tactile plush pile and fabric stitching, softly aged and a little dusty. Rendered 3D game concept with soft overhead lighting and subtle ambient shading, enough brightness to read against a dark school corridor. Entire character including feet and ear tips inside frame, vertically centered with small margin, neutral front-facing pose with arms down slightly separated from body, no props. True transparent background with alpha, no ground plane, no cast background shadow, no environment, no text, no watermark. It should look like an appealing school mascot that becomes creepy when it stays motionless at night, an original design not a recognizable existing franchise character.
# 창밖 귀신

`window-ghost.png`: 내장 image_gen으로 생성한 1024×1536 투명 PNG. 사용자 참고 이미지의 검은 머리·낡은 도자기 얼굴 분위기로 만든 오리지널 귀신이며 창문 이상현상에 연결했다. 숲·가로등·창틀은 `window-view.js`와 기존 Canvas 렌더러에서 그린다.

최종 생성 프롬프트:

Use case: stylized-concept. Asset type: transparent game sprite for a first-person Korean school observation horror game. Reference: the user's third attached photo is mood inspiration only: a black-haired antique doll face with pale cracked peeling porcelain and lifeless black eyes. Create ONE original female-shaped ghost doll standing upright, front facing and staring directly at viewer, full body and hair fully visible. Long straight disheveled jet-black hair with center part, face exposed, desaturated pale ivory porcelain face with fine irregular cracks and a few chipped paint patches revealing grey clay (NOT injured flesh), half-open glossy dark doll eyes without glow, unsettling emotionless tiny closed mouth. Worn off-white long plain dress with aged fabric folds, thin arms hanging loose, bare porcelain feet. Adult-shaped elongated silhouette, slightly oversized doll head, no resemblance to identifiable person, no cute anime proportions. Cinematic tactile photoreal horror prop rendering compatible with plush mascot and porcelain doll sprites. Cool blue-green moonlight on hair and pale face with subtle warm rim light from streetlamp, face and dress readable when small in a dark window. Centered full body portrait with transparent margins, genuine transparent alpha background, no floor, no scene, no props, no window, no shadows on background, no text, no watermark, no blood, no gore, no open mouth or fangs. Character should be creepy through stillness and cracked lifeless face.
