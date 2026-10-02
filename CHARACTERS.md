# 현재 생존 버전의 캐릭터 역할

토끼는 다섯 방 중 한 곳에 숨어 있다가 가까이서 응시하면 돌진하는 공격자다. 시작 시 보이지 않으며 방 배치는 새 게임마다 무작위다. 학생 인형은 3-2 바닥·3-1 책상·음악실 의자의 정적 장식이다. 3-3과 무용실 창밖 귀신은 창가에 다가가 바라보면 미소를 짓지만 공격하지 않는다. 현재 규칙은 [specs/hidden-rabbit-rooms.md](specs/hidden-rabbit-rooms.md)를 따른다.

학생 인형은 [원본 외형 우선 명세](specs/student-doll-original-look.md)에 따라 모든 일반 교실에서 기존 PNG 기반 외형을 유지한다. 3-2 GLB 시안은 원본과 너무 다르다는 사용자 피드백으로 기본 적용을 해제하고 개발용 비교로 보존했다. 후속 실제 3D 모델은 도자기 얼굴·유리 눈·금발 컬·세일러복의 원본 실루엣과 재질을 기준으로 외형을 먼저 검토한다.

# 마지막 하교 — 캐릭터 기획 초안

## 창밖 귀신 — 세 번째 캐릭터

사용자의 2026-10-01 요청으로 창밖 귀신 제작·적용을 진행했다. 기존 학생 인형의 추가 제작 중단은 유지한다. 검은 긴 머리, 갈라지고 일부 벗겨진 도자기 얼굴, 낡은 흰 옷의 오리지널 귀신이다. `assets/window-ghost.png`는 내장 image_gen으로 만든 1024×1536 투명 PNG이며 최종 프롬프트는 `assets/README.md`에 기록했다.

기존 창문 이상현상을 대체해 앞쪽 6–8m 창 밖에 한 명만 서서 학교 안을 바라본다. 이전 이상현상 비교 화면에서는 이 조건을 유지한다. 일반 탐색에서는 3-3과 무용실 창밖에 정적으로 배치한다. 추격·점프스케어는 구현하지 않았다. 일반 탐색에서는 근접 응시 시 기하학적인 미소와 고개 기울임으로 표정을 연출한다. 기존 부엉이 후보는 세 번째 캐릭터로 채택하지 않았다.


## 최신 공포 표정: 세로 동공

최신 수정안은 `assets/doll-student-open-slit-eyes.png`다. 사용자가 눈이 너무 요정처럼 보인다고 피드백하여, 입을 벌린 표정의 눈을 가늘고 긴 검은 세로 동공과 탁한 옅은 홍채로 변경하고 반짝임을 줄였다. 기본 모습(`doll-student-concept.png`)과 이전 시안을 보존했다. 내장 image_gen 편집 도구 사용. 교실의 doll 이상현상에서 기립하며 이 표정으로 전환한다.

### 세로 동공 버전 최종 편집 프롬프트

Use case: precise-object-edit. The supplied image is the edit target, an original blond porcelain school doll with a wide open sharp-toothed grin. Change ONLY the eyes to give the scary expression an unmistakably menacing predator gaze instead of cute sparkly fairy eyes. In BOTH eyes replace the large round black pupils with very thin, long, jet-black VERTICAL SLIT pupils, pointed at top and bottom, aligned with the tilted face. Make the irises muted pale desaturated amber-gray, reduce the glossy catchlights to almost none, remove sparkling jewel-like reflections, add subtly dark upper eyelid shadows. Keep the doll staring directly at the viewer with wide open eyes; not sleepy, not smiling with the eyes. The slit pupil shape must be very legible in both eyes. Preserve the existing eye outline, eye placement, head shape, facial skin and nose, exact existing wide open mouth and sharp teeth. Keep the hair, head tilt, uniform, ribbon, body, pose, hands, ball joints, socks, shoes and all non-eye areas unchanged as closely as possible. Exact original 1024x1536 full-body framing and character scale. Preserve transparent alpha background and original lighting outside the eyes. No blood, no gore, no glowing eyes, no eye beams, no new cracks or accessories, no text, no comparisons. ONE alternate full-body game sprite of the same doll.

