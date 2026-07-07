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
    const isOnline = r.status === 'online' || (r.last_seen && Date.now() - new Date(r.last_seen) < 10000);
    const statusClass = isOnline ? 'online' : 'offline';
    const selectedClass = selectedRobots.has(r.id) ? 'selected' : '';
    
    return `
      <div class="robot-card ${statusClass} ${selectedClass}" data-id="${r.id}" onclick="toggleRobot('${r.id}')">
        <div class="robot-name">${r.name}</div>
        <div class="robot-status">${isOnline ? 'Online' : 'Offline'}</div>
        <div class="robot-action">Action: ${r.current_action || 'idle'}</div>
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
  
  const customContainer = document.getElementById('custom-actions');
  customContainer.innerHTML = robots.map(r => `
    <div class="custom-action-row">
      <label>${r.name}:</label>
      <select id="action-${r.id}">
        <option value="idle" ${r.current_action === 'idle' ? 'selected' : ''}>Idle</option>
        <option value="khi" ${r.current_action === 'khi' ? 'selected' : ''}>Greeting (khi)</option>
        <option value="khmp" ${r.current_action === 'khmp' ? 'selected' : ''}>Jump (khmp)</option>
        <option value="kpshup" ${r.current_action === 'kpshup' ? 'selected' : ''}>Pushup (kpshup)</option>
        <option value="sit" ${r.current_action === 'sit' ? 'selected' : ''}>Sit</option>
        <option value="stand" ${r.current_action === 'stand' ? 'selected' : ''}>Stand</option>
        <option value="walk" ${r.current_action === 'walk' ? 'selected' : ''}>Walk</option>
        <option value="back" ${r.current_action === 'back' ? 'selected' : ''}>Back</option>
        <option value="left" ${r.current_action === 'left' ? 'selected' : ''}>Left</option>
        <option value="right" ${r.current_action === 'right' ? 'selected' : ''}>Right</option>
        <option value="pee" ${r.current_action === 'pee' ? 'selected' : ''}>Pee</option>
        <option value="stretch" ${r.current_action === 'stretch' ? 'selected' : ''}>Stretch</option>
        <option value="check" ${r.current_action === 'check' ? 'selected' : ''}>Check</option>
        <option value="zero" ${r.current_action === 'zero' ? 'selected' : ''}>Zero</option>
      </select>
    </div>
  `).join('');
}

function toggleRobot(id) {
  if (selectedRobots.has(id)) {
    selectedRobots.delete(id);
  } else {
    selectedRobots.add(id);
  }
  renderRobots();
  updateRobotSelectors();
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

async function setAction() {
  const selectedList = Array.from(selectedRobots);
  if (selectedList.length === 0) {
    alert('Select at least one robot');
    return;
  }
  
  const action = document.getElementById('action').value;
  
  try {
    const res = await fetch('/api/dance/set-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robots: selectedList, action })
    });
    const data = await res.json();
    if (data.success) {
      loadRobots();
    }
  } catch (err) {
    console.error('Error setting action:', err);
  }
}

async function setActionAll() {
  const action = document.getElementById('action').value;
  
  try {
    const res = await fetch('/api/dance/set-action/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (data.success) {
      loadRobots();
    }
  } catch (err) {
    console.error('Error setting action:', err);
  }
}

async function setCustomActions() {
  const actions = {};
  robots.forEach(r => {
    const select = document.getElementById(`action-${r.id}`);
    if (select) {
      actions[r.id] = select.value;
    }
  });
  
  try {
    const res = await fetch('/api/dance/set-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions })
    });
    const data = await res.json();
    if (data.success) {
      loadRobots();
    }
  } catch (err) {
    console.error('Error setting custom actions:', err);
  }
}

async function clearActions() {
  if (!confirm('Reset all robots to idle?')) return;
  
  try {
    await fetch('/api/dance/clear-actions', { method: 'POST' });
    loadRobots();
  } catch (err) {
    console.error('Error clearing actions:', err);
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
          <button onclick="deleteChoreo('${name}')" class="btn-small" style="background: #ef4444;">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading choreographies:', err);
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
