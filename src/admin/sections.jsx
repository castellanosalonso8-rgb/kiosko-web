/**
 * SECCIONES del panel. Sumar una = declarar un objeto acá (y su recurso en resources.jsx).
 * type: 'crud' (CrudPage genérico) · 'settings' (fila única) · 'custom' (componente propio)
 */
import CrudPage from './CrudPage'
import SettingsForm from './SettingsForm'
import HoursEditor from './HoursEditor'
import Summary from './Summary'
import QrPanel from './QrPanel'
import {
  products, combos, categories, campaigns, specialDays, photos,
  avisoFields, avisoCheck, datosFields, datosCheck, datosTransform,
} from './resources'
import s from '../styles/admin.module.css'

export const SECTIONS = [
  { key: 'resumen', label: 'Resumen', icon: '📊', render: () => <Summary /> },
  { key: 'productos', label: 'Productos', icon: '🛒', render: () => <CrudPage resource={products} /> },
  { key: 'categorias', label: 'Categorías', icon: '🗂️', render: () => <CrudPage resource={categories} /> },
  { key: 'combos', label: 'Combos y promos', icon: '🎁', render: () => <CrudPage resource={combos} /> },
  { key: 'campanas', label: 'Campañas y temática', icon: '🎉', render: () => <CrudPage resource={campaigns} /> },
  {
    key: 'horarios', label: 'Horarios', icon: '🕒',
    render: () => (
      <>
        <HoursEditor />
        <div className={s.divider} />
        <CrudPage resource={specialDays} />
      </>
    ),
  },
  { key: 'fotos', label: 'Fotos del local', icon: '📷', render: () => <CrudPage resource={photos} /> },
  {
    key: 'aviso', label: 'Aviso', icon: '📢',
    render: () => <SettingsForm title="Aviso" intro="Un cartelito arriba de la web (ej. “Hoy cerramos a las 20”)." fields={avisoFields} check={avisoCheck} />,
  },
  {
    key: 'datos', label: 'Datos del kiosko', icon: '🏪',
    render: () => <SettingsForm title="Datos del kiosko" fields={datosFields} check={datosCheck} transform={datosTransform} />,
  },
  { key: 'qr', label: 'QR del local', icon: '📲', render: () => <QrPanel /> },
]
