import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, getWeek } from 'date-fns';
import { supabase } from './supabaseClient'; // Assumi già configurato

const COLORS = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ff9800'];

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', color: COLORS[0] });

    // Fetch eventi da supabase per il mese corrente
    useEffect(() => {
        async function fetchEvents() {
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            let { data, error } = await supabase
                .from('events')
                .select('*')
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: true });
            if (error) console.error(error);
            else setEvents(data);
        }
        fetchEvents();
    }, [currentMonth]);

    const renderHeader = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <button onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>Prev</button>
                <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
                <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>Next</button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 }); // lunedì inizio settimana
        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>
                    {format(addDays(startDate, i), 'EEE')}
                </div>
            );
        }
        return <div style={{ display: 'flex' }}>{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayEvents = events.filter(e => e.date === format(cloneDay, 'yyyy-MM-dd'));

                days.push(
                    <div
                        key={day}
                        style={{
                            flex: 1,
                            border: '1px solid #ddd',
                            height: 100,
                            backgroundColor: isSameMonth(day, monthStart) ? '#fff' : '#f0f0f0',
                            padding: 5,
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={() => {
                            setSelectedDate(cloneDay);
                            setNewEvent({ title: '', date: format(cloneDay, 'yyyy-MM-dd'), color: COLORS[0] });
                            setShowAdd(true);
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>{format(day, 'd')}</div>
                        {dayEvents.map((ev) => (
                            <div
                                key={ev.id}
                                style={{
                                    backgroundColor: ev.color,
                                    borderRadius: 4,
                                    color: '#fff',
                                    fontSize: 12,
                                    padding: '2px 4px',
                                    marginTop: 2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                                title={ev.title}
                            >
                                {ev.title}
                            </div>
                        ))}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day} style={{ display: 'flex', flexDirection: 'row' }}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    const saveEvent = async () => {
        if (!newEvent.title || !newEvent.date) return alert('Inserisci titolo e data');
        const { data, error } = await supabase.from('events').insert([newEvent]);
        if (error) {
            alert('Errore salvataggio evento: ' + error.message);
        } else {
            setShowAdd(false);
            setNewEvent({ title: '', date: '', color: COLORS[0] });
            // Ricarica eventi
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            let { data: eventsData } = await supabase
                .from('events')
                .select('*')
                .gte('date', start)
                .lte('date', end);
            setEvents(eventsData);
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: 'auto', padding: 10 }}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            {showAdd && (
                <div
                    style={{
                        position: 'fixed',
                        top: 50,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        padding: 20,
                        zIndex: 100,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                >
                    <h3>Aggiungi Evento</h3>
                    <input
                        type="text"
                        placeholder="Titolo"
                        value={newEvent.title}
                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                    <input
                        type="date"
                        value={newEvent.date}
                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                    <select
                        value={newEvent.color}
                        onChange={e => setNewEvent({ ...newEvent, color: e.target.value })}
                        style={{ width: '100%', marginBottom: 10 }}
                    >
                        {COLORS.map(c => (
                            <option key={c} value={c} style={{ backgroundColor: c, color: '#fff' }}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <button onClick={saveEvent} style={{ marginRight: 10 }}>
                        Salva
                    </button>
                    <button onClick={() => setShowAdd(false)}>Annulla</button>
                </div>
            )}
        </div>
    );
}
