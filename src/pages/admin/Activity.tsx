export default function Activity() {
  const logins14 = [31, 44, 52, 38, 61, 22, 14, 48, 55, 67, 59, 71, 63, 67];
  const byHour: [string, number][] = [['08', 12], ['09', 28], ['10', 41], ['11', 52], ['12', 19], ['14', 33], ['15', 44], ['16', 58], ['17', 26]];

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">Daily user activity</h2>
      <div className="grid g4 mb">
        <div className="kpi b"><div className="lab">Logins today</div><div className="val">67</div><div className="sub">+18% vs yesterday</div></div>
        <div className="kpi g"><div className="lab">Daily active users</div><div className="val">54</div><div className="sub">of 10 registered</div></div>
        <div className="kpi o"><div className="lab">Avg session length</div><div className="val">24m</div></div>
        <div className="kpi p"><div className="lab">Peak concurrent</div><div className="val">31</div><div className="sub">at 11:20</div></div>
      </div>
      <div className="grid g2">
        <div className="card"><div className="card-h"><h3>Logins — last 14 days</h3></div><div className="card-b"><div className="chartbars">
          {logins14.map((v, i) => <div key={i} className="cb"><i style={{ height: (v / 75 * 100) + '%' }} /><span>{i + 13}</span></div>)}
        </div></div></div>
        <div className="card"><div className="card-h"><h3>Activity by hour</h3></div><div className="card-b"><div className="chartbars">
          {byHour.map(([h, v]) => <div key={h} className={'cb ' + (v > 50 ? 'g' : '')}><b className="xs">{v}</b><i style={{ height: (v / 60 * 100) + '%' }} /><span>{h}</span></div>)}
        </div></div></div>
      </div>
    </div>
  );
}
