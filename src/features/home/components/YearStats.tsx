import { Block, Card } from 'framework7-react'
import { Car, Moon, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CurrentYearStats } from '@/features/home/api/stats-api.ts'
import { formatKm } from '@/features/home/format.ts'
import './YearStats.css'

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <Card className="year-stat">
      <Icon size={22} aria-hidden="true" />
      <strong className="year-stat-value">{value}</strong>
      <span className="year-stat-label">{label}</span>
    </Card>
  )
}

// This year's visits, nights and driving distance.
export default function YearStats({ stats }: { stats: CurrentYearStats }) {
  return (
    <Block inset className="year-stats">
      <div className="grid grid-cols-3 grid-gap">
        <Stat icon={Users} value={String(stats.visits)} label="Besøk" />
        <Stat icon={Moon} value={String(stats.totalNights)} label="Netter" />
        <Stat icon={Car} value={formatKm(stats.totalDistanceKm)} label="Kjørte km" />
      </div>
    </Block>
  )
}
