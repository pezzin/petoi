let robots = [];
let selectedRobots = new Set();
let commandsConfig = [];

async function loadCommandsConfig() {
  try {
    const res = await fetch('/api/dance/commands');
    commandsConfig = await res.json();
    renderCommandsTable();
    updateActionSelect();
    updateCustomActionSelects();
  } catch (err) {
    console.error('Error loading commands config:', err);
  }
}

function renderCommandsTable() {
  const tbody = document.getElementById('commands-table-body');
  tbody.innerHTML = commandsConfig.map(cmd => `
    <tr>
      <td>${cmd.display_name}</td>
      <td>
        <input type="text" id="cmd-${cmd.action}" value="${cmd.command}" placeholder="PETOI command">
      </td>
      <td>
        <button onclick="saveCommand('${cmd.action}')" class="btn-save">Save</button>
      </td>
    </tr>
  `).join('');
}

function updateActionSelect() {
  const select = document.getElementById('action');
  select.innerHTML = '<option value="idle">Idle</option>' + 
    commandsConfig.map(cmd => `<option value="${cmd.action}">${cmd.display_name} (${cmd.command})</option>`).join('');
}

function updateCustomActionSelects() {
  if (robots.length === 0) return;
  
  const customContainer = document.getElementById('custom-actions');
  customContainer.innerHTML = robots.map(r => {
    const options = '<option value="idle">Idle</option>' + 
      commandsConfig.map(cmd => `<option value="${cmd.action}" ${r.current_action === cmd.action ? 'selected' : ''}>${cmd.display_name} (${cmd.command})</option>`).join('');
    
    return `
      <div class="custom-action-row">
        <label>${r.name}:</label>
        <select id="action-${r.id}">${options}</select>
      </div>
    `;
  }).join('');
}

async function saveCommand(action) {
  const input = document.getElementById(`cmd-${action}`);
  const command = input.value;
  const displayName = commandsConfig.find(c => c.action === action)?.display_name || action;
  
  try {
    const res = await fetch(`/api/dance/commands/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, display_name: displayName })
    });
    const data = await res.json();
    if (data.success) {
      await loadCommandsConfig();
    }
  } catch (err) {
    console.error('Error saving command:', err);
  }
}

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
  
  updateCustomActionSelects();
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

async function loadTeams() {
  try {
    const res = await fetch('/api/dance/teams');
    const teams = await res.json();
    
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`team-${i}`);
      if (input && teams[`team_${i}`]) {
        input.value = teams[`team_${i}`];
      }
    }
  } catch (err) {
    console.error('Error loading teams:', err);
  }
}

async function saveTeam(teamId) {
  const num = teamId.split('_')[1];
  const inputId = `team-${num}`;
  const name = document.getElementById(inputId).value;
  
  try {
    const res = await fetch(`/api/dance/teams/${teamId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
      console.log('Team saved:', teamId, name);
    }
  } catch (err) {
    console.error('Error saving team:', err);
  }
}

loadCommandsConfig();
loadRobots();
loadTeams();
setInterval(loadRobots, 3000);