이름과 추가 캐릭터는 제안 단계다. 기존 토끼는 게임에 적용되어 있다. 학생 인형의 기존 외형은 사용자가 기본 모습으로 확정했으며, 기본 표정과 기괴한 미소 버전을 저장했다. 학생 인형은 교실의 doll 이상현상에서 기립하며 이 표정으로 전환한다. 부엉이는 아직 이미지와 구현이 없는 후보다.

## 공통 방향

학교 축제와 동아리 전시를 위해 만든 인형들이 밤에 이상하게 변한다. 처음에는 귀엽고 친숙하지만, 시선·표정·소리가 어긋나는 순간 공포를 느끼게 한다. 캐릭터마다 공포를 만드는 방법을 다르게 한다.

| 캐릭터 / 가칭 | 외형 | 평소 위치 제안 | 공포 연출 제안 | 현재 상태 |
| --- | --- | --- | --- | --- |
| 모루 / 토끼 | 민트색 봉제 털, 검은 단추 눈, 목도리 | 무작위 교실 안 | 발견 시 기본 표정으로 나타나고 접근 중 날카로운 이빨을 드러낸다 | 게임 적용 완료 |
| 루미 / 학생 인형 | 금발 단발, 남색 세일러복, 유리 눈, 구체 관절 | 3-2 교실 뒤쪽 바닥 | 현재 정적 장식. 이전 doll 이상 기립은 비교 화면에 보존 | 원본 2.5D 복구, GLB는 비교 시안, 리깅 미구현 |
| 또각 / 부엉이 | 둥근 갈색 몸, 큰 눈, 작은 교모 | 방송실 앞 | 낮에는 안내 마스코트. 밤에는 주인공의 마지막 말을 방송으로 되풀이한다 | 후보, 미제작 |

## 학생 인형 외형

사용자가 준 이미지의 금발 단발, 넓은 세일러 칼라, 조용한 분위기를 참고했다. 그대로 재현하는 대신, 천 의상과 도자기 얼굴·관절을 가진 오리지널 인형으로 구성했다.

파일: `assets/doll-student-concept.png`. 내장 image_gen 생성 도구 사용. 투명 PNG 원본을 그대로 보존했다.

## 확정된 기본 모습과 대체 표정

- 기본: `assets/doll-student-concept.png`. 사용자가 확정한 외형이며 기존 파일을 보존한다.
- 기괴한 미소: `assets/doll-student-smile.png`. 과도하게 올라간 입꼬리와 길게 벌어진 웃음선, 웃지 않는 유리 눈을 강조했다. 머리·옷·자세·전신 구도를 기본 이미지에 맞췄다. 내장 image_gen 편집 도구 사용.
- 두 파일 모두 1024×1536 투명 PNG다. 게임에서는 기본 이미지와 최신 세로 동공 표정을 사용하며, 닫힌 입 미소는 이전 시안으로 보존한다.

### 미소 버전 최종 편집 프롬프트

Use case: precise-object-edit. Input image is the edit target: an original blond sailor-uniform porcelain school doll. Create ONE alternate expression sprite of exactly this same doll. Change ONLY the facial expression: a deeply uncanny, exaggerated closed-lip smile, mouth stretched unnaturally wide across the lower cheeks and corners curled too far upward, with a very thin dark gap between the lips. The big amber glass eyes remain wide, emotionally blank and fixed on the viewer, with a very slight tense lower eyelid; the eyes must not smile. The contrast between the unnaturally happy mouth and the lifeless staring eyes should feel frightening, a possessed collectible doll, while still recognizably the same cute doll. Preserve the original nose and eye color, head outline, blond curled bob and every hair placement as closely as possible, exact same head tilt, proportions, pose, sailor collar, ribbon, navy dress, hands, ball joints, socks and shoes, original lighting and textures. Identical full-body framing, exact original 1024x1536 image dimensions, scale and placement so sprites can be swapped without jumping. Preserve transparent alpha background and original edge transparency. No sharp teeth, no fangs, no giant monster jaw, no blood, no tears, no facial cracks added, no text, no comparison sheet, no additional props. Keep all non-face areas unchanged.

