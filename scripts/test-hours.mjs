import { computeStatus, nowInBA, describeSlots, validateSlots } from '../src/lib/hours.js'
const slots=[{from:'07:00',to:'13:00'},{from:'17:00',to:'23:00'}]
const hours=[1,2,3,4,5,6].map(w=>({weekday:w,is_open:true,slots})).concat([{weekday:7,is_open:false,slots:[]}])
const at=(iso)=>new Date(iso) // UTC; BA = UTC-3
const t=(label,d,sp=[],h=hours)=>console.log(label.padEnd(34), '|', JSON.stringify(computeStatus(h,sp,at(d))))
// 2026-11-16 es lunes
t('lun 10:00 BA (13:00Z)','2026-11-16T13:00:00Z')
t('lun 14:30 BA (17:30Z)','2026-11-16T17:30:00Z')
t('lun 23:30 BA (02:30Z mar)','2026-11-17T02:30:00Z')
t('lun 05:00 BA (08:00Z)','2026-11-16T08:00:00Z')
t('sáb 23:30 BA -> dom cerrado','2026-11-22T02:30:00Z')
t('dom 12:00 BA','2026-11-22T15:00:00Z')
t('feriado lun 10:00 BA','2026-11-16T13:00:00Z',[{day:'2026-11-16',reason:'Feriado',is_closed:true,slots:[]}])
t('TZ: 01:00Z lun = dom 22:00 BA','2026-11-16T01:00:00Z')
const night=[1,2,3,4,5,6,7].map(w=>({weekday:w,is_open:true,slots:[{from:'20:00',to:'02:00'}]}))
t('nocturno 01:00 BA (04:00Z)','2026-11-16T04:00:00Z',[],night)
t('nocturno 03:00 BA (06:00Z)','2026-11-16T06:00:00Z',[],night)
console.log(nowInBA(at('2026-11-16T02:00:00Z')), describeSlots(slots), validateSlots([{from:'07:00',to:'13:00'},{from:'12:00',to:'14:00'}]))
