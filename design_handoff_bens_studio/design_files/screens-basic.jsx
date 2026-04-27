// Screens: Login, Dashboard, History, Detail, Library
const { useState: uS1, useEffect: uE1, useMemo: uM1 } = React;

// ─────────────────────────────────────────────────────────────
// /login
// ─────────────────────────────────────────────────────────────
function LoginScreen({ navigate }) {
  const [email, setEmail] = uS1('ben@unclebstudio.com');
  const [pw, setPw] = uS1('••••••••');
  return (
    <div className="login-shell">
      <div className="col items-center gap-8" style={{textAlign:'center'}}>
        <div style={{fontSize:42}}>🟢</div>
        <h1 className="h1" style={{margin:0, color:'var(--accent)'}}>보험삼촌 BEN's Studio</h1>
        <div className="text-secondary">한 줄 주제로 카드뉴스 9컷이 나오는 인스타 스튜디오</div>
      </div>
      <div className="card card-pad-lg" style={{width:400}}>
        <div className="col gap-16">
          <div>
            <div className="field-label">이메일</div>
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="field-label">비밀번호</div>
            <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{justifyContent:'center', padding:'12px'}} onClick={() => navigate('/')}>
            로그인 →
          </button>
        </div>
      </div>
      <div className="small">© 2026 unclebstudio · Phase 1 · 본인 전용</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// / (Dashboard)
// ─────────────────────────────────────────────────────────────
function DashboardScreen({ navigate }) {
  const [topic, setTopic] = uS1('');
  const recent = window.MOCK.POSTS.slice(0, 5);

  return (
    <div className="col gap-32" style={{maxWidth:1080}}>
      <div>
        <h1 className="h1" style={{margin:'0 0 4px'}}>안녕하세요, BEN님 👋</h1>
        <div className="text-secondary">오늘은 어떤 주제로 가볼까요?</div>
      </div>

      {/* Quick start */}
      <div className="card card-pad-lg">
        <div className="h3" style={{marginBottom:4}}>＋ 새 게시물 만들기</div>
        <div className="text-secondary small" style={{marginBottom:16}}>주제 한 줄을 입력하면 1단계 입력 화면으로 이어져요</div>
        <div className="row gap-8">
          <input className="input" placeholder="예: 암치료비가 비싸다는데 얼마나?"
            value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigate('/posts/new'); }} />
          <button className="btn btn-primary" disabled={!topic.trim()} onClick={() => navigate('/posts/new')}>
            생성 →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="h3" style={{marginBottom:12}}>📊 이번 달 통계</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16}}>
          <div className="stat-card"><div className="num">12</div><div className="lbl">생성</div></div>
          <div className="stat-card"><div className="num text-accent">8</div><div className="lbl">게시</div></div>
          <div className="stat-card"><div className="num">4</div><div className="lbl">초안</div></div>
          <div className="stat-card"><div className="num text-accent">100%</div><div className="lbl">안전 (레드 0)</div></div>
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="row items-center justify-between" style={{marginBottom:12}}>
          <div className="h3">🕐 최근 게시물</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/posts')}>전체 보기 →</button>
        </div>
        <div className="card" style={{padding:0}}>
          {recent.map((p, i) => (
            <div key={p.id}
              onClick={() => navigate('/posts/' + p.id)}
              style={{display:'flex', gap:16, padding:16, alignItems:'center', cursor:'pointer',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <div style={{width:80, height:80, borderRadius:8, background:'var(--bg-tertiary)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                backgroundImage:`url(https://picsum.photos/seed/${p.id}/200/200)`, backgroundSize:'cover'}}></div>
              <div className="col gap-4 flex-1" style={{minWidth:0}}>
                <div style={{fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.title}</div>
                <div className="small">{window.MOCK.SERIES[p.series].split(' · ')[0]} · {p.updated}</div>
              </div>
              <span className={'badge badge-status-' + p.status}>
                {p.status === 'published' ? '게시' : p.status === 'draft' ? '초안' : '예정'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /posts (History)
// ─────────────────────────────────────────────────────────────
function HistoryScreen({ navigate }) {
  const [view, setView] = uS1('grid');
  const [series, setSeries] = uS1('all');
  const [persona, setPersona] = uS1('all');
  const [status, setStatus] = uS1('all');
  const [q, setQ] = uS1('');

  const posts = window.MOCK.POSTS.filter(p => {
    if (series !== 'all' && p.series !== series) return false;
    if (persona !== 'all' && p.persona !== persona) return false;
    if (status !== 'all' && p.status !== status) return false;
    if (q && !p.title.includes(q)) return false;
    return true;
  });

  return (
    <div className="col gap-24">
      <PageHeader title="📝 히스토리" subtitle={`총 ${posts.length}개의 게시물`}
        right={<button className="btn btn-primary" onClick={() => navigate('/posts/new')}>＋ 새 게시물</button>} />

      <div className="card card-pad">
        <div className="col gap-12">
          <input className="input" placeholder="🔍 제목으로 검색..." value={q} onChange={e => setQ(e.target.value)} />
          <div className="row gap-8 items-center">
            <select className="select" value={series} onChange={e => setSeries(e.target.value)}>
              <option value="all">시리즈: 전체</option>
              {Object.entries(window.MOCK.SERIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" value={persona} onChange={e => setPersona(e.target.value)}>
              <option value="all">페르소나: 전체</option>
              {Object.entries(window.MOCK.PERSONAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">상태: 전체</option>
              <option value="draft">초안</option>
              <option value="scheduled">게시 예정</option>
              <option value="published">게시 완료</option>
            </select>
            <div style={{flex:1}}></div>
            <span className="small">보기:</span>
            <button className={'btn btn-sm ' + (view === 'grid' ? 'btn-secondary' : 'btn-ghost')} onClick={() => setView('grid')}>⊞ 그리드</button>
            <button className={'btn btn-sm ' + (view === 'list' ? 'btn-secondary' : 'btn-ghost')} onClick={() => setView('list')}>☰ 리스트</button>
          </div>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16}}>
          {posts.map(p => (
            <PostCard key={p.id} post={p} onClick={() => navigate('/posts/' + p.id)} />
          ))}
        </div>
      ) : (
        <div className="card" style={{padding:0}}>
          {posts.map((p, i) => (
            <div key={p.id} onClick={() => navigate('/posts/' + p.id)}
              style={{display:'flex', gap:16, padding:16, alignItems:'center', cursor:'pointer',
                borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <div style={{width:48, height:48, borderRadius:6, backgroundImage:`url(https://picsum.photos/seed/${p.id}/200/200)`, backgroundSize:'cover'}}></div>
              <div style={{flex:1, fontWeight:600}}>{p.title}</div>
              <span className="small">{window.MOCK.SERIES[p.series].split(' · ')[0]}</span>
              <span className="small">{window.MOCK.PERSONAS[p.persona]}</span>
              <span className="small">{p.updated}</span>
              <span className={'badge badge-status-' + p.status}>
                {p.status === 'published' ? '게시' : p.status === 'draft' ? '초안' : '예정'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="row items-center gap-8" style={{justifyContent:'center', marginTop:8}}>
        <button className="btn btn-ghost btn-sm">←</button>
        {[1,2,3,4].map(n => (
          <button key={n} className={'btn btn-sm ' + (n === 1 ? 'btn-secondary' : 'btn-ghost')}>{n}</button>
        ))}
        <button className="btn btn-ghost btn-sm">→</button>
      </div>
    </div>
  );
}

function PostCard({ post, onClick }) {
  const [hover, setHover] = uS1(false);
  return (
    <div className="card" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{cursor:'pointer', overflow:'hidden', position:'relative',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? 'var(--shadow-pop)' : 'none',
        transition:'all .15s',
      }}>
      <div style={{aspectRatio:'1/1', backgroundImage:`url(https://picsum.photos/seed/${post.id}/400/400)`, backgroundSize:'cover', position:'relative'}}>
        {hover && (
          <button className="btn btn-secondary btn-sm" style={{position:'absolute', top:8, right:8}}>⋯</button>
        )}
      </div>
      <div className="col gap-6" style={{padding:14}}>
        <div style={{fontWeight:600, fontSize:13, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
          {post.title}
        </div>
        <div className="row items-center justify-between">
          <span className="small">{post.series} · {window.MOCK.PERSONAS[post.persona]}</span>
        </div>
        <div className="row items-center justify-between">
          <span className="small">{post.updated}</span>
          <span className={'badge badge-status-' + post.status}>
            {post.status === 'published' ? '게시' : post.status === 'draft' ? '초안' : '예정'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /posts/[id]  Post detail (= preview view + actions)
// ─────────────────────────────────────────────────────────────
function PostDetailScreen({ navigate, postId }) {
  const post = window.MOCK.POSTS.find(p => p.id === postId) || window.MOCK.POSTS[0];

  return (
    <div className="col gap-24">
      <div className="row items-center justify-between">
        <div className="col gap-4">
          <div className="row items-center gap-8">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/posts')}>← 히스토리</button>
            <span className={'badge badge-status-' + post.status}>
              {post.status === 'published' ? '게시 완료' : post.status === 'draft' ? '초안' : '게시 예정'}
            </span>
          </div>
          <h1 className="h1" style={{margin:0}}>{post.title}</h1>
          <div className="text-secondary small">{window.MOCK.SERIES[post.series]} · {window.MOCK.PERSONAS[post.persona]} · {post.updated}</div>
        </div>
        <div className="row gap-8">
          <button className="btn btn-secondary" onClick={() => navigate('/posts/' + postId + '/script')}>✏️ 편집</button>
          <button className="btn btn-secondary" onClick={() => navigate('/posts/new')}>📋 복제</button>
          <button className="btn btn-destructive">🗑️ 삭제</button>
        </div>
      </div>

      {/* Reuses preview layout */}
      <PreviewBody postId={postId} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /library
// ─────────────────────────────────────────────────────────────
function LibraryScreen({ navigate }) {
  const [tab, setTab] = uS1('photos');
  const photos = window.MOCK.LIBRARY_PHOTOS;

  return (
    <div className="col gap-24">
      <PageHeader title="🖼️ 라이브러리" subtitle="이전에 사용한 배경 사진과 템플릿을 한곳에서" />

      <div className="row gap-4">
        <button className={'btn btn-sm ' + (tab === 'photos' ? 'btn-secondary' : 'btn-ghost')}
          onClick={() => setTab('photos')}>📷 배경 사진</button>
        <button className={'btn btn-sm ' + (tab === 'templates' ? 'btn-secondary' : 'btn-ghost')}
          onClick={() => setTab('templates')}>📐 템플릿</button>
      </div>

      {tab === 'photos' && (
        <div className="card card-pad">
          <div className="row gap-8" style={{marginBottom:16}}>
            <button className="btn btn-primary btn-sm">＋ 업로드</button>
            <button className="btn btn-secondary btn-sm">🔍 Unsplash 검색</button>
            <div style={{flex:1}}></div>
            <span className="small">{photos.length}장</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:8}}>
            {photos.map(ph => (
              <PhotoTile key={ph.id} photo={ph} />
            ))}
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="card card-pad">
          <div className="row gap-8" style={{marginBottom:16}}>
            <button className="btn btn-primary btn-sm">＋ 새 템플릿</button>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
            {['카톡 좌측 정렬', '카톡 우측 정렬', 'Q&A 박스', '구조도 강조', '풀블리드 인용', '단순 타이틀'].map((name, i) => (
              <div key={i} className="card" style={{padding:0, overflow:'hidden'}}>
                <div className="placeholder-zone" style={{aspectRatio:'1/1'}}>
                  <span>템플릿 {String.fromCharCode(65 + i)} 미리보기</span>
                </div>
                <div className="col gap-4" style={{padding:14}}>
                  <div style={{fontWeight:600, fontSize:13}}>{name}</div>
                  <div className="small">사용 {Math.floor(Math.random() * 12)}회</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoTile({ photo }) {
  const [hover, setHover] = uS1(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{aspectRatio:'1/1', borderRadius:8, backgroundImage:`url(${photo.src})`, backgroundSize:'cover', position:'relative', cursor:'pointer'}}>
      {hover && (
        <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', borderRadius:8,
          display:'flex', flexDirection:'column', justifyContent:'space-between', padding:8}}>
          <div className="row gap-4">
            <span className="badge">{photo.source}</span>
          </div>
          <div className="col gap-4">
            <div className="small" style={{color:'#fff'}}>사용 {photo.uses}회</div>
            <div className="row gap-4">
              <button className="btn btn-secondary btn-sm" style={{flex:1, padding:'4px 6px', fontSize:11}}>↓</button>
              <button className="btn btn-destructive btn-sm" style={{flex:1, padding:'4px 6px', fontSize:11}}>🗑️</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  LoginScreen, DashboardScreen, HistoryScreen, PostDetailScreen, LibraryScreen,
});
