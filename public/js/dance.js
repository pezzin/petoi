let robots = [];
let selectedRobots = new Set();

async function loadRobots() {
  try {
    const res = await fetch('/api/dance/robots');
    robots = await res.json();
    renderRobots();
    updateRobotSelectors();
  } catch (err) {
    console.error('Error loading robots:', err);
  }
}

function renderRobots() {
  const container = document.getElementById('robots-list');
  container.innerHTML = robots.map(r => {
    const isOnline = r.status === 'online' || (r.last_seen && Date.now() - new Date(r.last_seen) < 5000);
    const statusClass = isOnline ? 'online' : 'offline';
    const selectedClass = selectedRobots.has(r.id) ? 'selected' : '';
    
    return `
      <div class="robot-card ${statusClass} ${selectedClass}" data-id="${r.id}">
        <div class="robot-name">${r.name}</div>
        <div class="robot-status">${isOnline ? 'Online' : 'Offline'}</div>
        ${r.pending_commands > 0 ? `<div class="robot-commands">${r.pending_commands} pending</div>` : ''}
      </div>
    `;
  }).join('');
}

function updateRobotSelectors() {
  const container = document.getElementById('robot-selectors');
  container.innerHTML = robots.map(r => `
    <label class="robot-checkbox">
      <input type="checkbox" value="${r.id}" ${selectedRobots.has(r.id) ? 'checked' : ''} 
             onchange="toggleRobot('${r.id}')">
      ${r.name}
    </label>
  `).join('');
}

function toggleRobot(id) {
  if (selectedRobots.has(id)) {
    selectedRobots.delete(id);
  } else {
    selectedRobots.add(id);
  }
  renderRobots();
}

function selectAll() {
  robots.forEach(r => selectedRobots.add(r.id));
  updateRobotSelectors();
  renderRobots();
}

function selectNone() {
  selectedRobots.clear();
  updateRobotSelectors();
  renderRobots();
}

document.getElementById('command')?.addEventListener('change', (e) => {
  const customGroup = document.getElementById('custom-command-group');
  customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
});

async function sendCommand() {
  const robots = Array.from(selectedRobots);
  if (robots.length === 0) {
    alert('Select at least one robot');
    return;
  }
  
  const commandSelect = document.getElementById('command');
  let command = commandSelect.value;
  
  if (command === 'custom') {
    command = document.getElementById('custom-command').value;
    if (!command) {
      alert('Enter a custom command');
      return;
    }
  }
  
  const params = document.getElementById('params').value;
  
  try {
    const res = await fetch('/api/dance/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robots, command, params })
    });
    const data = await res.json();
    if (data.success) {
      console.log('Command sent:', data);
      loadRobots();
    }
  } catch (err) {
    console.error('Error sending command:', err);
  }
}

async function sendToAll() {
  const commandSelect = document.getElementById('command');
  let command = commandSelect.value;
  
  if (command === 'custom') {
    command = document.getElementById('custom-command').value;
    if (!command) {
      alert('Enter a custom command');
      return;
    }
  }
  
  const params = document.getElementById('params').value;
  
  try {
    const res = await fetch('/api/dance/command/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, params })
    });
    const data = await res.json();
    if (data.success) {
      console.log('Command sent to all:', data);
      loadRobots();
    }
  } catch (err) {
    console.error('Error sending command:', err);
  }
}

async function clearCommands() {
  if (!confirm('Clear all pending commands?')) return;
  
  try {
    await fetch('/api/dance/commands', { method: 'DELETE' });
    loadRobots();
  } catch (err) {
    console.error('Error clearing commands:', err);
  }
}

async function saveChoreography() {
  const name = document.getElementById('choreo-name').value;
  const stepsText = document.getElementById('choreo-steps').value;
  
  if (!name) {
    alert('Enter choreography name');
    return;
  }
  
  let steps;
  try {
    steps = JSON.parse(stepsText);
  } catch (e) {
    alert('Invalid JSON for steps');
    return;
  }
  
  try {
    const res = await fetch(`/api/dance/choreography/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps })
    });
    const data = await res.json();
    if (data.success) {
      alert('Choreography saved!');
      loadChoreographies();
    }
  } catch (err) {
    console.error('Error saving choreography:', err);
  }
}

async function loadChoreographies() {
  try {
    const res = await fetch('/api/dance/choreography/list');
    const choreos = await res.json();
    
    const container = document.getElementById('choreo-list');
    if (Object.keys(choreos).length === 0) {
      container.innerHTML = '<p style="opacity: 0.6;">No saved choreographies</p>';
      return;
    }
    
    container.innerHTML = Object.entries(choreos).map(([name, steps]) => `
      <div class="choreo-item">
        <span>${name} (${steps.length} steps)</span>
        <div>
          <button onclick="executeChoreo('${name}')" class="btn-small">Execute</button>
          <button onclick="deleteChoreo('${name}')" class="btn-small" style="background: #ef4444;">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading choreographies:', err);
  }
}

async function executeChoreo(name) {
  try {
    const res = await fetch(`/api/dance/choreography/${name}/execute`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      alert('Choreography started!');
    }
  } catch (err) {
    console.error('Error executing choreography:', err);
  }
}

async function deleteChoreo(name) {
  if (!confirm(`Delete choreography "${name}"?`)) return;
  
  try {
    await fetch(`/api/dance/choreography/${name}`, { method: 'DELETE' });
    loadChoreographies();
  } catch (err) {
    console.error('Error deleting choreography:', err);
  }
}

loadRobots();
loadChoreographies();
setInterval(loadRobots, 3000);
