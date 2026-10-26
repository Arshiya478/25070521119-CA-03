import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

const API = '/api/medicines'

function App() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [soundOn, setSoundOn] = useState(true)

  const loadMedicines = useCallback(async () => {
    try {
      const res = await fetch(API)
      if (!res.ok) throw new Error('Could not load medicines')
      setMedicines(await res.json())
    } catch (err) { setMessage(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadMedicines() }, [loadMedicines])

  // Browser-side reminder engine. The page must remain open for the alarm to run.
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const hhmm = now.toTimeString().slice(0, 5)
      const today = now.toISOString().slice(0, 10)
      medicines.filter(m => m.enabled && m.time === hhmm && (!m.startDate || today >= m.startDate) && (!m.endDate || today <= m.endDate))
        .forEach(m => {
          const key = `medicine-alert-${m._id}-${today}-${hhmm}`
          if (localStorage.getItem(key)) return
          localStorage.setItem(key, '1')
          if (soundOn) playBeep()
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Medicine Reminder: ${m.medicineName}`, { body: `Take ${m.dosage} now.` })
          } else alert(`Medicine Reminder\n\n${m.medicineName} — ${m.dosage}`)
        })
    }
    check(); const id = setInterval(check, 15000); return () => clearInterval(id)
  }, [medicines, soundOn])

  const saveMedicine = async (data) => {
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `${API}/${editing._id}` : API
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message || 'Could not save medicine')
    setMessage(editing ? 'Medicine updated successfully.' : 'Medicine added successfully.')
    setEditing(null); await loadMedicines()
  }

  const deleteMedicine = async (id) => {
    if (!confirm('Delete this medicine reminder?')) return
    const res = await fetch(`${API}/${id}`, { method:'DELETE' })
    if (!res.ok) { setMessage('Could not delete medicine.'); return }
    setMessage('Medicine deleted.'); await loadMedicines()
  }

  const toggleMedicine = async (m) => {
    const res = await fetch(`${API}/${m._id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...m, enabled:!m.enabled}) })
    if (res.ok) loadMedicines()
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) { setMessage('This browser does not support notifications.'); return }
    const permission = await Notification.requestPermission()
    setMessage(permission === 'granted' ? 'Browser notifications enabled.' : 'Notification permission was not granted.')
  }

  const today = new Date().toISOString().slice(0,10)
  const todays = medicines.filter(m => m.enabled && (!m.startDate || today >= m.startDate) && (!m.endDate || today <= m.endDate))
  const upcoming = useMemo(() => [...todays].sort((a,b) => a.time.localeCompare(b.time)), [todays])

  return <>
    <nav className="navbar"><Link className="brand" to="/"><span className="brand-icon">✚</span> Medi<span>Mate</span></Link><div className="navlinks"><NavLink to="/">Dashboard</NavLink><NavLink to="/about">About</NavLink><NavLink to="/services">Services</NavLink></div><button className="nav-btn" onClick={requestNotifications}>🔔 Enable Alerts</button></nav>
    {message && <div className="toast" onClick={()=>setMessage('')}>{message} ×</div>}
    <Routes>
      <Route path="/" element={<Dashboard medicines={medicines} upcoming={upcoming} loading={loading} onAdd={()=>setEditing({})} onEdit={setEditing} onDelete={deleteMedicine} onToggle={toggleMedicine} soundOn={soundOn} setSoundOn={setSoundOn}/>} />
      <Route path="/about" element={<InfoPage title="About MediMate" text="MediMate is a full-stack Medicine Reminder application built with React, Node.js, Express and MongoDB. It helps users store medicine details and remember when to take them."/>}/>
      <Route path="/services" element={<ServicesPage/>}/>
    </Routes>
    {editing !== null && <MedicineModal initial={editing} onClose={()=>setEditing(null)} onSave={saveMedicine}/>} 
  </>
}

