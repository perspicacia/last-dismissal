# 현재 생존 버전의 캐릭터 역할

교복 여고생 귀신은 다섯 방 중 한 곳에 숨어 있다가 가까이서 응시하면 돌진하는 공격자다. 기존 토끼는 2026-10-06 사용자 요청으로 일반 게임/첫 화면에서 교체했고 과거 비교 자산으로 보존한다. 시작 시 보이지 않으며 방 배치는 새 게임마다 무작위다. 학생 인형은 3-2 바닥·3-1 책상의 정적 장식이다. 음악실 피아노 의자는 어린 남자아이 귀신으로 교체했다. 3-3과 무용실 창밖 귀신은 창가에 다가가 바라보면 미소를 짓지만 공격하지 않는다. 현재 규칙은 [specs/schoolgirl-attacker.md](specs/schoolgirl-attacker.md)를 따른다.

학생 인형은 [원본 외형 우선 명세](specs/student-doll-original-look.md)에 따라 모든 일반 교실에서 기존 PNG 기반 외형을 유지한다. 3-2 GLB 시안은 원본과 너무 다르다는 사용자 피드백으로 기본 적용을 해제하고 개발용 비교로 보존했다. 후속 실제 3D 모델은 도자기 얼굴·유리 눈·금발 컬·세일러복의 원본 실루엣과 재질을 기준으로 외형을 먼저 검토한다.

## 교복 여고생 공격자

현재 외형은 작은 마른 혈흔이 있는 하얀 가면 같은 무표정 얼굴·가늘고 검은 눈·긴 검은 생머리·남색 세일러복/주름치마·어두운 붉은 리본의 가상 인물이다. 기존 인물이 너무 아름답다는 사용자 피드백에 따라 2026-10-06 새 참고 디자인으로 교체했다. 발견 직후 잠깐 무표정으로 서 있다가 .55초에 입꼬리/입술·턱이 연결된 비명 표정으로 바뀌며 눈앞으로 다가오고, 1.5초 뒤 게임 오버가 된다. 투명 PNG 두 표정의 원본 비율을 유지하는 공간 빌보드이며 관절형 인체 모델은 아니다. 토끼의 팔 분할/피 얼룩을 적용하지 않는다. [자산·프롬프트](assets/schoolgirl-mask-stained.md), [최신 외형 명세](specs/masked-schoolgirl-ghost.md). 다른 분위기 캐릭터는 공격하지 않는다.

## 음악실 의자의 어린 남자아이 귀신

2026-10-02 사용자 요청으로 토시오 같은 조용한 어린아이 분위기를 참고했다. 창백한 피부, 짧은 검은 머리, 낡은 밝은 상의/반바지와 맨발, 멍한 시선으로 피아노 의자에 앉아 중앙 통로를 바라본다. 정적 분위기 요소로 공격·표정 변화·소리가 없다. [원본 이미지·프롬프트](assets/piano-boy-ghost.md)와 첫 화면을 보존한다. 2026-10-06 사용자가 무료 몸통 모델 활용을 채택해 Quaternius Standard CC0 인체에서 원작 머리/재질을 제외한 몸통/사지를 어린아이 비율의 앉은 자세로 변형했다. 원본 사진의 얼굴·머리를 유지하고 앞면 의상 질감을 연결한다. 상의/소매와 반바지는 인체와 분리된 느슨한 입체 표면으로 보완했다. 손목/무릎/종아리 비율과 발가락을 조정하고 원본의 손 사진을 바지에 중복하지 않는다. 얼굴 비율은 보존하지만 사진 기반 머리와 옆/뒤 의상은 근사이므로 원본과 동일한 전 방향 3D 재현은 아니다. 좌석/맨발 접촉과 모델 재사용을 유지하며 파일 로딩 실패 때 이전 사진 기반 외형으로 계속 진행한다. Canvas는 기존 사진 투영이다. [최신 명세](specs/piano-boy-free-body.md), [무료 모델·CC0 출처](assets/models/piano-boy-body.md).

## 얼굴 없는 교복 학생

2026-10-03 사용자가 새 캐릭터의 디자인/배치를 위임했다. 낡은 회색 교복·검은 머리·매끈한 도자기 얼굴로 기존 인형들과 어울리는 정적인 귀신을 제작했다. 3-3 교실 안쪽 칠판 옆 오른쪽 구석에 서 있으며 새 공격·표정·효과음은 없다. 2026-10-04 원본 정면 사진을 보존한 닫힌 3D 머리/몸/팔다리로 보완했다. 로딩 중/실패는 숨기고 Canvas는 기존 사진 투영을 유지한다. [초기 명세](specs/faceless-student-upgrade.md), [최신 명세](specs/classroom-character-depth.md), [자산/최종 프롬프트](assets/faceless-student.md).

## 칠판을 바라보는 여학생

2026-10-04 요청으로 긴 검은 머리·어두운 교복·흰 양말의 여학생을 코드 기반 3D 메시로 만들었다. 3-2 가운데 오른쪽 의자 `(1.2,4.34)`에 앉아 칠판을 바라보며 입구에서는 뒷모습이 보인다. 기존 금발 바닥 인형과 별개이고 공격/소리/표정 변화는 없다. Canvas는 위치/자세를 공유하는 실루엣 근사다. [명세](specs/classroom-character-depth.md).

## 검은 고양이

2026-10-04 요청에 따라 검은 고양이를 코드 기반 입체 도형으로 만들었다. 2026-10-06 첨부 모델을 참고해 둥근 엉덩이·몸에서 올라오는 가슴/목·작은 금빛 눈과 주둥이·넓은 귀·위로 선 긴 꼬리를 보완했다. 미세한 털 결과 짧은 털 메시·수염을 사용하고 다리 표면은 두 관절을 따라 하나의 곡면으로 변형해 부품 사이의 단절을 줄였다. 상용 모델 파일을 도입한 것은 아니며 코드 기반 근사다. 잠깐 경계한 뒤 복도/교실의 안전한 바닥 통로를 가속·감속하며 지나가고, 두 관절/대각선 발의 접지 보행·작은 몸 움직임·유연한 꼬리를 사용한다. 큰 공중 도약은 없으며 약 3초간 나타난다. 울음은 하악질 뒤 갈라지는 앙칼스러운 고음 합성음이다. 분위기 요소로 공격/게임 오버 판정이 없고 방 이동·종료·재시작 때 숨는다. 동작 줄이기에서는 정지 자세, Canvas는 공유 발 위치의 실루엣 근사다. 기존 캐릭터 PNG와 첫 화면의 다섯 귀신은 유지한다. [초기 명세](specs/windows-black-cat.md), [보행·음향 명세](specs/black-cat-polish.md), [최신 외형 명세](specs/cat-boy-likeness.md).

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
| 모루 / 토끼 | 민트색 봉제 털, 검은 단추 눈, 목도리 | 무작위 교실 안 | 발견 시 기본 표정으로 나타나고 접근 중 날카로운 이빨을 드러낸다 | 과거 비교 자산으로 보존, 일반 공격자는 여고생으로 교체 |
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

- 토끼 얼굴 최신 외형: 원본 무표정/이빨 이미지 위에 피 번짐·흐르는 자국·작은 튄 얼룩을 같은 좌표로 적용한다. 원본 비율과 털/눈/이빨을 보존한다. [최신 외형 명세](specs/darker-school-blood-rabbit.md).
