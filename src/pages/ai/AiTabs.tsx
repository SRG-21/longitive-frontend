import { RouteTabs } from '../../components/ui'

export default function AiTabs() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-foreground">AI health assistant</h1>
      <RouteTabs
        tabs={[
          { to: '/ai/chat', label: 'Chat' },
          { to: '/ai/insights', label: 'Insights' },
          { to: '/ai/first-aid', label: 'First aid' },
        ]}
      />
    </div>
  )
}