사용자 피드백으로 학생 인형의 공포 표정을 크게 벌어진 입과 날카로운 이빨이 드러나는 웃음으로 수정했다. 시선과 고개 연출은 후속 제안으로 유지한다.

## 입을 크게 벌린 공포 표정 — 최신 수정안

`assets/doll-student-open.png`는 기본 인형을 내장 image_gen 편집 도구로 수정한 투명 PNG다. 크게 벌어진 어두운 입 안과 위아래 날카로운 이빨을 강조했다. 기본 파일은 그대로 보존하며, 이전의 닫힌 입 미소(`doll-student-smile.png`)는 이전 시안으로 남긴다. 게임의 공포 표정은 이 이미지에서 눈을 보완한 세로 동공 버전을 사용한다.

### 최신 최종 편집 프롬프트

Use case: precise-object-edit. The provided image is the edit target, an original blond porcelain sailor-uniform school doll. Make a MUCH scarier alternate expression for the SAME doll. Edit the lower face into a clearly WIDE OPEN unnatural laughing grin: stretch the mouth across nearly the entire lower face, pull both mouth corners high toward the cheeks, drop the lower jaw to reveal a large deep almost-black mouth cavity, and expose TWO unmistakable rows of long sharp pointed ivory teeth on the upper and lower edges. The mouth should have substantial vertical opening, not a thin smile or closed lips. Porcelain doll face still recognizable, large amber glass eyes stare wide and lifeless at the viewer, brows slightly tense. Uncanny possessed toy with an alarming joyful grin, visually as threatening as a monster plush mascot's open teeth-filled mouth. No gore, no blood. Keep the original face's nose, upper face, amber eye identity and original blond curls, head tilt, body, outfit, collar, ribbon, pose, hands, ball joints, socks and shoes unchanged as closely as possible. Exact same full-body framing and original 1024x1536 canvas, same character scale and feet position, same lighting and textures. Preserve transparent alpha background. ONE character only. No text, no props, no comparison layout. The previous closed-mouth expression was too cute: this version must visibly show a gaping mouth and predatory teeth while retaining the doll's identity.

## 학생 인형 최종 생성 프롬프트

Use case: stylized-concept. Asset type: original character concept and transparent full-body doll sprite for a school observation horror game. The supplied image is a mood and wardrobe reference only, NOT an edit target: take inspiration from its softly curled short blond bob, large thoughtful eyes, dark navy sailor school uniform with a broad cream collar, and quiet melancholic atmosphere. Create ONE original human-shaped school doll that is initially cute, with a subtle unsettling doll quality, compatible with a tactile rendered plush mascot horror game. Full-body upright front view, neutral arms hanging loosely, centered with feet and hair fully visible and small transparent margins. Short honey-blond softly curled bob, large amber glass doll eyes looking at the viewer, pale matte porcelain face with a barely perceptible fixed polite smile, small visible ball-jointed wrists and knees, navy sailor uniform with cream collar and ribbon, knee-length skirt, cream socks and dark rounded shoes. Gentle stylized doll proportions with moderately oversized head, not a realistic human child. Real textile weave in clothes, subtle scuffed porcelain and fine hair fibers, muted aged colors. Sweet collectible-doll face, unsettling lifeless stillness, one slightly lowered shoulder and a slight natural head tilt. Soft overhead light suitable for compositing into a greenish dark school corridor. No open mouth, no sharp teeth, no gore, no wounds, no extra characters, no props, no text or watermark. True transparent alpha background, no floor or scene, no cast background shadow. The subject is an original doll and must not reproduce any identifiable anime character or exact costume insignia from the reference.

## 교실 기립 이벤트

[specs/classroom-doll.md](specs/classroom-doll.md)에 따라 정상에서는 누워 있고, doll 이상에서 1.9m 이내 접근·0.3초 응시 후 0.55초 동안 일어난다. 교실 문 손자국이 복도 단서다. 재입장은 기립을 유지하고 새 복도·재시작은 초기화한다. 기존 투명 이미지 실루엣을 곡면·두께가 있는 입체 볼륨으로 만들어 기울여 세우며 추가 이미지 제작은 하지 않았다.
