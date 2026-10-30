import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import TrackerListPage from './pages/journey-tracker/TrackerListPage'
import TrackerBuilderPage from './pages/journey-tracker/TrackerBuilderPage'
import TrackerDailyPage from './pages/journey-tracker/TrackerDailyPage'
import TrackerTablePage from './pages/journey-tracker/TrackerTablePage'
import TrackerChartPage from './pages/journey-tracker/TrackerChartPage'
import TrackerWeeklyReviewPage from './pages/journey-tracker/TrackerWeeklyReviewPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
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
