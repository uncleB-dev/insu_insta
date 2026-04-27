// Screens: /admin/prompts, /admin/guardrails
const { useState: uS3 } = React;

// ─────────────────────────────────────────────────────────────
// /admin/prompts
// ─────────────────────────────────────────────────────────────
function AdminPromptsScreen({ navigate }) {
  const [category, setCategory] = uS3('script_generation');
  const [body, setBody] = uS3(window.MOCK.PROMPT_BODY);
  const [editing, setEditing] = uS3(false);
  const versions = window.MOCK.PROMPT_VERSIONS;

  // highlight {variables} in body
  const highlightedBody = body.split(/(\{[^}]+\})/).map((part, i) => {
    if (/^\{[^}]+\}$/.test(part)) {
      return <span key={i} style={{color:'var(--accent)', background:'var(--accent-bg)', padding:'1px 4px', borderRadius:3}}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });

  return (
    <div className="col gap-24">
      <PageHeader
        title="⚙️ 프롬프트 관리"
        subtitle="AI 프롬프트의 활성 버전과 변경 이력을 관리합니다"
        right={<button className="btn btn-secondary">＋ 새 버전</button>}
      />

      <div className="row items-center gap-8">
        <span className="small">카테고리:</span>
        <select className="select" style={{maxWidth:240}} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="script_generation">스크립트 생성</option>
          <option value="caption_generation">캡션 생성</option>
          <option value="hashtag_suggestion">해시태그 추천</option>
          <option value="guardrail_rewrite">가드레일 자동 수정</option>
        </select>
      </div>

      {/* Active prompt card */}
      <div className="card">
        <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div className="row items-center gap-8">
            <span className="mono" style={{fontSize:14, fontWeight:700}}>script_generation</span>
            <span className="badge badge-status-published">v3 활성</span>
            <span className="small text-muted">2026-04-25 · BEN</span>
          </div>
          <div className="row gap-6">
            {!editing && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>편집</button>}
            {editing && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>취소</button>
                <button className="btn btn-primary btn-sm" onClick={() => setEditing(false)}>💾 저장</button>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <textarea className="textarea mono" value={body} onChange={e => setBody(e.target.value)}
            style={{border:'none', borderRadius:0, minHeight:420, background:'#0d0d0d', padding:20, lineHeight:1.7}} />
        ) : (
          <pre className="mono" style={{margin:0, padding:20, background:'#0d0d0d', whiteSpace:'pre-wrap',
            lineHeight:1.7, color:'var(--text-primary)', fontSize:13, maxHeight:480, overflowY:'auto'}}>
            {highlightedBody}
          </pre>
        )}
        <div style={{padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8}}>
          <button className="btn btn-ghost btn-sm">🔄 이전 버전 보기</button>
          <button className="btn btn-ghost btn-sm">🧪 샘플로 테스트</button>
          <div style={{flex:1}}></div>
          <button className="btn btn-destructive btn-sm">✕ 비활성화</button>
        </div>
      </div>

      {/* Variable hint */}
      <div className="card card-pad">
        <div className="h3" style={{marginBottom:8}}>사용 가능한 변수</div>
        <div className="row gap-8" style={{flexWrap:'wrap'}}>
          {['{topic}','{series}','{persona}','{facts}','{tone}','{slide_count}','{cta}','{keywords}'].map(v => (
            <span key={v} className="tag mono" style={{color:'var(--accent)'}}>{v}</span>
          ))}
        </div>
      </div>

      {/* Version history */}
      <div className="card">
        <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:600}}>버전 히스토리</div>
        {versions.map((v, i) => (
          <div key={v.v} className="row items-center" style={{padding:'14px 20px', gap:16,
            borderBottom: i < versions.length - 1 ? '1px solid var(--border)' : 'none'}}>
            <span className="mono" style={{fontWeight:700, width:48}}>{v.v}</span>
            {v.active
              ? <span className="badge badge-status-published">활성</span>
              : <span className="badge">비활성</span>}
            <span className="small">{v.date}</span>
            <span className="small text-muted">{v.author}</span>
            <div style={{flex:1}}></div>
            <button className="btn btn-ghost btn-sm">미리보기</button>
            {!v.active && <button className="btn btn-secondary btn-sm">활성화</button>}
            <button className="btn btn-ghost btn-sm">📋 복제</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /admin/guardrails
// ─────────────────────────────────────────────────────────────
function AdminGuardrailsScreen({ navigate }) {
  const [rules, setRules] = uS3(window.MOCK.GUARDRAIL_RULES);
  const [filterLevel, setFilterLevel] = uS3('all');
  const [filterKind, setFilterKind] = uS3('all');
  const [showAdd, setShowAdd] = uS3(false);
  const [draft, setDraft] = uS3({ level: 'yellow', kind: 'word', pattern: '', message: '', replace: '', active: true });

  const toggle = (id) => setRules(rules.map(r => r.id === id ? {...r, active: !r.active} : r));
  const remove = (id) => setRules(rules.filter(r => r.id !== id));
  const addRule = () => {
    if (!draft.pattern.trim()) return;
    setRules([...rules, {...draft, id: 'g' + (rules.length + 1)}]);
    setDraft({ level: 'yellow', kind: 'word', pattern: '', message: '', replace: '', active: true });
    setShowAdd(false);
  };

  const filtered = rules.filter(r => {
    if (filterLevel !== 'all' && r.level !== filterLevel) return false;
    if (filterKind !== 'all' && r.kind !== filterKind) return false;
    return true;
  });

  const counts = {
    red: rules.filter(r => r.level === 'red').length,
    yellow: rules.filter(r => r.level === 'yellow').length,
    green: rules.filter(r => r.level === 'green').length,
  };

  const levelMeta = {
    red: { dot: '🔴', label: 'RED', color: 'var(--red)' },
    yellow: { dot: '🟡', label: 'YEL', color: 'var(--yellow)' },
    green: { dot: '🟢', label: 'GRN', color: 'var(--green)' },
  };

  return (
    <div className="col gap-24">
      <PageHeader
        title="🛡️ 가드레일 룰"
        subtitle="레드(차단) · 옐로우(약화) · 그린(안전) 표현 사전"
        right={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>＋ 룰 추가</button>}
      />

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
        <div className="stat-card" style={{borderLeft:'3px solid var(--red)'}}>
          <div className="num" style={{color:'var(--red)'}}>{counts.red}</div>
          <div className="lbl">🔴 레드 (자동 차단)</div>
        </div>
        <div className="stat-card" style={{borderLeft:'3px solid var(--yellow)'}}>
          <div className="num" style={{color:'var(--yellow)'}}>{counts.yellow}</div>
          <div className="lbl">🟡 옐로우 (대체어 제안)</div>
        </div>
        <div className="stat-card" style={{borderLeft:'3px solid var(--green)'}}>
          <div className="num text-accent">{counts.green}</div>
          <div className="lbl">🟢 그린 (안전 표현)</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row items-center gap-8">
          <span className="small">등급:</span>
          <select className="select" style={{maxWidth:140}} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="all">전체</option>
            <option value="red">🔴 레드</option>
            <option value="yellow">🟡 옐로우</option>
            <option value="green">🟢 그린</option>
          </select>
          <span className="small">타입:</span>
          <select className="select" style={{maxWidth:140}} value={filterKind} onChange={e => setFilterKind(e.target.value)}>
            <option value="all">전체</option>
            <option value="word">word</option>
            <option value="regex">regex</option>
          </select>
          <div style={{flex:1}}></div>
          <span className="small text-muted">{filtered.length}개 표시</span>
        </div>
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'80px 80px 1fr 1.4fr 110px 80px 100px',
          padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:600,
          color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em'}}>
          <span>등급</span><span>타입</span><span>패턴</span><span>메시지 / 대체어</span><span>활성</span><span></span><span></span>
        </div>
        {filtered.map((r, i) => {
          const m = levelMeta[r.level];
          return (
            <div key={r.id} style={{display:'grid', gridTemplateColumns:'80px 80px 1fr 1.4fr 110px 80px 100px',
              padding:'12px 16px', alignItems:'center', gap:8,
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <span style={{color: m.color, fontWeight:700, fontSize:12}}>{m.dot} {m.label}</span>
              <span className="mono small">{r.kind}</span>
              <span className="mono" style={{fontSize:13, color:'var(--text-primary)'}}>{r.pattern}</span>
              <span className="small">
                <span style={{color:'var(--text-secondary)'}}>{r.message}</span>
                {r.replace && <> <span style={{color:'var(--text-muted)'}}>→</span> <span style={{color:'var(--accent)'}}>{r.replace}</span></>}
              </span>
              <input type="checkbox" className="switch" checked={r.active} onChange={() => toggle(r.id)} />
              <button className="btn btn-ghost btn-sm">편집</button>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={() => remove(r.id)}>삭제</button>
            </div>
          );
        })}
      </div>

      {/* Add rule dialog */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()} style={{width:520}}>
            <h2 className="h2" style={{margin:'0 0 16px'}}>＋ 가드레일 룰 추가</h2>
            <div className="col gap-12">
              <div>
                <div className="field-label">등급</div>
                <div className="radio-group">
                  {['red','yellow','green'].map(lv => (
                    <div key={lv} className={'radio-pill ' + (draft.level === lv ? 'on' : '')}
                      onClick={() => setDraft({...draft, level: lv})}>
                      {levelMeta[lv].dot} {levelMeta[lv].label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">타입</div>
                <div className="radio-group">
                  <div className={'radio-pill ' + (draft.kind === 'word' ? 'on' : '')} onClick={() => setDraft({...draft, kind: 'word'})}>word (정확 매칭)</div>
                  <div className={'radio-pill ' + (draft.kind === 'regex' ? 'on' : '')} onClick={() => setDraft({...draft, kind: 'regex'})}>regex</div>
                </div>
              </div>
              <div>
                <div className="field-label">패턴 <span className="req">*</span></div>
                <input className="input mono" value={draft.pattern} onChange={e => setDraft({...draft, pattern: e.target.value})}
                  placeholder={draft.kind === 'word' ? '예: 가입' : '예: 월\\s*\\d+\\s*만'} />
              </div>
              <div>
                <div className="field-label">메시지</div>
                <input className="input" value={draft.message} onChange={e => setDraft({...draft, message: e.target.value})}
                  placeholder="권유 표현 약화" />
              </div>
              <div>
                <div className="field-label">추천 대체어</div>
                <input className="input" value={draft.replace} onChange={e => setDraft({...draft, replace: e.target.value})}
                  placeholder="준비" />
              </div>
              <label className="row items-center gap-8" style={{cursor:'pointer'}}>
                <input type="checkbox" className="checkbox" checked={draft.active} onChange={e => setDraft({...draft, active: e.target.checked})} />
                <span>즉시 활성화</span>
              </label>
            </div>
            <div className="row gap-8" style={{justifyContent:'flex-end', marginTop:20}}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>취소</button>
              <button className="btn btn-primary" onClick={addRule}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AdminPromptsScreen, AdminGuardrailsScreen });
