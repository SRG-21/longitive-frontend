import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Welcome{user ? `, ${user.name}` : ''}</h1>
      <p className="text-muted-foreground">
        Track a weight-loss or wellbeing journey with fully customizable daily fields.
      </p>
      <Link
        to="/journey-trackers"
        className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go to Journey Trackers
      </Link>
    </div>
  )
}
