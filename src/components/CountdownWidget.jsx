import { useEffect, useState } from 'react';

const ELECTION_DATE = new Date('2027-02-08T07:00:00');

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function CountdownWidget() {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const diff = ELECTION_DATE - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: 'Days',    value: timeLeft.days },
    { label: 'Hours',   value: timeLeft.hours },
    { label: 'Mins',    value: timeLeft.minutes },
    { label: 'Secs',    value: timeLeft.seconds },
  ];

  return (
    <div className="countdown-widget">
      <p className="countdown-label">⏳ Next Major Election</p>
      <p className="countdown-title">Uttar Pradesh Assembly Elections 2027</p>
      <div className="countdown-grid">
        {units.map(u => (
          <div className="countdown-unit" key={u.label}>
            <div className="countdown-num">{pad(u.value ?? 0)}</div>
            <div className="countdown-unit-label">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
