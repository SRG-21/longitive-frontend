import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Signed-in pages are split per route (DashboardLayout wraps them in Suspense) so the
// login screen doesn't download recharts, the table library and every feature page.
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const ProgressPage = lazy(() => import('./pages/progress/ProgressPage'))
const BodyCompositionPage = lazy(() => import('./pages/body-composition/BodyCompositionPage'))
const LabReportsPage = lazy(() => import('./pages/lab-reports/LabReportsPage'))
const LabReportDetailPage = lazy(() => import('./pages/lab-reports/LabReportDetailPage'))
const LabTrendPage = lazy(() => import('./pages/lab-reports/LabTrendPage'))
const SleepMoodPage = lazy(() => import('./pages/sleep/SleepMoodPage'))
const ExercisePage = lazy(() => import('./pages/exercise/ExercisePage'))
const NutritionPage = lazy(() => import('./pages/nutrition/NutritionPage'))
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage'))
const AiChatPage = lazy(() => import('./pages/ai/AiChatPage'))
const AiInsightsPage = lazy(() => import('./pages/ai/AiInsightsPage'))
const FirstAidPage = lazy(() => import('./pages/ai/FirstAidPage'))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const TrackerListPage = lazy(() => import('./pages/journey-tracker/TrackerListPage'))
const TrackerBuilderPage = lazy(() => import('./pages/journey-tracker/TrackerBuilderPage'))
const TrackerDailyPage = lazy(() => import('./pages/journey-tracker/TrackerDailyPage'))
const TrackerTablePage = lazy(() => import('./pages/journey-tracker/TrackerTablePage'))
const TrackerChartPage = lazy(() => import('./pages/journey-tracker/TrackerChartPage'))
const TrackerWeeklyReviewPage = lazy(() => import('./pages/journey-tracker/TrackerWeeklyReviewPage'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
          { path: '/reset-password', element: <ResetPassword /> },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/progress', element: <ProgressPage /> },
          { path: '/body-composition', element: <BodyCompositionPage /> },
          { path: '/lab-reports', element: <LabReportsPage /> },
          { path: '/lab-reports/trends/:testName', element: <LabTrendPage /> },
          { path: '/lab-reports/:id', element: <LabReportDetailPage /> },
          { path: '/sleep', element: <SleepMoodPage /> },
          { path: '/exercise', element: <ExercisePage /> },
          { path: '/nutrition', element: <NutritionPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/ai/chat', element: <AiChatPage /> },
          { path: '/ai/chat/:sessionId', element: <AiChatPage /> },
          { path: '/ai/insights', element: <AiInsightsPage /> },
          { path: '/ai/first-aid', element: <FirstAidPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/journey-trackers', element: <TrackerListPage /> },
          { path: '/journey-trackers/new', element: <TrackerBuilderPage /> },
          { path: '/journey-trackers/:id', element: <TrackerBuilderPage /> },
          { path: '/journey-trackers/:id/daily', element: <TrackerDailyPage /> },
          { path: '/journey-trackers/:id/daily/:date', element: <TrackerDailyPage /> },
          { path: '/journey-trackers/:id/table', element: <TrackerTablePage /> },
          { path: '/journey-trackers/:id/chart', element: <TrackerChartPage /> },
          { path: '/journey-trackers/:id/weekly-review', element: <TrackerWeeklyReviewPage /> },
        ],
      },
    ],
  },
])
