import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { PinLockGate } from '@/components/security-ui';
import { ActiveTimeGate } from '@/components/active-time-limit';
import { AmbientSoundProvider } from '@/components/ambient-sound';
import { DiaryCoverProvider } from '@/components/diary-cover';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';
import NotFound from '@/pages/not-found';
import { EntryPage, HomePage, SettingsPage, SignInPage, SignUpPage, UserPortalPage } from '@/pages/diary-pages';
import { FocusTodoPage } from '@/pages/focus-todo-page';
import { HabitsPage, VaultPage } from '@/pages/local-module-pages';
import { IdeasPage } from '@/pages/ideas-page';
import { GoalsPage } from '@/pages/goals-page';
import { BooksPage } from '@/pages/books-page';
import RepetitionPage from '@/pages/repetition-page';
import TasksPage from '@/pages/tasks-page';
import { ProfilePage } from '@/pages/profile-page';
import { BrainGymPage } from '@/pages/brain-gym-page';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#30243f',
    colorForeground: '#30243f',
    colorMutedForeground: '#756d7e',
    colorDanger: '#b75539',
    colorBackground: '#fffaf0',
    colorInput: '#f7f0df',
    colorInputForeground: '#30243f',
    colorNeutral: '#d8ccb0',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffaf0] rounded-[24px] w-[440px] max-w-full overflow-hidden border border-[#d8ccb0] shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#30243f] font-serif text-3xl',
    headerSubtitle: 'text-[#756d7e]',
    socialButtonsBlockButtonText: 'text-[#30243f] font-medium',
    formFieldLabel: 'text-[#30243f] font-medium',
    footerActionLink: 'text-[#9a6b23] font-semibold',
    footerActionText: 'text-[#756d7e]',
    dividerText: 'text-[#756d7e]',
    identityPreviewEditButton: 'text-[#9a6b23]',
    formFieldSuccessText: 'text-[#47796c]',
    alertText: 'text-[#8f3f2d]',
    logoBox: 'mb-3',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#d8ccb0] bg-[#f7f0df] hover:bg-[#eee5d1]',
    formButtonPrimary: 'bg-[#30243f] text-[#fffaf0] hover:bg-[#4c3a5d]',
    formFieldInput: 'border-[#d8ccb0] bg-[#f7f0df] text-[#30243f] focus:border-[#b89c5c]',
    footerAction: 'border-t border-[#e4dac3]',
    dividerLine: 'bg-[#d8ccb0]',
    alert: 'border-[#ecc6bd] bg-[#fff0ec]',
    otpCodeFieldInput: 'border-[#d8ccb0] bg-[#f7f0df] text-[#30243f]',
    formFieldRow: 'text-[#30243f]',
    main: 'text-[#30243f]',
  },
};

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = queryClient;
  const previousUserRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserRef.current !== undefined && previousUserRef.current !== userId) {
        client.clear();
      }
      previousUserRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  if (!isSignedIn) return <Redirect to="/" />;
  return <PinLockGate>{children}</PinLockGate>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/user-portal">
          <ProtectedPage><UserPortalPage /></ProtectedPage>
        </Route>
        <Route path="/entry/new">
          <ProtectedPage><EntryPage /></ProtectedPage>
        </Route>
        <Route path="/entry/:id">
          <ProtectedPage><EntryPage /></ProtectedPage>
        </Route>
        <Route path="/settings">
          <ProtectedPage><SettingsPage /></ProtectedPage>
        </Route>
        <Route path="/profile">
          <ProtectedPage><ProfilePage /></ProtectedPage>
        </Route>
        <Route path="/habits">
          <ProtectedPage><HabitsPage /></ProtectedPage>
        </Route>
        <Route path="/vault">
          <ProtectedPage><VaultPage /></ProtectedPage>
        </Route>
        <Route path="/ideas">
          <ProtectedPage><IdeasPage /></ProtectedPage>
        </Route>
        <Route path="/goals">
          <ProtectedPage><GoalsPage /></ProtectedPage>
        </Route>
        <Route path="/tasks">
          <ProtectedPage><TasksPage /></ProtectedPage>
        </Route>
        <Route path="/books">
          <ProtectedPage><BooksPage /></ProtectedPage>
        </Route>
        <Route path="/repetition">
          <ProtectedPage><RepetitionPage /></ProtectedPage>
        </Route>
        <Route path="/brain-gym">
          <ProtectedPage><BrainGymPage /></ProtectedPage>
        </Route>
        <Route path="/pomodoro">
          <ProtectedPage><FocusTodoPage /></ProtectedPage>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <DiaryCoverProvider>
            <ActiveTimeGate>
              <AmbientSoundProvider>
                <Router />
              </AmbientSoundProvider>
            </ActiveTimeGate>
            <Toaster />
          </DiaryCoverProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  const { language } = useI18n();
  return (
    <div className="contents" data-app-language={language}>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </div>
  );
}

export default App;
