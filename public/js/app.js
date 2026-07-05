async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    document.getElementById('status').innerHTML = 
      `<span class="status-ok">Online</span> - ${new Date(data.time).toLocaleString('it-IT')}`;
  } catch (err) {
    document.getElementById('status').innerHTML = 
      '<span class="status-error">Offline</span>';
  }
}

async function loadSensorData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    
    if (data.length === 0) {
      document.getElementById('sensor-data').innerHTML = 'Nessun dato disponibile';
      return;
    }
    
    const html = data.map(d => 
      `<div class="sensor-row">
        <strong>${d.sensor}</strong>: ${d.value}
        <small>${new Date(d.created_at).toLocaleString('it-IT')}</small>
      </div>`
    ).join('');
    
    document.getElementById('sensor-data').innerHTML = html;
  } catch (err) {
    document.getElementById('sensor-data').innerHTML = 'Errore caricamento dati';
  }
}

checkStatus();
loadSensorData();

setInterval(checkStatus, 30000);