function Dashboard({medicines, upcoming, loading, onAdd, onEdit, onDelete, onToggle, soundOn, setSoundOn}) {
  const active = medicines.filter(m=>m.enabled).length
  return <main className="page"><section className="hero"><div><p className="eyebrow">SMART HEALTH ORGANIZER</p><h1>Your medicines.<br/><span>Right on time.</span></h1><p className="hero-text">Keep every medicine, dosage and timing in one simple place. Never miss an important dose.</p><button className="primary" onClick={onAdd}>＋ Add Medicine</button></div><div className="hero-card"><div className="pulse">♥</div><div><b>Today's care</b><strong>{upcoming.length} reminders</strong><small>{active} active medicines</small></div></div></section>
    <section className="stats"><Stat label="Total Medicines" value={medicines.length} icon="💊"/><Stat label="Active Reminders" value={active} icon="⏰"/><Stat label="Today's Doses" value={upcoming.length} icon="✓"/><div className="sound-stat"><span>Alarm sound</span><button onClick={()=>setSoundOn(!soundOn)} className={soundOn?'toggle on':'toggle'}><i></i></button><b>{soundOn?'ON':'OFF'}</b></div></section>
    <section className="section-head"><div><p className="eyebrow">YOUR SCHEDULE</p><h2>Medicine reminders</h2></div><button className="secondary" onClick={onAdd}>＋ New reminder</button></section>
    {loading ? <div className="empty">Loading your medicines…</div> : medicines.length === 0 ? <div className="empty"><div>💊</div><h3>No medicines yet</h3><p>Add your first medicine to start your reminder schedule.</p><button className="primary" onClick={onAdd}>Add Medicine</button></div> : <div className="medicine-grid">{medicines.map(m=><MedicineCard key={m._id} medicine={m} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle}/>)}</div>}
  </main>
}
function Stat({label,value,icon}) { return <div className="stat"><span className="stat-icon">{icon}</span><div><b>{value}</b><small>{label}</small></div></div> }
function MedicineCard({medicine:m,onEdit,onDelete,onToggle}) { return <article className={m.enabled?'medicine-card':'medicine-card disabled'}><div className="med-top"><div className="med-icon">💊</div><div className="med-info"><h3>{m.medicineName}</h3><p>{m.dosage}</p></div><button className={m.enabled?'toggle on':'toggle'} onClick={()=>onToggle(m)}><i></i></button></div><div className="med-time"><span>⏰</span><strong>{formatTime(m.time)}</strong><small>{m.frequency}</small></div><div className="med-date">{m.startDate ? `From ${formatDate(m.startDate)}` : 'No start date'}{m.endDate ? ` · Until ${formatDate(m.endDate)}` : ''}</div><div className="card-actions"><button onClick={()=>onEdit(m)}>Edit</button><button className="delete" onClick={()=>onDelete(m._id)}>Delete</button></div></article> }
function MedicineModal({initial,onClose,onSave}) { const [form,setForm]=useState({medicineName:'',dosage:'',time:'08:00',frequency:'Daily',startDate:'',endDate:'',enabled:true,...initial}); const [saving,setSaving]=useState(false); const change=e=>setForm({...form,[e.target.name]:e.target.value}); const submit=async e=>{e.preventDefault(); if(!form.medicineName||!form.dosage||!form.time)return; setSaving(true); try{await onSave(form)}catch(err){alert(err.message)}finally{setSaving(false)}}; return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">MEDICINE DETAILS</p><h2>{initial._id?'Edit reminder':'Add medicine'}</h2></div><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid"><label>Medicine name<input name="medicineName" value={form.medicineName} onChange={change} placeholder="e.g. Paracetamol" required/></label><label>Dosage<input name="dosage" value={form.dosage} onChange={change} placeholder="e.g. 500 mg" required/></label><label>Time<input type="time" name="time" value={form.time} onChange={change} required/></label><label>Frequency<select name="frequency" value={form.frequency} onChange={change}><option>Daily</option><option>Twice daily</option><option>Three times daily</option><option>Weekly</option><option>As needed</option></select></label><label>Start date<input type="date" name="startDate" value={form.startDate||''} onChange={change}/></label><label>End date<input type="date" name="endDate" value={form.endDate||''} onChange={change}/></label></div><label className="check"><input type="checkbox" checked={!!form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/> Enable reminder alarm</label><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving?'Saving…':initial._id?'Save changes':'Add medicine'}</button></div></form></div> }
function InfoPage({title,text}) { return <main className="info page"><p className="eyebrow">ABOUT</p><h1>{title}</h1><p>{text}</p><div className="feature-row"><div><b>01</b><h3>Simple storage</h3><p>Medicine data is saved in MongoDB and loaded through the backend API.</p></div><div><b>02</b><h3>Reliable schedule</h3><p>Each reminder keeps its dosage, timing, frequency and date range.</p></div><div><b>03</b><h3>Browser alerts</h3><p>Enable notifications to receive an alert while the dashboard is open.</p></div></div></main> }
function ServicesPage() { return <main className="info page"><p className="eyebrow">SERVICES</p><h1>Everything needed for daily medication.</h1><div className="service-grid"><div>💊<h3>Medicine management</h3><p>Add, edit, enable, disable and delete medicines.</p></div><div>⏰<h3>Timed reminders</h3><p>Browser-side alarm checks your saved schedules every few seconds.</p></div><div>☁️<h3>MongoDB storage</h3><p>Persistent data storage through Node.js and Express REST APIs.</p></div></div></main> }
function formatTime(t){if(!t)return '';const [h,m]=t.split(':');const d=new Date();d.setHours(+h,+m);return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}
function formatDate(d){return new Date(d+'T00:00:00').toLocaleDateString([], {day:'2-digit',month:'short',year:'numeric'})}
function playBeep(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.12,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+1);o.start();o.stop(c.currentTime+1)}catch{}}
export default App
