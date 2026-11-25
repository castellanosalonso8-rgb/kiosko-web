import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useSettings } from '../context/SettingsContext'
import s from '../styles/admin.module.css'

/** QR del local: lleva directo al catálogo. Descargar PNG o imprimir el cartelito. */
export default function QrPanel() {
  const { settings } = useSettings()
  const [url, setUrl] = useState(`${window.location.origin}/`)
  const [img, setImg] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(url || window.location.origin, { width: 720, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1e2a52', light: '#ffffff' } })
      .then((d) => alive && setImg(d))
      .catch(() => alive && setImg(''))
    return () => {
      alive = false
    }
  }, [url])

  return (
    <div>
      <h1 className={s.h1}>QR del local</h1>
      <p className="hint" style={{ marginBottom: '1rem' }}>Imprimilo y pegalo en la vidriera o el mostrador: quien lo escanea entra directo al catálogo.</p>
      <div className={s.card}>
        <div className="field">
          <label htmlFor="qr-url">Dirección a la que lleva</label>
          <input id="qr-url" className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          <span className="hint">Por defecto es la web de tu kiosko. Cambiala solo si usás un dominio propio.</span>
        </div>
        <div className={`${s.qrSheet} print-area`}>
          <strong className={s.qrTitle}>{settings.store_name}</strong>
          <span>Escaneá y mirá el catálogo 📲</span>
          {img ? <img className={s.qrImg} src={img} alt={`Código QR que lleva a ${url}`} /> : <div className={s.qrImg} />}
          <small>{url.replace(/^https?:\/\//, '')}</small>
        </div>
        <div className={s.formActions}>
          <a className="btn btn-primary" href={img} download="qr-kiosko.png" aria-disabled={!img}>Descargar PNG</a>
          <button className="btn btn-ghost" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>
    </div>
  )
}
