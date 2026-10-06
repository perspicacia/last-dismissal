# 입 모양 보완·마른 혈흔 가면 귀신 자산

2026-10-06 사용자 요청: 벌린 입이 어설프므로 보완하고 얼굴에 피칠갑을 추가한다. 입꼬리·입술·턱의 긴장과 자연스러운 작은 치아/구강 그림자로 기존 작은 타원형 입을 수정했다.

**현재 적용 한계:** 핏자국이 많은 공격 표정 생성은 내장 도구의 안전 검사에서 두 차례 거절됐다(첫 결과는 sexual/violence, 완화된 결과는 violence). 노출된 상처 없는 가면 표현으로도 거절돼 혈흔의 양을 크게 줄인 비현실적 무대 가면으로 진행했다. 게임에는 이마와 뺨의 작은 마른 붉은 자국만 적용했으며, 요청한 얼굴 전체 피칠갑이 완성됐다고 보고하지 않는다. 강한 혈흔의 기본 얼굴 시안은 공격 표정과 연결하지 않고 채택하지 않았다.

- 기본: [schoolgirl-mask-stained.png](schoolgirl-mask-stained.png)
- 공격: [schoolgirl-mask-stained-attack.png](schoolgirl-mask-stained-attack.png)
- 내장 image_gen 기본 모드의 이미지 편집을 사용했다. CLI/API나 별도 키를 사용하지 않았다. 생성 결과를 크기/알파 변환 없이 프로젝트로 복사했다.
- 두 PNG는 1024×1536 RGBA다. 기본은 완전 투명 1,166,838px/alpha>200 391,048px, 공격은 완전 투명 1,164,655px/alpha>200 390,289px다.
- alpha>200 전체 경계: 기본 (296,27)–(728,1511), 공격 (300,27)–(725,1512). 얼굴 아래 불투명 윤곽 겹침은 99.36%다. 생성에 따른 옷의 잔주름 차이는 남아 있다.
- 일반 Three.js/Canvas, 첫 화면, 돌진과 비교 화면에서 같은 두 파일을 사용한다. 기본/공격의 마른 자국 위치를 유지한다. 무작위 배치·발견·음향/표정 전환·게임 오버·재시작 판정은 변경하지 않았다.
- 사진 기반 빌보드이며 새 관절형 3D 모델은 아니다. 이전 가면 자산과 [생성 기록](schoolgirl-mask.md), 초기 여고생/토끼 자산은 보존한다.
- [명세](../specs/masked-schoolgirl-ghost.md), [Issue #113](https://github.com/perspicacia/last-dismissal/issues/113), [검토 PR #114](https://github.com/perspicacia/last-dismissal/pull/114).

SHA-256:

- 기본: `c64a872ff2f8834f60f8ee476a9e18b1b9d18fba0960b00bdc0c1e22fa462938`
- 공격: `2e0e9654a65660d1f1e7166b725365ef948e15222150c831603289570da927e3`

## 공격 얼굴 최종 편집 프롬프트

Use case: precise-object-edit. Input image is the edit target: this exact chalk-white theatrical mask figure in the navy sailor costume. Create a non-graphic stage-mask open-mouth expression. Keep the white mask identity, very narrow black eyes, head outline and exact full-body pose/framing. Replace the closed lips with a broad, tense, slightly asymmetric open mouth: corners spread out, upper lip drawn back, lower lip extends down, small rounded teeth partly in a shaded mouth recess. Shape subtle cheek and chin creases around the opening so it looks physically connected, not a pasted black circle or a tiny surprised O. Keep the mouth interior stylized and shadowed; no detailed internal anatomy. Add ONLY a FEW SMALL muted burgundy dried-looking makeup stains on the forehead edge and one cheek. This revised design substantially reduces the red staining and excludes injuries, open wounds, wet blood, dripping liquid, damage or exposed tissue. Same matte white painted mask, hair, ears, collar, ribbon, navy costume, hands, feet and lighting. Everything below the face stays unchanged as far as possible. Preserve exact 1024x1536 full-body layout and genuine transparent alpha. No new backdrop, glow, scene, shadow, zoom or text.

## 기본 얼굴 최종 편집 프롬프트

Use case: identity-preserve. Edit target: this exact full-body mask apparition's newly revised non-graphic stage expression. Create its neutral companion texture. Change ONLY the open mouth to a small CLOSED dark burgundy mouth with a blank, rigid mask expression. Preserve the two small existing muted red makeup stains on the forehead edge and cheek exactly, keeping them subtle; no extra stains or injuries. Preserve face silhouette, narrow slit eyes, ears and hair. All pixels below the face, navy sailor uniform, collar stripes, ribbon, cloth, hands, legs and shoes as unchanged as possible. Same lighting, 1024x1536 full-body framing, pose, positions and genuine transparent alpha outline. No backdrop, fog, glow, text, zoom or crop. This must align with the attached open-mouth texture during the game's expression swap.
