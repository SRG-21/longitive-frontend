import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { AlertTriangle, CalendarClock, Minus, PackagePlus } from 'lucide-react'
import {
  useConsumeItem,
  useCreateInventoryItem,
  useExpiringSoon,
  useInventory,
  useReorderAlerts,
  useRestockItem,
  type InventoryItemInput,
} from '../../hooks/usePlans'
import { getErrorMessage } from '../../lib/api'
import { formatDate, todayIso } from '../../lib/date'
import { compact, optionalNumber } from '../../lib/form'
import { Badge, Button, Card, EmptyState, Field, Input, Loading, PageHeader, Select } from '../../components/ui'
import type { InventoryItem } from '../../types/health'

function daysLeft(item: InventoryItem): number | undefined {
  return item.dailyDosage ? Math.floor(item.quantity / item.dailyDosage) : undefined
}

function AddItemForm({ onDone }: { onDone: () => void }) {
  const create = useCreateInventoryItem()
  const { register, handleSubmit } = useForm<InventoryItemInput>({ defaultValues: { type: 'SUPPLEMENT', unit: 'tablets', reorderThresholdDays: 7 } })

  const onSubmit = async (values: InventoryItemInput) => {
    try {
      await create.mutateAsync(compact(values))
      toast.success(`${values.name} added`)
      onDone()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add item'))
    }
  }

  return (
    <Card title="Add item">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Name" className="col-span-2">
          <Input {...register('name', { required: true })} placeholder="Vitamin D3 1000 IU" />
        </Field>
        <Field label="Type">
          <Select {...register('type')}>
            <option value="SUPPLEMENT">Supplement</option>
            <option value="MED">Medication</option>
          </Select>
        </Field>
        <Field label="Unit">
          <Input {...register('unit')} />
        </Field>
        <Field label="Quantity on hand">
          <Input type="number" step="any" min={0} {...register('quantity', optionalNumber)} />
        </Field>
        <Field label="Daily dosage">
          <Input type="number" step="any" min={0} {...register('dailyDosage', optionalNumber)} />
        </Field>
        <Field label="Reorder when ≤ days left">
          <Input type="number" step={1} min={0} {...register('reorderThresholdDays', optionalNumber)} />
        </Field>
        <Field label="Expiry date">
          <Input type="date" min={todayIso()} {...register('expiryDate')} />
        </Field>
        <Field label="Cost per unit">
          <Input type="number" step="any" min={0} {...register('costPerUnit', optionalNumber)} />
        </Field>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-3">
          <Button type="submit" loading={create.isPending}>
            Add to inventory
          </Button>
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ItemRow({ item }: { item: InventoryItem }) {
  const consume = useConsumeItem()
  const restock = useRestockItem()
  const [restockQty, setRestockQty] = useState('')
  const left = daysLeft(item)
  const low = left != null && item.reorderThresholdDays != null && left <= item.reorderThresholdDays

  const onConsume = async () => {
    try {
      const { remaining } = await consume.mutateAsync({ id: item.id })
      toast.success(`${item.name}: ${remaining} ${item.unit ?? ''} left`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not record dose'))
    }
  }

  const onRestock = async () => {
    const quantity = Number(restockQty)
    if (!quantity || quantity <= 0) return
    try {
      await restock.mutateAsync({ id: item.id, quantity })
      setRestockQty('')
      toast.success(`${item.name} restocked`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not restock'))
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3">
        <div className="font-medium text-foreground">{item.name}</div>
        <div className="text-xs text-muted-foreground">
          {item.type === 'MED' ? 'Medication' : 'Supplement'}
          {item.dailyDosage ? ` · ${item.dailyDosage} ${item.unit ?? ''}/day` : ''}
        </div>
      </td>
      <td className="py-2 pr-3 whitespace-nowrap">
        {item.quantity} {item.unit}
      </td>
      <td className="py-2 pr-3">{left != null ? <Badge tone={low ? 'red' : 'green'}>{left} days</Badge> : '—'}</td>
      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{formatDate(item.expiryDate)}</td>
      <td className="py-2">
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="outline" onClick={onConsume} loading={consume.isPending} disabled={item.quantity <= 0} title="Record one day's dose">
            <Minus size={12} /> Dose
          </Button>
          <Input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Qty" aria-label={`Restock quantity for ${item.name}`} className="w-20 py-1 text-xs" />
          <Button size="sm" variant="outline" onClick={onRestock} loading={restock.isPending} disabled={!restockQty}>
            Restock
          </Button>
        </div>
      </td>
    </tr>
  )
}

export default function InventoryPage() {
  const { data: items, isLoading } = useInventory()
  const { data: alerts } = useReorderAlerts()
  const { data: expiring } = useExpiringSoon()
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Medicine cabinet"
        description="Track stock of medications and supplements, with reorder and expiry alerts."
        actions={
          !adding && (
            <Button onClick={() => setAdding(true)}>
              <PackagePlus size={14} /> Add item
            </Button>
          )
        }
      />

      {(alerts?.length || expiring?.length) ? (
        <div className="grid gap-3 md:grid-cols-2">
          {alerts && alerts.length > 0 && (
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <AlertTriangle size={18} className="shrink-0" />
              <div>
                <div className="font-medium">Running low</div>
                <ul className="mt-1">
                  {alerts.map((a) => (
                    <li key={a.id}>
                      {a.name} — {a.daysRemaining} days left
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {expiring && expiring.length > 0 && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <CalendarClock size={18} className="shrink-0" />
              <div>
                <div className="font-medium">Expiring within 30 days</div>
                <ul className="mt-1">
                  {expiring.map((e) => (
                    <li key={e.id}>
                      {e.name} — {formatDate(e.expiryDate)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {adding && <AddItemForm onDone={() => setAdding(false)} />}

      <Card title="Inventory">
        {isLoading ? (
          <Loading />
        ) : items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">On hand</th>
                  <th className="py-2 pr-3 font-medium">Supply</th>
                  <th className="py-2 pr-3 font-medium">Expires</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>Nothing tracked yet. Add your medications and supplements to get reorder alerts.</EmptyState>
        )}
      </Card>
    </div>
  )
}
