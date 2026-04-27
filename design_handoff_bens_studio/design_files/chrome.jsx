// Shared chrome: Sidebar, TopBar, Layout, common widgets.

const { useState, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────────
// Tiny hash router so we can simulate Next.js App Router pages
// ─────────────────────────────────────────────────────────────
function useRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/login');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/login');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const path = hash.replace(/^#/, '') || '/login';
  // Match /posts/:id/script etc.
  const navigate = (to) => { window.location.hash = '#' + to; };
  return { path, navigate };
}

function matchRoute(path, pattern) {
  // pattern uses :param tokens
  const pp = pattern.split('/').filter(Boolean);
  const sp = path.split('/').filter(Boolean);
  if (pp.length !== sp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = sp[i];
    else if (pp[i] !== sp[i]) return null;
  }
  return params;
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({ path, navigate }) {
  const [adminOpen, setAdminOpen] = useState(path.startsWith('/admin'));

  const isActive = (p) => {
    if (p === '/') return path === '/';
    return path === p || path.startsWith(p + '/') || (p === '/posts' && /^\/posts(\/|$)/.test(path) && !path.includes('/new'));
  };

  return (
    <aside className="sidebar">
      <button className="side-new" onClick={() => navigate('/posts/new')}>
        <span style={{fontSize:16, lineHeight:1}}>＋</span>
        <span>새 게시물 만들기</span>
      </button>

      <button className={'side-item ' + (path === '/' ? 'active' : '')} onClick={() => navigate('/')}>
        <span>📊</span><span>대시보드</span>
      </button>
      <button className={'side-item ' + (path.startsWith('/posts') && !path.includes('/new') ? 'active' : '')} onClick={() => navigate('/posts')}>
        <span>📝</span><span>히스토리</span>
      </button>
      <button className={'side-item ' + (path === '/library' ? 'active' : '')} onClick={() => navigate('/library')}>
        <span>🖼️</span><span>라이브러리</span>
      </button>

      <div className="side-divider"></div>

      <button className="side-item" onClick={() => setAdminOpen(!adminOpen)}>
        <span>⚙️</span><span style={{flex:1}}>Admin</span>
        <span style={{color:'var(--text-muted)', fontSize:11}}>{adminOpen ? '▾' : '▸'}</span>
      </button>
      {adminOpen && (
        <div style={{paddingLeft:12, display:'flex', flexDirection:'column', gap:4}}>
          <button className={'side-item ' + (path === '/admin/prompts' ? 'active' : '')} onClick={() => navigate('/admin/prompts')}>
            <span style={{fontSize:11}}>◦</span><span>프롬프트 관리</span>
          </button>
          <button className={'side-item ' + (path === '/admin/guardrails' ? 'active' : '')} onClick={() => navigate('/admin/guardrails')}>
            <span style={{fontSize:11}}>◦</span><span>가드레일 룰</span>
          </button>
        </div>
      )}

      <div style={{flex:1}}></div>
      <div className="side-divider"></div>
      <button className="side-item">
        <span>👤</span><span>설정</span>
      </button>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// TopBar
// ─────────────────────────────────────────────────────────────
function TopBar({ path, navigate, postTitle, currentStep, saveStatus = 'saved' }) {
  const showStepper = /^\/posts\/[^/]+\/(script|design|preview)$|^\/posts\/new$/.test(path);

  const steps = [
    { n: '1️⃣', label: '입력',     k: 'input' },
    { n: '2️⃣', label: '스크립트', k: 'script' },
    { n: '3️⃣', label: '디자인',   k: 'design' },
    { n: '4️⃣', label: '미리보기', k: 'preview' },
  ];

  return (
    <header className="topbar">
      <div className="row items-center gap-12" style={{cursor:'pointer'}} onClick={() => navigate('/')}>
        <span style={{fontSize:18}}>🟢</span>
        <span style={{fontSize:18, fontWeight:700, color:'var(--accent)', letterSpacing:'-0.01em'}}>
          보험삼촌 BEN's Studio
        </span>
      </div>

      {showStepper && (
        <div className="row items-center gap-16">
          {postTitle && <span style={{color:'var(--text-secondary)', fontSize:13}}>{postTitle}</span>}
          <div className="step-indicator">
            {steps.map((s, i) => (
              <React.Fragment key={s.k}>
                <span className={'step ' + (s.k === currentStep ? 'current' : '')}>
                  <span>{s.n}</span><span>{s.label}</span>
                </span>
                {i < steps.length - 1 && <span className="arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="row items-center gap-12">
        <span style={{fontSize:12, color: saveStatus === 'saving' ? 'var(--yellow)' : 'var(--text-muted)'}}>
          {saveStatus === 'saving' ? '저장 중...' : '저장됨 ✓'}
        </span>
        <div className="avatar">B</div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout shell
// ─────────────────────────────────────────────────────────────
function Layout({ path, navigate, children, postTitle, currentStep, saveStatus, noChrome }) {
  if (noChrome) {
    return (
      <div className="app no-chrome">
        <main className="main" style={{padding:0}}>{children}</main>
      </div>
    );
  }
  return (
    <div className="app">
      <Sidebar path={path} navigate={navigate} />
      <TopBar path={path} navigate={navigate} postTitle={postTitle} currentStep={currentStep} saveStatus={saveStatus} />
      <main className="main">{children}</main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PrincipleBadge
// ─────────────────────────────────────────────────────────────
function PrincipleBadge({ principle, size = 'md' }) {
  const p = window.MOCK.PRINCIPLES[principle];
  if (!p) return null;
  return <span className={'pbadge ' + principle}>{p.ko}</span>;
}

// ─────────────────────────────────────────────────────────────
// SlideCard (used in step 2 list)
// ─────────────────────────────────────────────────────────────
function SlideCard({ index, slide, selected, onClick }) {
  const p = window.MOCK.PRINCIPLES[slide.principle];
  return (
    <div className={'slide-card ' + (selected ? 'selected' : '')} onClick={onClick}>
      <span className="grip" title="드래그">⋮⋮</span>
      <div className="colorbar" style={{background: p.color}}></div>
      <div className="col gap-4 flex-1" style={{minWidth:0}}>
        <div className="row items-center gap-8">
          <span className="num">{String(index + 1).padStart(2,'0')}</span>
          <PrincipleBadge principle={slide.principle} />
        </div>
        <div className="text">{slide.main}</div>
      </div>
      {slide.guards && slide.guards.length > 0 && (
        <span className="warn" title="가드레일 경고">
          {slide.guards.some(g => g.kind === 'red') ? '🔴' : '🟡'}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GuardrailScore
// ─────────────────────────────────────────────────────────────
function GuardrailScore({ green, yellow, red, onDetail }) {
  return (
    <div className="card card-pad row items-center justify-between" style={{padding:'14px 20px'}}>
      <div className="row items-center gap-16">
        <span style={{fontSize:13}}>🟢 그린 <b>{green}</b></span>
        <span style={{fontSize:13, color:'var(--yellow)'}}>🟡 옐로우 <b>{yellow}</b></span>
        <span style={{fontSize:13, color: red > 0 ? 'var(--red)' : 'var(--text-secondary)'}}>🔴 레드 <b>{red}</b></span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onDetail}>상세 보기 →</button>
    </div>
  );
}

// Highlight inline guardrail words inside text
function GuardedText({ text, guards }) {
  if (!guards || guards.length === 0) return <>{text}</>;
  // Split by every guard word, preserving structure (simple impl).
  let parts = [text];
  guards.forEach(g => {
    const next = [];
    parts.forEach(seg => {
      if (typeof seg !== 'string') { next.push(seg); return; }
      const idx = seg.indexOf(g.word);
      if (idx === -1) { next.push(seg); return; }
      if (idx > 0) next.push(seg.slice(0, idx));
      next.push({ g, w: seg.substr(idx, g.word.length) });
      next.push(seg.slice(idx + g.word.length));
    });
    parts = next;
  });
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === 'string') return <span key={i}>{p}</span>;
        const cls = p.g.kind === 'red' ? 'guard-red' : 'guard-yellow';
        return (
          <span key={i} className={cls} title={`→ ${p.g.suggest}`}>
            {p.w}
          </span>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// StepIndicator (vertical, used inline)
// ─────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, right }) {
  return (
    <div className="row items-center justify-between" style={{marginBottom:24}}>
      <div className="col gap-4">
        <h1 className="h1" style={{margin:0}}>{title}</h1>
        {subtitle && <div className="text-secondary">{subtitle}</div>}
      </div>
      {right && <div className="row items-center gap-8">{right}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
function Toast({ children }) {
  return <div className="toast">{children}</div>;
}

// Loading dialog
function LoadingDialog({ title, sub }) {
  return (
    <div className="overlay">
      <div className="dialog" style={{textAlign:'center'}}>
        <div style={{fontSize:32, marginBottom:8}}>🤖</div>
        <h2 className="h2" style={{margin:'0 0 8px'}}>{title}</h2>
        <div className="text-secondary">{sub}</div>
        <div style={{height:4, background:'var(--bg-tertiary)', borderRadius:2, marginTop:24, overflow:'hidden'}}>
          <div style={{height:'100%', width:'40%', background:'var(--accent)', animation:'slide 1.4s ease-in-out infinite'}}></div>
        </div>
        <style>{`@keyframes slide { 0%{transform:translateX(-100%);} 100%{transform:translateX(250%);} }`}</style>
      </div>
    </div>
  );
}

Object.assign(window, {
  useRoute, matchRoute,
  Sidebar, TopBar, Layout,
  PrincipleBadge, SlideCard, GuardrailScore, GuardedText,
  PageHeader, Toast, LoadingDialog,
});
