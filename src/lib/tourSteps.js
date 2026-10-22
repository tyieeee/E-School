// Guided product tour steps. Each step targets a real element elsewhere in
// the app via a matching `data-tour="<target>"` attribute — the tour engine
// finds it, spotlights it, and auto-navigates to `path` first if the
// student isn't already there. Whenever the tour moves to a new page, the
// first step there introduces the page as a whole before drilling into its
// individual features.
export const TOUR_STEPS = [
  {
    id: 'welcome',
    path: '/dashboard',
    target: 'dashboard-hero',
    title: 'Welcome to E-School',
    description:
      'This is your home base — a safe space to report concerns, get updates, and stay connected with your school.',
  },
  {
    id: 'quick-actions',
    path: '/dashboard',
    target: 'dashboard-quick-actions',
    title: 'Quick actions',
    description: 'Jump straight to Report, My Reports, or your Inbox from here anytime.',
  },
  {
    id: 'notifications',
    path: '/dashboard',
    target: 'header-notifications',
    title: 'Stay notified',
    description: 'Tap the bell to see replies, announcements, and other updates as they come in.',
  },
  {
    id: 'report-types',
    path: '/report',
    target: 'report-types',
    title: 'Choose the type',
    description: 'Choose what kind of concern this is, then describe what happened below.',
  },
  {
    id: 'report-description',
    path: '/report',
    target: 'report-description',
    title: 'What happened?',
    description: 'Describe what happened — the more detail you give, the more your Admin can help.',
  },
  {
    id: 'report-location',
    path: '/report',
    target: 'report-location',
    title: 'Add a location',
    description: 'Optional, but it helps your Admin find where this happened.',
  },
  {
    id: 'report-photos',
    path: '/report',
    target: 'report-photos',
    title: 'Attach photos',
    description: 'Add up to 3 photos as evidence, if you have any.',
  },
  {
    id: 'report-submit',
    path: '/report',
    target: 'report-submit',
    title: 'Send it privately',
    description: 'Slide to submit when you\'re ready. Only your Admin can see it — classmates never will.',
  },
  {
    id: 'my-reports',
    path: '/my-reports',
    target: 'my-reports-passcode',
    title: 'The My Reports page',
    description:
      "Set a passcode so no one else can see the reports you've submitted, even if they pick up your phone.",
  },
  {
    id: 'inbox-page',
    path: '/inbox',
    target: 'inbox-panel',
    title: 'The Inbox page',
    description: 'Messages from your Admin show up here.',
  },
  {
    id: 'profile-page',
    path: '/settings',
    target: 'profile-page',
    title: 'The Profile page',
    description: 'This is your account — your photo, name, and login email live here.',
  },
  {
    id: 'profile-personal-info',
    path: '/settings',
    target: 'profile-personal-info',
    title: 'Personal Information',
    description: 'Check your details on file, and change your password here.',
  },
  {
    id: 'profile-passcode',
    path: '/settings',
    target: 'profile-passcode',
    title: 'My Reports Passcode',
    description: 'Set or update the passcode that keeps My Reports private to you.',
  },
  {
    id: 'preferences-page',
    path: '/preferences',
    target: 'preferences-page',
    title: 'Make it yours',
    description: 'Switch between light and dark mode, adjust text size, and manage notifications here.',
  },
]
