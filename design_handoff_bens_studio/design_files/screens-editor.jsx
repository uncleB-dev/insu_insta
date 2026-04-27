// Screens: Step 1 (new), Step 2 (script), Step 3 (design), Step 4 (preview)
const { useState: uS2, useEffect: uE2, useMemo: uM2, useRef: uR2 } = React;

// ─────────────────────────────────────────────────────────────
// /posts/new  — Step 1
// ─────────────────────────────────────────────────────────────
function NewPostScreen({ navigate }) {
  const [topic, setTopic] = uS2('암치료비가 비싸다는데 얼마나?');
  const [series, setSeries] = uS2('A');
  const [persona, setPersona] = uS2('30s_office');
  const [facts, setFacts] = uS2('비급여 항암치료는 본인부담. 1회 수백만 원 단위. 비급여통합 + 진단비 구조가 핵심.');
  const [tone, setTone] = uS2('normal');
  const [slideCount, setSlideCount] = uS2(9);
  const [cta, setCta] = uS2('save');
  const [optionsOpen, setOptionsOpen] = uS2(false);
  const [keywords, setKeywords] = uS2('비급여, 1세대실손, 간병');
  const [emphasizeNoSell, setEmphasizeNoSell] = uS2(true);
  const [refs, setRefs] = uS2('');
  const [loading, setLoading] = uS2(false);

  const canGenerate = topic.trim() && facts.trim();

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/posts/p1/script'); }, 1400);
  };

  return (
    <div style={{maxWidth:720, margin:'0 auto'}} className="col gap-24">
      <div>
        <div className="row items-center gap-8" style={{marginBottom:6}}>
          <span style={{fontSize:24}}>1️⃣</span>
          <h1 className="h1" style={{margin:0}}>주제 입력</h1>
        </div>
        <div className="text-secondary">한 줄 주제와 핵심 팩트만 있으면 AI가 6원칙으로 9컷을 짜줍니다</div>
      </div>

      {/* 필수 정보 */}
      <div className="card card-pad-lg">
        <div className="h3" style={{marginBottom:16}}>필수 정보</div>
        <div className="col gap-20" style={{gap:20}}>
          <div>
            <div className="field-label">주제 한 줄 <span className="req">*</span></div>
            <textarea className="textarea" rows={2} value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="예: 암치료비가 비싸다는데 얼마나?" style={{minHeight:60}} />
          </div>

          <div className="row gap-12">
            <div style={{flex:1}}>
              <div className="field-label">시리즈 <span className="req">*</span></div>
              <select className="select" value={series} onChange={e => setSeries(e.target.value)}>
                {Object.entries(window.MOCK.SERIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <div className="field-label">페르소나 <span className="req">*</span></div>
              <select className="select" value={persona} onChange={e => setPersona(e.target.value)}>
                {Object.entries(window.MOCK.PERSONAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="field-label">핵심 팩트 <span className="req">*</span></div>
            <textarea className="textarea" rows={5} value={facts} onChange={e => setFacts(e.target.value)}
              placeholder="이 게시물에서 다룰 정확한 보장 구조·수치·법령을 적어주세요. AI는 이 범위 안에서만 작성합니다."
              style={{minHeight:120}} />
            <div className="field-hint">AI는 이 팩트 범위 밖의 수치를 만들어내지 않아요</div>
          </div>

          <div>
            <div className="field-label">톤 강도 <span className="req">*</span></div>
            <div className="radio-group">
              {[['soft','부드러움'],['normal','보통'],['strong','단호함']].map(([k, v]) => (
                <div key={k} className={'radio-pill ' + (tone === k ? 'on' : '')} onClick={() => setTone(k)}>{v}</div>
              ))}
            </div>
          </div>

          <div className="row gap-12">
            <div style={{flex:1}}>
              <div className="field-label">슬라이드 수</div>
              <select className="select" value={slideCount} onChange={e => setSlideCount(Number(e.target.value))}>
                <option value={7}>7컷</option>
                <option value={9}>9컷</option>
                <option value={11}>11컷</option>
              </select>
            </div>
            <div style={{flex:1}}>
              <div className="field-label">CTA</div>
              <select className="select" value={cta} onChange={e => setCta(e.target.value)}>
                <option value="save">저장 유도</option>
                <option value="share">공유 유도</option>
                <option value="dm">DM 문의</option>
                <option value="link">링크 클릭</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 옵션 (아코디언) */}
      <div className="card">
        <button onClick={() => setOptionsOpen(!optionsOpen)}
          style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:20, background:'transparent', border:'none', color:'var(--text-primary)', fontSize:16, fontWeight:600, cursor:'pointer'}}>
          <span>{optionsOpen ? '▾' : '▸'} 옵션 (선택)</span>
          <span className="small">{optionsOpen ? '접기' : '펼치기'}</span>
        </button>
        {optionsOpen && (
          <div className="col gap-16" style={{padding:'0 24px 24px'}}>
            <div>
              <div className="field-label">핵심 키워드</div>
              <input className="input" value={keywords} onChange={e => setKeywords(e.target.value)} />
              <div className="field-hint">쉼표로 구분 (예: 비급여, 1세대실손)</div>
            </div>
            <label className="row items-center gap-8" style={{cursor:'pointer'}}>
              <input type="checkbox" className="checkbox" checked={emphasizeNoSell} onChange={e => setEmphasizeNoSell(e.target.checked)} />
              <span>"안 파는 설계사" 페르소나 강조</span>
            </label>
            <div>
              <div className="field-label">참고 자료</div>
              <textarea className="textarea" rows={3} value={refs} onChange={e => setRefs(e.target.value)}
                placeholder="기사 링크, 약관 발췌, 메모 등 자유 입력" />
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="row gap-8" style={{justifyContent:'flex-end'}}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← 취소</button>
        <button className="btn btn-secondary">📋 템플릿</button>
        <button className="btn btn-primary" disabled={!canGenerate} onClick={handleGenerate}>
          스크립트 생성 →
        </button>
      </div>

      {loading && <LoadingDialog title="AI가 6원칙 적용 중..." sub={`${slideCount}컷 시나리오를 짜고 가드레일 통과 여부를 검사합니다`} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /posts/[id]/script — Step 2
// ─────────────────────────────────────────────────────────────
function ScriptScreen({ navigate, postId }) {
  const [slides, setSlides] = uS2(window.MOCK.SCRIPT_SLIDES.map(s => ({...s})));
  const [selectedIdx, setSelectedIdx] = uS2(2);
  const [showWarn, setShowWarn] = uS2(false);

  const selected = slides[selectedIdx];

  const greenCount = slides.filter(s => !s.guards || s.guards.length === 0).length;
  const yellowCount = slides.reduce((a, s) => a + (s.guards?.filter(g => g.kind === 'yellow').length || 0), 0);
  const redCount = slides.reduce((a, s) => a + (s.guards?.filter(g => g.kind === 'red').length || 0), 0);

  const updateSlide = (patch) => {
    setSlides(slides.map((s, i) => i === selectedIdx ? {...s, ...patch} : s));
  };

  const tryProceed = () => {
    if (redCount > 0) setShowWarn(true);
    else navigate('/posts/' + postId + '/design');
  };

  return (
    <div className="col gap-16" style={{height:'calc(100vh - 56px - 64px)'}}>
      <div className="row items-center justify-between">
        <div className="row items-center gap-8">
          <span style={{fontSize:24}}>2️⃣</span>
          <h1 className="h2" style={{margin:0}}>스크립트 편집</h1>
          <span className="text-secondary small">{slides.length}컷</span>
        </div>
        <div className="row gap-8">
          <button className="btn btn-secondary">🔄 전체 재생성</button>
          <button className="btn btn-primary" onClick={tryProceed}>디자인 →</button>
        </div>
      </div>

      <GuardrailScore green={greenCount} yellow={yellowCount} red={redCount} />

      <div style={{display:'grid', gridTemplateColumns:'360px 1fr', gap:16, flex:1, minHeight:0}}>
        {/* 슬라이드 리스트 */}
        <div className="col gap-8 scroll-y" style={{paddingRight:4}}>
          {slides.map((s, i) => (
            <SlideCard key={s.id} index={i} slide={s} selected={i === selectedIdx}
              onClick={() => setSelectedIdx(i)} />
          ))}
          <button className="btn btn-ghost" style={{justifyContent:'center', borderRadius:10, padding:14, border:'1.5px dashed var(--border-strong)'}}>
            ＋ 슬라이드 추가
          </button>
        </div>

        {/* 슬라이드 편집 */}
        <div className="card card-pad-lg scroll-y">
          <div className="row items-center justify-between" style={{marginBottom:16}}>
            <div className="row items-center gap-8">
              <span className="h3" style={{margin:0}}>슬라이드 {selectedIdx + 1}</span>
              <PrincipleBadge principle={selected.principle} />
            </div>
            <button className="btn btn-secondary btn-sm">🔄 이 슬라이드만 재생성</button>
          </div>
          <div className="divider" style={{margin:'0 0 20px'}}></div>

          <div className="col gap-16">
            <div className="row gap-12">
              <div style={{flex:1}}>
                <div className="field-label">6원칙 라벨</div>
                <select className="select" value={selected.principle}
                  onChange={e => updateSlide({principle: e.target.value})}>
                  {Object.entries(window.MOCK.PRINCIPLES).map(([k, v]) =>
                    <option key={k} value={k}>{v.emoji} {v.ko}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <div className="field-label">화자</div>
                <div className="radio-group">
                  {[['niece','조카'],['uncle','삼촌'],['none','없음']].map(([k, v]) => (
                    <div key={k} className={'radio-pill ' + (selected.speaker === k ? 'on' : '')}
                      onClick={() => updateSlide({speaker: k})}>{v}</div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="field-label">장면 묘사</div>
              <textarea className="textarea" rows={2} value={selected.scene}
                onChange={e => updateSlide({scene: e.target.value})} style={{minHeight:80}} />
            </div>

            <div>
              <div className="field-label row items-center gap-6">
                메인 텍스트
                {selected.guards?.some(g => g.kind === 'yellow') && <span style={{color:'var(--yellow)'}}>⚠️🟡</span>}
                {selected.guards?.some(g => g.kind === 'red') && <span style={{color:'var(--red)'}}>⚠️🔴</span>}
              </div>
              {/* Render with inline guard highlights */}
              <div className="card" style={{padding:'12px 14px', minHeight:80, fontSize:14, lineHeight:1.6, background:'var(--bg-tertiary)', border:'1px solid var(--accent)'}}>
                <GuardedText text={selected.main} guards={selected.guards} />
              </div>
              <div className="field-hint">옐로우/레드 단어를 클릭하면 자동 교체 제안</div>
            </div>

            <div>
              <div className="field-label">보조 텍스트</div>
              <textarea className="textarea" rows={2} value={selected.sub}
                onChange={e => updateSlide({sub: e.target.value})} style={{minHeight:60}} />
            </div>

            <div>
              <div className="field-label">강조 표현 (볼드 처리)</div>
              <div className="row gap-6" style={{flexWrap:'wrap'}}>
                {selected.emphasis.map((w, i) => (
                  <span key={i} className="tag">
                    <b style={{color:'var(--accent)'}}>{w}</b>
                    <span className="x" onClick={() => updateSlide({emphasis: selected.emphasis.filter((_, j) => j !== i)})}>✕</span>
                  </span>
                ))}
                <button className="btn btn-ghost btn-sm" style={{border:'1px dashed var(--border-strong)'}}>＋ 추가</button>
              </div>
            </div>

            {selected.guards && selected.guards.length > 0 && (
              <div>
                <div className="field-label">가드레일 경고 ({selected.guards.length})</div>
                <div className="col gap-6">
                  {selected.guards.map((g, i) => (
                    <div key={i} className="card" style={{padding:12,
                      borderColor: g.kind === 'red' ? 'var(--red)' : 'var(--yellow)',
                      background: g.kind === 'red' ? 'var(--red-bg)' : 'var(--yellow-bg)'}}>
                      <div className="row items-center justify-between">
                        <div>
                          <span style={{color: g.kind === 'red' ? 'var(--red)' : 'var(--yellow)', fontWeight:600}}>
                            {g.kind === 'red' ? '🔴 RED' : '🟡 YELLOW'}
                          </span>
                          <span className="mono" style={{marginLeft:8}}>"{g.word}"</span>
                          <span style={{margin:'0 8px'}}>→</span>
                          <span className="mono" style={{color:'var(--accent)'}}>"{g.suggest}"</span>
                        </div>
                        <button className="btn btn-secondary btn-sm">자동 수정</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWarn && (
        <div className="overlay" onClick={() => setShowWarn(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h2 className="h2" style={{margin:'0 0 12px', color:'var(--red)'}}>⚠️ 광고 심의 위험 {redCount}개</h2>
            <div className="text-secondary" style={{marginBottom:20}}>
              레드 가드레일에 걸린 표현이 남아 있어요. 그대로 진행하시겠어요?
            </div>
            <div className="row gap-8" style={{justifyContent:'flex-end'}}>
              <button className="btn btn-ghost" onClick={() => setShowWarn(false)}>돌아가서 수정</button>
              <button className="btn btn-destructive" onClick={() => { setShowWarn(false); navigate('/posts/' + postId + '/design'); }}>위험 감수하고 진행</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /posts/[id]/design — Step 3
// ─────────────────────────────────────────────────────────────
function DesignScreen({ navigate, postId }) {
  const slides = window.MOCK.SCRIPT_SLIDES;
  const [selIdx, setSelIdx] = uS2(2);
  const [layout, setLayout] = uS2('A');
  const [blur, setBlur] = uS2(8);
  const [overlay, setOverlay] = uS2(50);
  const [applyAll, setApplyAll] = uS2(false);
  const [textPos, setTextPos] = uS2('mid');
  const [accent, setAccent] = uS2('green');
  const [photoSrc, setPhotoSrc] = uS2('https://picsum.photos/seed/insu3/800/800');

  const sel = slides[selIdx];

  const layouts = [
    { id: 'A', name: '카톡 좌측', best: ['hook','problem','doubt'] },
    { id: 'B', name: '카톡 우측', best: ['problem','doubt'] },
    { id: 'C', name: 'Q&A 박스', best: ['solution','doubt'] },
    { id: 'D', name: '구조도',     best: ['solution'] },
    { id: 'E', name: '풀블리드',   best: ['hook','scarcity'] },
    { id: 'F', name: '인용 카드',  best: ['scarcity','cta'] },
    { id: 'G', name: '단순 타이틀', best: ['hook'] },
    { id: 'H', name: '리스트 카드', best: ['solution'] },
    { id: 'I', name: 'CTA 마감',    best: ['cta'] },
  ];

  const accentMap = { green:'#00FF88', yellow:'#FFD23F', red:'#FF4D6D', white:'#FFFFFF' };

  return (
    <div className="col gap-16" style={{height:'calc(100vh - 56px - 64px)'}}>
      <div className="row items-center justify-between">
        <div className="row items-center gap-8">
          <span style={{fontSize:24}}>3️⃣</span>
          <h1 className="h2" style={{margin:0}}>이미지 합성</h1>
        </div>
        <div className="row gap-8">
          <button className="btn btn-ghost" onClick={() => navigate('/posts/' + postId + '/script')}>← 스크립트로</button>
          <button className="btn btn-primary" onClick={() => navigate('/posts/' + postId + '/preview')}>미리보기 →</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'200px 1fr 320px', gap:16, flex:1, minHeight:0}}>
        {/* Left: slide thumbs */}
        <div className="col gap-8 scroll-y">
          {slides.map((s, i) => {
            const p = window.MOCK.PRINCIPLES[s.principle];
            return (
              <div key={s.id} onClick={() => setSelIdx(i)} style={{cursor:'pointer'}}>
                <div style={{position:'relative', aspectRatio:'1/1', borderRadius:8, overflow:'hidden',
                  border: i === selIdx ? '3px solid var(--accent)' : '1px solid var(--border)',
                  background: `linear-gradient(rgba(0,0,0,${overlay/100}), rgba(0,0,0,${overlay/100})), url(https://picsum.photos/seed/insu${i+10}/300/300)`,
                  backgroundSize:'cover'}}>
                  <div style={{position:'absolute', top:6, left:6, display:'flex', alignItems:'center', gap:4}}>
                    <span style={{width:8, height:8, borderRadius:'50%', background:p.color}}></span>
                    <span style={{fontSize:11, color:'#fff', fontWeight:600, textShadow:'0 1px 3px #000'}}>{i + 1}</span>
                  </div>
                  <div style={{position:'absolute', bottom:6, left:6, fontSize:10, color:'#fff',
                    fontWeight:600, padding:'2px 6px', background:'rgba(0,0,0,0.6)', borderRadius:4}}>{p.ko}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: 1080x1080 preview */}
        <div className="card card-pad" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0d0d'}}>
          <div style={{width:'min(540px, 100%)', aspectRatio:'1/1', borderRadius:8, position:'relative', overflow:'hidden',
            backgroundImage: `url(${photoSrc})`, backgroundSize:'cover', backgroundPosition:'center'}}>
            <div style={{position:'absolute', inset:0, background:`rgba(0,0,0,${overlay/100})`, backdropFilter:`blur(${blur}px)`, WebkitBackdropFilter:`blur(${blur}px)`}}></div>
            {/* Composed slide content */}
            <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column',
              justifyContent: textPos === 'top' ? 'flex-start' : textPos === 'bot' ? 'flex-end' : 'center',
              padding:32, color:'#fff'}}>
              {layout === 'A' || layout === 'B' ? (
                <div style={{alignSelf: layout === 'A' ? 'flex-start' : 'flex-end', maxWidth:'80%',
                  background: layout === 'A' ? '#fff' : '#FEE500', color:'#000', padding:'14px 18px',
                  borderRadius: layout === 'A' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  fontSize:20, fontWeight:600, lineHeight:1.4}}>
                  {sel.main}
                </div>
              ) : layout === 'C' ? (
                <div style={{background:'rgba(0,0,0,0.6)', border:`2px solid ${accentMap[accent]}`, borderRadius:12, padding:24}}>
                  <div style={{fontSize:14, color:accentMap[accent], fontWeight:700, marginBottom:8}}>Q.</div>
                  <div style={{fontSize:22, fontWeight:700, lineHeight:1.4}}>{sel.main}</div>
                </div>
              ) : (
                <div style={{textAlign:'center', fontSize:28, fontWeight:800, lineHeight:1.3, textShadow:'0 2px 12px rgba(0,0,0,0.6)'}}>
                  {sel.main}
                </div>
              )}
              {sel.sub && (
                <div style={{marginTop:14, fontSize:13, color:'#ddd', textAlign: layout === 'A' || layout === 'B' ? 'inherit' : 'center', textShadow:'0 1px 6px rgba(0,0,0,0.6)'}}>
                  {sel.sub}
                </div>
              )}
            </div>
            {/* Slide number badge */}
            <div style={{position:'absolute', bottom:16, right:16, padding:'4px 10px', borderRadius:12, background:'rgba(0,0,0,0.6)', fontSize:11, color:'#fff', fontWeight:600}}>
              {selIdx + 1} / {slides.length}
            </div>
          </div>
        </div>

        {/* Right: options */}
        <div className="col gap-16 scroll-y" style={{paddingLeft:4}}>
          <div>
            <div className="field-label">레이아웃 템플릿</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6}}>
              {layouts.map(L => {
                const isBest = L.best.includes(sel.principle);
                const isOn = L.id === layout;
                return (
                  <div key={L.id} onClick={() => setLayout(L.id)}
                    style={{aspectRatio:'1/1', border: isOn ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius:8, padding:6, cursor:'pointer',
                      background: isOn ? 'var(--accent-bg)' : (isBest ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'),
                      opacity: isBest ? 1 : 0.55,
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                      position:'relative'}}>
                    <span style={{fontSize:14, fontWeight:700}}>{L.id}</span>
                    <span style={{fontSize:9, color:'var(--text-muted)', textAlign:'center'}}>{L.name}</span>
                    {isBest && <span style={{position:'absolute', top:2, right:3, fontSize:8, color:'var(--accent)'}}>★</span>}
                  </div>
                );
              })}
            </div>
            <div className="field-hint">★ 표시는 이 6원칙에 어울리는 템플릿</div>
          </div>

          <div>
            <div className="field-label">배경 사진</div>
            <div className="row gap-4">
              <button className="btn btn-secondary btn-sm" style={{flex:1}}>📤 업로드</button>
              <button className="btn btn-secondary btn-sm" style={{flex:1}}>🔍 Unsplash</button>
              <button className="btn btn-secondary btn-sm" style={{flex:1}}>🖼️ 라이브러리</button>
            </div>
            <div style={{marginTop:8, display:'flex', gap:6, alignItems:'center'}}>
              <div style={{width:48, height:48, borderRadius:6, backgroundImage:`url(${photoSrc})`, backgroundSize:'cover'}}></div>
              <div className="small">현재 사진<br/><span className="text-muted">picsum #insu3</span></div>
            </div>
          </div>

          <div>
            <div className="field-label row justify-between"><span>흐림 강도</span><span className="text-muted">{blur}px</span></div>
            <input type="range" className="slider" min={0} max={20} value={blur} onChange={e => setBlur(Number(e.target.value))} />
          </div>
          <div>
            <div className="field-label row justify-between"><span>어두운 오버레이</span><span className="text-muted">{overlay}%</span></div>
            <input type="range" className="slider" min={0} max={90} value={overlay} onChange={e => setOverlay(Number(e.target.value))} />
          </div>

          <label className="row items-center gap-8" style={{cursor:'pointer'}}>
            <input type="checkbox" className="checkbox" checked={applyAll} onChange={e => setApplyAll(e.target.checked)} />
            <span className="small">전체 슬라이드 적용</span>
          </label>

          <div>
            <div className="field-label">텍스트 위치</div>
            <div className="radio-group">
              {[['top','상'],['mid','중'],['bot','하']].map(([k, v]) => (
                <div key={k} className={'radio-pill ' + (textPos === k ? 'on' : '')} onClick={() => setTextPos(k)}>{v}</div>
              ))}
            </div>
          </div>

          <div>
            <div className="field-label">강조 컬러</div>
            <div className="row gap-6">
              {Object.entries(accentMap).map(([k, c]) => (
                <button key={k} onClick={() => setAccent(k)}
                  style={{width:32, height:32, borderRadius:'50%', background:c,
                    border: accent === k ? '3px solid var(--text-primary)' : '1px solid var(--border)', cursor:'pointer'}}></button>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary" style={{justifyContent:'center'}}>🔄 재렌더링</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /posts/[id]/preview — Step 4 (also reused by Detail)
// ─────────────────────────────────────────────────────────────
function PreviewBody({ postId, hideStepActions }) {
  const slides = window.MOCK.SCRIPT_SLIDES;
  const [idx, setIdx] = uS2(2);
  const [pubStatus, setPubStatus] = uS2('draft');
  const [scheduleDate, setScheduleDate] = uS2('2026-04-30');
  const [caption, setCaption] = uS2('"오빠 친구가 휴직하고 엄마 간병하는데 하루 20만원씩 나온대" — 이 카톡 한 줄이 시작이야. 진짜 그런 보험 있냐고? 있어. 비급여통합 + 진단비 두 개로 가는 게 핵심인데, 자세한 건 슬라이드에서. 저장해두고 부모님께 공유해줘.');
  const [editingCaption, setEditingCaption] = uS2(false);
  const [tags, setTags] = uS2(window.MOCK.HASHTAGS);
  const [toast, setToast] = uS2(null);

  uE2(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(slides.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  const sel = slides[idx];

  const removeTag = (cat, t) => setTags({...tags, [cat]: tags[cat].filter(x => x !== t)});

  const triggerDownload = () => {
    setToast('ZIP 다운로드 완료 (이미지 9장 + caption.txt)');
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="col gap-24">
      {/* Carousel + phone */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:24}}>
        <div className="card card-pad">
          <div className="row items-center justify-between" style={{marginBottom:12}}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>◀</button>
            <div className="text-secondary">{idx + 1} / {slides.length}</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1}>▶</button>
          </div>
          <div style={{position:'relative', width:'100%', maxWidth:540, margin:'0 auto', aspectRatio:'1/1', borderRadius:8, overflow:'hidden',
            backgroundImage:`url(https://picsum.photos/seed/insu${idx+10}/800/800)`, backgroundSize:'cover'}}>
            <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)'}}></div>
            <div style={{position:'absolute', inset:0, padding:32, display:'flex', flexDirection:'column', justifyContent:'center', color:'#fff'}}>
              <div style={{alignSelf:'flex-start', maxWidth:'80%', background:'#fff', color:'#000', padding:'14px 18px',
                borderRadius:'4px 16px 16px 16px', fontSize:20, fontWeight:600, lineHeight:1.4, marginBottom:14}}>
                {sel.main}
              </div>
              <div style={{fontSize:13, color:'#ddd', textShadow:'0 1px 6px rgba(0,0,0,0.6)'}}>{sel.sub}</div>
            </div>
            <div style={{position:'absolute', top:12, left:12}}>
              <PrincipleBadge principle={sel.principle} />
            </div>
          </div>

          {/* Dots */}
          <div className="row gap-6" style={{justifyContent:'center', marginTop:16}}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{width: i === idx ? 24 : 8, height:8, borderRadius:4,
                  background: i === idx ? 'var(--accent)' : 'var(--bg-tertiary)', border:'none', cursor:'pointer', transition:'all .15s'}}></button>
            ))}
          </div>

          <div className="row" style={{justifyContent:'center', marginTop:16}}>
            <button className="btn btn-ghost btn-sm">💾 이 슬라이드 저장</button>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="card card-pad" style={{display:'flex', justifyContent:'center', alignItems:'center', background:'#0d0d0d'}}>
          <div className="phone">
            <div className="phone-screen">
              <div style={{padding:'28px 12px 8px', display:'flex', alignItems:'center', gap:8, color:'#fff', fontSize:13}}>
                <div style={{width:28, height:28, borderRadius:'50%', background:'linear-gradient(45deg,#feda75,#fa7e1e,#d62976)'}}></div>
                <div className="col gap-4">
                  <span style={{fontSize:12, fontWeight:600}}>uncleb_studio</span>
                  <span style={{fontSize:10, color:'#aaa'}}>스폰서</span>
                </div>
                <div style={{flex:1}}></div>
                <span style={{color:'#fff'}}>⋯</span>
              </div>
              <div style={{aspectRatio:'1/1', backgroundImage:`url(https://picsum.photos/seed/insu${idx+10}/600/600)`, backgroundSize:'cover', position:'relative'}}>
                <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.45)'}}></div>
                <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
                  <div style={{background:'#fff', color:'#000', padding:'10px 14px', fontSize:14, fontWeight:600, lineHeight:1.4, borderRadius:'4px 12px 12px 12px', maxWidth:'90%'}}>
                    {sel.main}
                  </div>
                </div>
                <div style={{position:'absolute', bottom:8, right:8, padding:'2px 6px', background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:9, borderRadius:4}}>{idx + 1}/{slides.length}</div>
              </div>
              <div style={{padding:'10px 12px', display:'flex', gap:14, color:'#fff', fontSize:18}}>
                <span>♡</span><span>💬</span><span>📤</span>
                <div style={{flex:1}}></div>
                <span>🔖</span>
              </div>
              <div style={{padding:'0 12px 12px', color:'#fff', fontSize:11, lineHeight:1.4}}>
                <b>uncleb_studio</b> {caption.slice(0, 80)}...
                <div style={{color:'#7a7', marginTop:4}}>#보험삼촌 #암보험 #비급여...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="card card-pad">
        <div className="row items-center justify-between" style={{marginBottom:8}}>
          <div className="h3" style={{margin:0}}>📝 캡션</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingCaption(!editingCaption)}>
            {editingCaption ? '저장' : '✏️ 편집'}
          </button>
        </div>
        {editingCaption ? (
          <textarea className="textarea" rows={5} value={caption} onChange={e => setCaption(e.target.value)} />
        ) : (
          <div style={{fontSize:14, lineHeight:1.6, color:'var(--text-primary)', whiteSpace:'pre-wrap'}}>{caption}</div>
        )}
      </div>

      {/* Hashtags */}
      <div className="card card-pad">
        <div className="row items-center justify-between" style={{marginBottom:12}}>
          <div className="h3" style={{margin:0}}>🏷️ 해시태그</div>
          <span className="small text-muted">{Object.values(tags).flat().length}개</span>
        </div>
        <div className="col gap-12">
          {[['brand','브랜드'],['topic','주제'],['target','타겟'],['general','일반']].map(([cat, label]) => (
            <div key={cat} className="row items-center gap-12" style={{flexWrap:'wrap'}}>
              <span className="small" style={{width:60, color:'var(--text-muted)', fontWeight:600}}>{label}:</span>
              {tags[cat].map(t => (
                <span key={t} className="tag">
                  <span style={{color:'var(--accent)'}}>#{t}</span>
                  <span className="x" onClick={() => removeTag(cat, t)}>✕</span>
                </span>
              ))}
              <button className="btn btn-ghost btn-sm" style={{border:'1px dashed var(--border-strong)'}}>＋ 추가</button>
            </div>
          ))}
        </div>
      </div>

      {/* Status + Download */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div className="card card-pad">
          <div className="h3" style={{marginBottom:12}}>📅 게시 상태</div>
          <div className="col gap-10">
            {[['draft','초안 (저장만)'],['scheduled','게시 예정'],['published','게시 완료']].map(([k, v]) => (
              <label key={k} className="row items-center gap-8" style={{cursor:'pointer', padding:'8px 10px', borderRadius:8,
                background: pubStatus === k ? 'var(--accent-bg)' : 'transparent', border: pubStatus === k ? '1px solid var(--accent)' : '1px solid var(--border)'}}>
                <input type="radio" checked={pubStatus === k} onChange={() => setPubStatus(k)} style={{accentColor:'var(--accent)'}} />
                <span style={{fontWeight:500}}>{v}</span>
                {k === 'scheduled' && pubStatus === 'scheduled' && (
                  <input type="date" className="input" style={{padding:'4px 8px', maxWidth:160, marginLeft:'auto'}}
                    value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div className="h3" style={{marginBottom:12}}>📦 다운로드</div>
          <div className="text-secondary small" style={{marginBottom:16}}>
            ZIP에는 1080×1080 이미지 9장 + caption.txt + hashtags.txt가 포함됩니다
          </div>
          <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'12px'}} onClick={triggerDownload}>
            📥 ZIP 다운로드
          </button>
        </div>
      </div>

      {toast && <Toast>✓ {toast}</Toast>}
    </div>
  );
}

function PreviewScreen({ navigate, postId }) {
  return (
    <div className="col gap-16">
      <div className="row items-center justify-between">
        <div className="row items-center gap-8">
          <span style={{fontSize:24}}>4️⃣</span>
          <h1 className="h2" style={{margin:0}}>미리보기 & 다운로드</h1>
        </div>
        <div className="row gap-8">
          <button className="btn btn-ghost" onClick={() => navigate('/posts/' + postId + '/design')}>← 디자인으로</button>
        </div>
      </div>
      <PreviewBody postId={postId} />
    </div>
  );
}

Object.assign(window, {
  NewPostScreen, ScriptScreen, DesignScreen, PreviewScreen, PreviewBody,
});
