import React, { useMemo, useState } from 'react';

type WorkoutType = 'push' | 'pull' | 'legs' | 'full' | 'cardio' | 'other';

type WorkoutEntry = {
  id: string;
  date: string; // ISO date
  type: WorkoutType;
  notes?: string;
};

const WORKOUT_LABELS: Record<WorkoutType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  full: 'Full Body',
  cardio: 'Cardio',
  other: 'Other',
};

const STORAGE_KEY = 'gym-streak-entries-v1';

const todayISO = () => new Date().toISOString().slice(0, 10);

const loadInitialEntries = (): WorkoutEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkoutEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const saveEntries = (entries: WorkoutEntry[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
};

const getStreak = (entries: WorkoutEntry[]): number => {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  let cursor = new Date();

  // Normalize to local midnight
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!days.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const formatNiceDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

export const App: React.FC = () => {
  const [entries, setEntries] = useState<WorkoutEntry[]>(() =>
    loadInitialEntries(),
  );
  const [date, setDate] = useState(todayISO);
  const [type, setType] = useState<WorkoutType>('full');
  const [notes, setNotes] = useState('');

  const streak = useMemo(() => getStreak(entries), [entries]);

  const weeklyVolume = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(now);
    start.setDate(now.getDate() - 6); // last 7 days including today

    const buckets: Record<string, number> = {};

    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      buckets[iso] = 0;
    }

    entries.forEach((e) => {
      if (e.date in buckets) {
        buckets[e.date] += 1;
      }
    });

    return Object.entries(buckets).map(([iso, count]) => ({
      iso,
      count,
    }));
  }, [entries]);

  const handleAdd = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!date) return;
    const entry: WorkoutEntry = {
      id: `${date}-${Date.now()}`,
      date,
      type,
      notes: notes.trim() || undefined,
    };
    const next = [...entries, entry].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(next);
    saveEntries(next);
    setNotes('');
    setDate(todayISO());
  };

  const handleDelete = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  };

  const handleShare = async () => {
    const baseText = `I'm on a ${streak}-day gym streak in Gym Streak! 💪\n\n` +
      `This week I've logged ${entries.length} workouts.\n` +
      'Keep me accountable!';

    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Gym Streak',
          text: baseText,
          url: shareUrl,
        });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(`${baseText}\n${shareUrl}`);
        // eslint-disable-next-line no-alert
        alert('Share text copied to clipboard!');
      } else {
        // Fallback: open Twitter/X intent
        const encoded = encodeURIComponent(`${baseText}\n${shareUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Could not open share dialog. You can still share manually!');
      // eslint-disable-next-line no-console
      console.error('Share failed', err);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">Gym Streak</h1>
          <p className="app-subtitle">Show up. Stack days. Stay consistent.</p>
        </div>
        <button
          type="button"
          className="primary-button share-button"
          onClick={handleShare}
        >
          Share streak
        </button>
      </header>

      <main className="app-main">
        <section className="streak-card">
          <p className="streak-label">Current streak</p>
          <p className="streak-value">
            {streak}
            <span className="streak-unit">days</span>
          </p>
          <p className="streak-helper">
            Log today&apos;s workout to keep the flame alive.
          </p>
        </section>

        <section className="grid two-column">
          <section className="card">
            <h2 className="card-title">Log workout</h2>
            <form className="form" onSubmit={handleAdd}>
              <label className="field">
                <span className="field-label">Date</span>
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Focus</span>
                <div className="chip-row">
                  {(Object.keys(WORKOUT_LABELS) as WorkoutType[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={
                        type === key ? 'chip chip-active' : 'chip'
                      }
                      onClick={() => setType(key)}
                    >
                      {WORKOUT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </label>

              <label className="field">
                <span className="field-label">Notes (optional)</span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input textarea"
                  placeholder="PRs, energy level, anything you want to remember..."
                />
              </label>

              <button type="submit" className="primary-button full-width">
                Add workout
              </button>
            </form>
          </section>

          <section className="card">
            <h2 className="card-title">This week</h2>
            <div className="mini-chart" aria-hidden="true">
              {weeklyVolume.map(({ iso, count }) => (
                <div key={iso} className="mini-bar">
                  <div
                    className="mini-bar-fill"
                    style={{ height: `${Math.min(count * 30, 100)}%` }}
                  />
                  <span className="mini-bar-label">
                    {new Date(iso).toLocaleDateString(undefined, {
                      weekday: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
            <p className="mini-chart-helper">
              Bars show how many workouts you logged each day in the last week.
            </p>
          </section>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">History</h2>
            <span className="card-meta">
              {entries.length ? `${entries.length} logged workouts` : 'No workouts yet'}
            </span>
          </div>
          {entries.length === 0 ? (
            <p className="empty-state">
              Your future self will be proud you started today. Log your first
              session above.
            </p>
          ) : (
            <ul className="history-list">
              {[...entries]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((entry) => (
                  <li key={entry.id} className="history-item">
                    <div>
                      <p className="history-title">
                        {WORKOUT_LABELS[entry.type]} day
                      </p>
                      <p className="history-meta">
                        {formatNiceDate(entry.date)}
                      </p>
                      {entry.notes && (
                        <p className="history-notes">{entry.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Delete entry"
                    >
                      ✕
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>Built for consistency, not perfection.</span>
      </footer>
    </div>
  );
};

