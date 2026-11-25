import { useHours } from '../../context/HoursContext'
import { WEEKDAYS, describeSlots, nowInBA } from '../../lib/hours'
import s from '../../styles/store.module.css'

const fmtDate = (d) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

/** Tabla semanal (hoy resaltado, hora de Buenos Aires) + próximos días especiales. */
export default function HoursTable() {
  const { hours, specials } = useHours()
  const { weekday, dateStr } = nowInBA()
  if (!hours.length) return null
  const upcoming = specials.filter((x) => x.day >= dateStr).slice(0, 6)
  return (
    <div>
      <table className={s.hoursTable}>
        <caption className="visually-hidden">Horarios de atención</caption>
        <tbody>
          {WEEKDAYS.map((name, i) => {
            const row = hours.find((h) => h.weekday === i + 1)
            const closed = !row || !row.is_open || !(row.slots || []).length
            return (
              <tr key={name} className={weekday === i + 1 ? s.today : ''} aria-current={weekday === i + 1 ? 'date' : undefined}>
                <th scope="row">{name}</th>
                <td className={closed ? s.closedText : ''}>{closed ? 'Cerrado' : describeSlots(row.slots)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {upcoming.length > 0 && (
        <ul className={s.specials}>
          {upcoming.map((x) => (
            <li key={x.id}>
              <b>{fmtDate(x.day)}</b> · {x.reason} — {x.is_closed ? 'Cerrado' : describeSlots(x.slots)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
