import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Setting.css';

const supabase = createClient(
  'https://efzgpbneonewotqxozau.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmemdwYm5lb25ld290cXhvemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTc5NDIsImV4cCI6MjA2MzY5Mzk0Mn0.nTGx7dLuieQqA_AKhlTncUtCPWA2I0tWq1qAJEmu8sg'
);

export default function Setting() {
  const [players, setPlayers] = useState([]);
  const [injuryType, setInjuryType] = useState([]);
  const [bodyParts, setBodyParts] = useState([]);
  const [severity, setSeverity] = useState([]);

  const [injuryData, setInjuryData] = useState({
    date: '',
    player: '',
    type: '',
    bodyPart: '',
    severity: '',
    message: '',
    saving: false
  });

  const [testData, setTestData] = useState({
    date: '',
    player: '',
    sprint10: '',
    sprint30: '',
    sj: '',
    cmj: '',
    message: '',
    saving: false
  });

  const [minutesData, setMinutesData] = useState({
    player: '',
    minutes: '',
    games: '',
    goals: '',
    message: '',
    saving: false
  });

  const [resistanceData, setResistanceData] = useState({
    date: '',
    player: '',
    result1: '',
    result2: '',
    result3: '',
    result4: '',
    result5: '',
    result6: '',
    message: '',
    saving: false
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: p }, { data: it }, { data: bp }, { data: sev }] = await Promise.all([
        supabase.from('Players').select('Name').order('Name'),
        supabase.from("Setting injurytype").select('Injury_type'),
        supabase.from('Setting bodypart').select('Body_part'),
        supabase.from('Setting severety').select('Severety'),
      ]);
      if (p) setPlayers(p);
      if (it) setInjuryType([...new Set(it.map(i => i.Injury_type))]);
      if (bp) setBodyParts([...new Set(bp.map(b => b.Body_part))]);
      if (sev) setSeverity([...new Set(sev.map(s => s.Severety))]);
    };
    fetchData();
  }, []);

  const handleChange = (dataSetter, field) => e => dataSetter(prev => ({ ...prev, [field]: e.target.value }));

  const renderOptions = (arr) => arr.map(item => <option key={item} value={item}>{item}</option>);

  // Salvataggio Infortunio
  const saveInjury = async () => {
    const { date, player, type, severity: sev, bodyPart } = injuryData;
    if (!date || !player || !type || !sev || !bodyPart) {
      setInjuryData(prev => ({ ...prev, message: 'Completa tutti i campi infortunio' }));
      return;
    }
    setInjuryData(prev => ({ ...prev, saving: true }));
    const { error } = await supabase.from('Injury').insert([{
      date,
      Name: player,
      Injury_type: type,
      Severety: sev,
      Body_part: bodyPart
    }]);
    if (error) {
      setInjuryData(prev => ({ ...prev, message: 'Errore salvataggio infortunio', saving: false }));
    } else {
      setInjuryData({ date: '', player: '', type: '', bodyPart: '', severity: '', message: 'Infortunio salvato con successo!', saving: false });
    }
  };

  // Salvataggio Test
  const saveTest = async () => {
    const { date, player, sprint10, sprint30, sj, cmj } = testData;
    if (!date || !player) {
      setTestData(prev => ({ ...prev, message: 'Completa almeno data e giocatore per il test' }));
      return;
    }
    setTestData(prev => ({ ...prev, saving: true }));
    const { error } = await supabase.from('Test').insert([{
      date,
      Name: player,
      sprint_10m: parseFloat(sprint10) || null,
      sprint_30m: parseFloat(sprint30) || null,
      SJ: parseFloat(sj) || null,
      CMJ: parseFloat(cmj) || null
    }]);
    if (error) {
      setTestData(prev => ({ ...prev, message: 'Errore salvataggio test', saving: false }));
    } else {
      setTestData({ date: '', player: '', sprint10: '', sprint30: '', sj: '', cmj: '', message: 'Test salvato con successo!', saving: false });
    }
  };

  // Salvataggio Minuti Giocati
  const saveMinutes = async () => {
    const { player, minutes, games, goals } = minutesData;
    if (!player || !minutes || !games || !goals) {
      setMinutesData(prev => ({ ...prev, message: 'Completa tutti i campi minuti giocati' }));
      return;
    }
    setMinutesData(prev => ({ ...prev, saving: true }));

    const { data: existing, error: fetchError } = await supabase
      .from('Minuti giocati')
      .select('*')
      .eq('Name', player)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      setMinutesData(prev => ({ ...prev, message: 'Errore caricamento dati esistenti', saving: false }));
      return;
    }

    if (existing) {
      const updatedMinutes = existing.minutes_played + parseInt(minutes, 10);
      const updatedGames = existing.games_played + parseInt(games, 10);
      const updatedGoals = existing.Goal + parseInt(goals, 10);

      const { error: updateError } = await supabase
        .from('Minuti giocati')
        .update({
          minutes_played: updatedMinutes,
          games_played: updatedGames,
          Goal: updatedGoals
        })
        .eq('Name', player);

      if (updateError) {
        setMinutesData(prev => ({ ...prev, message: 'Errore aggiornamento minuti', saving: false }));
      } else {
        setMinutesData({ player: '', minutes: '', games: '', goals: '', message: 'Minuti aggiornati con successo!', saving: false });
      }

    } else {
      const { error: insertError } = await supabase.from('Minuti giocati').insert([{
        Name: player,
        minutes_played: parseInt(minutes, 10),
        games_played: parseInt(games, 10),
        Goal: parseInt(goals, 10)
      }]);
      if (insertError) {
        setMinutesData(prev => ({ ...prev, message: 'Errore salvataggio minuti', saving: false }));
      } else {
        setMinutesData({ player: '', minutes: '', games: '', goals: '', message: 'Minuti salvati con successo!', saving: false });
      }
    }
  };

  return (
    <div className="setting-content" style={{ padding: 20 }}>
      <h1>Impostazioni Dati Giocatori</h1>

      {/* INFORTUNI */}
      <section className="injury-section">
        <h2>Inserisci Infortunio</h2>
        <div className="form-row">
          <label>Data:</label>
          <input type="date" value={injuryData.date} onChange={handleChange(setInjuryData, 'date')} />
        </div>
        <div className="form-row">
          <label>Giocatore:</label>
          <select value={injuryData.player} onChange={handleChange(setInjuryData, 'player')}>
            <option value="">-- Seleziona --</option>
            {players.map(p => <option key={p.Name} value={p.Name}>{p.Name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Tipo Infortunio:</label>
          <select value={injuryData.type} onChange={handleChange(setInjuryData, 'type')}>
            <option value="">-- Seleziona --</option>
            {renderOptions(injuryType)}
          </select>
        </div>
        <div className="form-row">
          <label>Parte Corpo:</label>
          <select value={injuryData.bodyPart} onChange={handleChange(setInjuryData, 'bodyPart')}>
            <option value="">-- Seleziona --</option>
            {renderOptions(bodyParts)}
          </select>
        </div>
        <div className="form-row">
          <label>Gravità:</label>
          <select value={injuryData.severity} onChange={handleChange(setInjuryData, 'severity')}>
            <option value="">-- Seleziona --</option>
            {renderOptions(severity)}
          </select>
        </div>
        <button onClick={saveInjury} disabled={injuryData.saving}>
          {injuryData.saving ? 'Salvataggio...' : 'Salva Infortunio'}
        </button>
        <p className="message">{injuryData.message}</p>
      </section>

      {/* MINUTI GIOCATI */}
      <section className="minutes-section" style={{ marginTop: 40 }}>
        <h2>Minuti Giocati</h2>
        <div className="form-row">
          <label>Giocatore:</label>
          <select value={minutesData.player} onChange={handleChange(setMinutesData, 'player')}>
            <option value="">-- Seleziona --</option>
            {players.map(p => <option key={p.Name} value={p.Name}>{p.Name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Minuti Giocati:</label>
          <input type="number" min="0" value={minutesData.minutes} onChange={handleChange(setMinutesData, 'minutes')} />
        </div>
        <div className="form-row">
          <label>Partite Giocate:</label>
          <input type="number" min="0" value={minutesData.games} onChange={handleChange(setMinutesData, 'games')} />
        </div>
        <div className="form-row">
          <label>Goal:</label>
          <input type="number" min="0" value={minutesData.goals} onChange={handleChange(setMinutesData, 'goals')} />
        </div>
        <button onClick={saveMinutes} disabled={minutesData.saving}>
          {minutesData.saving ? 'Salvataggio...' : 'Salva Minuti'}
        </button>
        <p className="message">{minutesData.message}</p>
      </section>

      {/* TEST */}
      <section className="test-section" style={{ marginTop: 40 }}>
        <h2>Inserisci Test Forza e Velocita'</h2>
        <div className="form-row">
          <label>Data:</label>
          <input type="date" value={testData.date} onChange={handleChange(setTestData, 'date')} />
        </div>
        <div className="form-row">
          <label>Giocatore:</label>
          <select value={testData.player} onChange={handleChange(setTestData, 'player')}>
            <option value="">-- Seleziona --</option>
            {players.map(p => <option key={p.Name} value={p.Name}>{p.Name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Sprint 10m (sec):</label>
          <input type="number" step="0.01" value={testData.sprint10} onChange={handleChange(setTestData, 'sprint10')} />
        </div>
        <div className="form-row">
          <label>Sprint 30m (sec):</label>
          <input type="number" step="0.01" value={testData.sprint30} onChange={handleChange(setTestData, 'sprint30')} />
        </div>
        <div className="form-row">
          <label>Squat Jump (cm):</label>
          <input type="number" step="0.1" value={testData.sj} onChange={handleChange(setTestData, 'sj')} />
        </div>
        <div className="form-row">
          <label>Counter Movement Jump (cm):</label>
          <input type="number" step="0.1" value={testData.cmj} onChange={handleChange(setTestData, 'cmj')} />
        </div>
        <button onClick={saveTest} disabled={testData.saving}>
          {testData.saving ? 'Salvataggio...' : 'Salva Test'}
        </button>
        <p className="message">{testData.message}</p>
      </section>

      {/* RESISTENZA */}
      <section className="resistance-section">
        <h2>Inserisci Test di Resistenza</h2>
        <div className="form-row">
          <label>Data:</label>
          <input type="date" value={resistanceData.date} onChange={handleChange(setResistanceData, 'date')} />
        </div>
        <div className="form-row">
          <label>Giocatore:</label>
          <select value={resistanceData.player} onChange={handleChange(setResistanceData, 'player')}>
            <option value="">-- Seleziona --</option>
            {players.map(p => <option key={p.Name} value={p.Name}>{p.Name}</option>)}
          </select>
        </div>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div className="form-row" key={i}>
            <label>Risultato {i}:</label>
            <input
              type="number"
              value={resistanceData[`result${i}`]}
              onChange={handleChange(setResistanceData, `result${i}`)}
              step="0.01"
            />
          </div>
        ))}
        <button
          onClick={async () => {
            const { date, player, result1, result2, result3, result4, result5, result6 } = resistanceData;
            if (!date || !player) {
              setResistanceData(prev => ({ ...prev, message: 'Completa almeno data e giocatore per il test' }));
              return;
            }
            setResistanceData(prev => ({ ...prev, saving: true }));
            const { error } = await supabase.from('ResistanceTest').insert([{
              date,
              Name: player,
              result_1: parseFloat(result1) || null,
              result_2: parseFloat(result2) || null,
              result_3: parseFloat(result3) || null,
              result_4: parseFloat(result4) || null,
              result_5: parseFloat(result5) || null,
              result_6: parseFloat(result6) || null,
            }]);
            if (error) {
              setResistanceData(prev => ({ ...prev, message: 'Errore salvataggio test resistenza', saving: false }));
            } else {
              setResistanceData({
                player: '', date: '',
                result1: '', result2: '', result3: '', result4: '', result5: '', result6: '',
                saving: false, message: 'Test resistenza salvato con successo!'
              });
            }
          }}
          disabled={resistanceData.saving}
        >
          {resistanceData.saving ? 'Salvataggio...' : 'Salva Test Resistenza'}
        </button>
        <p className="message">{resistanceData.message}</p>
      </section>
    </div>
  );
}