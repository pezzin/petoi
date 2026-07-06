let lastMessageId = 0;

async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    const messages = await res.json();
    
    const container = document.getElementById('messages-container');
    
    if (messages.length === 0) {
      if (lastMessageId !== 0) {
        container.innerHTML = '<div class="message-empty">Nessun messaggio</div>';
        lastMessageId = 0;
      }
      return;
    }
    
    const latestId = messages[0].id;
    if (latestId === lastMessageId) return;
    lastMessageId = latestId;
    
    const html = messages.map((m, i) => 
      `<div class="message-item ${i === 0 ? 'latest' : ''}">
        <div class="message-text">${escapeHtml(m.text)}</div>
        <div class="message-meta">
          <span>${m.source || 'robot'}</span>
          <span>${new Date(m.created_at).toLocaleString('it-IT')}</span>
        </div>
      </div>`
    ).join('');
    
    container.innerHTML = html;
  } catch (err) {
    console.error('Errore caricamento messaggi:', err);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('clear-messages')?.addEventListener('click', async () => {
  if (!confirm('Cancellare tutti i messaggi?')) return;
  try {
    await fetch('/api/messages', { method: 'DELETE' });
    loadMessages();
  } catch (err) {
    console.error('Errore cancellazione:', err);
  }
});

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

loadMessages();
checkStatus();
loadSensorData();

setInterval(loadMessages, 2000);
setInterval(checkStatus, 30000);
