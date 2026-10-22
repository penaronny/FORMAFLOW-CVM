import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthView } from './views/AuthView';
import { FormsListView } from './views/FormsListView';
import { FormEditorView } from './views/FormEditorView';
import { ResponsesView } from './views/ResponsesView';
import { PublicFormView } from './views/PublicFormView';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Navigation states
  const [currentView, setCurrentView] = useState<'forms' | 'new-form' | 'editor' | 'responses' | 'login' | 'public'>('forms');
  const [activeFormId, setActiveFormId] = useState<string | undefined>(undefined);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  // Sync with window.location.hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      // Check for public form route: /f/:slug or #f/:slug
      if (hash.startsWith('#f/')) {
        const slug = hash.replace('#f/', '').split('?')[0];
        setPublicSlug(slug);
        setCurrentView('public');
        return;
      }

      if (path.startsWith('/f/')) {
        const slug = path.replace('/f/', '').split('?')[0];
        setPublicSlug(slug);
        setCurrentView('public');
        return;
      }

      if (hash.startsWith('#editor/')) {
        const id = hash.replace('#editor/', '');
        setActiveFormId(id);
        setCurrentView('editor');
        return;
      }

      if (hash.startsWith('#responses/')) {
        const id = hash.replace('#responses/', '');
        setActiveFormId(id);
        setCurrentView('responses');
        return;
      }

      if (hash === '#new-form') {
        setActiveFormId(undefined);
        setCurrentView('new-form');
        return;
      }

      if (hash === '#login') {
        setCurrentView('login');
        return;
      }

      // Default
      setPublicSlug(null);
      setCurrentView('forms');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: string, id?: string) => {
    setActiveFormId(id);
    if (view === 'forms') {
      window.location.hash = '';
      setCurrentView('forms');
    } else if (view === 'new-form') {
      window.location.hash = 'new-form';
      setCurrentView('new-form');
    } else if (view === 'editor') {
      window.location.hash = id ? `editor/${id}` : 'new-form';
      setCurrentView('editor');
    } else if (view === 'responses') {
      window.location.hash = `responses/${id}`;
      setCurrentView('responses');
    } else if (view === 'login') {
      window.location.hash = 'login';
      setCurrentView('login');
    }
  };

  // If public route, render directly without auth shell
  if (currentView === 'public' && publicSlug) {
    return <PublicFormView slug={publicSlug} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Iniciando FormFlow...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1">
          <AuthView onSuccess={() => handleNavigate('forms')} />
        </main>
      </div>
    );
  }

  // Authenticated views
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-1">
        {currentView === 'forms' && <FormsListView onNavigate={handleNavigate} />}
        {(currentView === 'new-form' || currentView === 'editor') && (
          <FormEditorView formId={activeFormId} onNavigate={handleNavigate} />
        )}
        {currentView === 'responses' && activeFormId && (
          <ResponsesView formId={activeFormId} onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
