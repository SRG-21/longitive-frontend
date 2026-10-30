import { NavLink } from 'react-router-dom'

interface Props {
  trackerId: string
}

export default function TrackerTabs({ trackerId }: Props) {
  const tabs = [
    { to: `/journey-trackers/${trackerId}/daily`, label: 'Daily' },
    { to: `/journey-trackers/${trackerId}/table`, label: 'Table' },
    { to: `/journey-trackers/${trackerId}/chart`, label: 'Chart' },
    { to: `/journey-trackers/${trackerId}/weekly-review`, label: 'Weekly review' },
  ]

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `px-3 py-2 text-sm font-medium ${
              isActive ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
