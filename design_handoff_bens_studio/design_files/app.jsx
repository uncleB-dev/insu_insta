// Main app: route → screen
const { useState: uSA, useEffect: uEA } = React;

function App() {
  const { path, navigate } = useRoute();

  // Determine which step indicator to show
  let currentStep = null;
  let postTitle = null;

  if (path === '/posts/new') currentStep = 'input';
  let m;
  if ((m = matchRoute(path, '/posts/:id/script'))) { currentStep = 'script'; postTitle = '암치료비가 비싸다는데 얼마나?'; }
  if ((m = matchRoute(path, '/posts/:id/design'))) { currentStep = 'design'; postTitle = '암치료비가 비싸다는데 얼마나?'; }
  if ((m = matchRoute(path, '/posts/:id/preview'))) { currentStep = 'preview'; postTitle = '암치료비가 비싸다는데 얼마나?'; }

  // Login = no chrome
  if (path === '/login') {
    return (
      <Layout path={path} navigate={navigate} noChrome>
        <LoginScreen navigate={navigate} />
      </Layout>
    );
  }

  let screen = null;

  if (path === '/') screen = <DashboardScreen navigate={navigate} />;
  else if (path === '/posts') screen = <HistoryScreen navigate={navigate} />;
  else if (path === '/posts/new') screen = <NewPostScreen navigate={navigate} />;
  else if ((m = matchRoute(path, '/posts/:id/script'))) screen = <ScriptScreen navigate={navigate} postId={m.id} />;
  else if ((m = matchRoute(path, '/posts/:id/design'))) screen = <DesignScreen navigate={navigate} postId={m.id} />;
  else if ((m = matchRoute(path, '/posts/:id/preview'))) screen = <PreviewScreen navigate={navigate} postId={m.id} />;
  else if ((m = matchRoute(path, '/posts/:id'))) screen = <PostDetailScreen navigate={navigate} postId={m.id} />;
  else if (path === '/library') screen = <LibraryScreen navigate={navigate} />;
  else if (path === '/admin/prompts') screen = <AdminPromptsScreen navigate={navigate} />;
  else if (path === '/admin/guardrails') screen = <AdminGuardrailsScreen navigate={navigate} />;
  else screen = <div className="text-secondary">404: {path}</div>;

  return (
    <Layout path={path} navigate={navigate} postTitle={postTitle} currentStep={currentStep}>
      {screen}
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
