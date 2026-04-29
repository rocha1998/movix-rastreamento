requireAuth();

const trackingForm = document.getElementById('tracking-form');
const formTitle = document.getElementById('form-title');
const formMessage = document.getElementById('form-message');
const listMessage = document.getElementById('list-message');
const resetButton = document.getElementById('reset-form');
const logoutButton = document.getElementById('logout-button');
const tableBody = document.getElementById('tracking-table-body');
const statusModal = document.getElementById('status-modal');
const statusForm = document.getElementById('status-form');
const statusMessage = document.getElementById('status-message');
const adminName = document.getElementById('admin-name');

let currentEditingId = null;
let statusTrackingId = null;
let trackingsCache = [];

const storedAdmin = localStorage.getItem(adminStorageKey);
if (storedAdmin) {
  try {
    adminName.textContent = JSON.parse(storedAdmin).username;
  } catch (error) {
    adminName.textContent = 'admin';
  }
}

function resetForm() {
  currentEditingId = null;
  trackingForm.reset();
  formTitle.textContent = 'Criar novo rastreio';
  clearMessage(formMessage);
}

function populateForm(tracking) {
  currentEditingId = tracking.id;
  formTitle.textContent = `Editando ${tracking.trackingCode}`;
  trackingForm.customerName.value = tracking.customerName;
  trackingForm.cpf.value = formatCpf(tracking.cpf);
  trackingForm.trackingCode.value = tracking.trackingCode;
  trackingForm.originState.value = tracking.originState;
  trackingForm.destinationState.value = tracking.destinationState;
  trackingForm.street.value = tracking.street;
  trackingForm.addressNumber.value = tracking.addressNumber;
  trackingForm.cep.value = formatCep(tracking.cep);
  trackingForm.estimatedDeliveryAt.value = new Date(tracking.estimatedDeliveryAt)
    .toISOString()
    .slice(0, 16);
  trackingForm.currentStatus.value = tracking.currentStatus;
  trackingForm.observations.value = tracking.observations || '';
}

function renderTable() {
  if (trackingsCache.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="muted">Nenhum rastreio cadastrado ate o momento.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = trackingsCache
    .map(
      (tracking) => `
        <tr>
          <td>${escapeHtml(tracking.customerName)}</td>
          <td>${escapeHtml(formatCpf(tracking.cpf))}</td>
          <td>${escapeHtml(tracking.trackingCode)}</td>
          <td>${escapeHtml(tracking.originState)} → ${escapeHtml(tracking.destinationState)}</td>
          <td><span class="status-badge">${escapeHtml(tracking.currentStatus)}</span></td>
          <td>${escapeHtml(formatDateTime(tracking.estimatedDeliveryAt))}</td>
          <td>
            <div class="table-actions">
              <button class="btn-secondary" data-action="edit" data-id="${tracking.id}">Editar</button>
              <button class="btn-success" data-action="status" data-id="${tracking.id}">Status</button>
              <button class="btn-danger" data-action="delete" data-id="${tracking.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

async function loadTrackings() {
  try {
    clearMessage(listMessage);
    trackingsCache = await apiRequest('/admin/trackings');
    renderTable();
  } catch (error) {
    showMessage(listMessage, error.message, 'error');
  }
}

trackingForm.cpf.addEventListener('input', (event) => {
  event.target.value = formatCpf(event.target.value);
});

trackingForm.cep.addEventListener('input', (event) => {
  event.target.value = formatCep(event.target.value);
});

trackingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(formMessage);

  const formData = new FormData(trackingForm);
  const payload = Object.fromEntries(formData.entries());
  const submitButton = trackingForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    if (currentEditingId) {
      await apiRequest(`/admin/trackings/${currentEditingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      resetForm();
      showMessage(formMessage, 'Rastreio atualizado com sucesso.', 'success');
    } else {
      await apiRequest('/admin/trackings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      resetForm();
      showMessage(formMessage, 'Rastreio criado com sucesso.', 'success');
    }

    await loadTrackings();
  } catch (error) {
    const details = error.details?.length ? ` ${error.details.join(' ')}` : '';
    showMessage(formMessage, `${error.message}${details}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

tableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const trackingId = button.dataset.id;
  const action = button.dataset.action;
  const tracking = trackingsCache.find((item) => String(item.id) === String(trackingId));

  if (!tracking) {
    return;
  }

  if (action === 'edit') {
    populateForm(tracking);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (action === 'status') {
    statusTrackingId = tracking.id;
    statusForm.status.value = tracking.currentStatus;
    statusForm.note.value = '';
    statusModal.classList.remove('hidden');
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Excluir o rastreio ${tracking.trackingCode}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/admin/trackings/${tracking.id}`, { method: 'DELETE' });
      showMessage(listMessage, 'Rastreio excluido com sucesso.', 'success');
      if (currentEditingId === tracking.id) {
        resetForm();
      }
      await loadTrackings();
    } catch (error) {
      showMessage(listMessage, error.message, 'error');
    }
  }
});

statusForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(statusMessage);

  const submitButton = statusForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const formData = new FormData(statusForm);
    const payload = Object.fromEntries(formData.entries());
    await apiRequest(`/admin/trackings/${statusTrackingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    statusModal.classList.add('hidden');
    showMessage(listMessage, 'Status atualizado com sucesso.', 'success');
    await loadTrackings();
  } catch (error) {
    showMessage(statusMessage, error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById('close-status-modal').addEventListener('click', () => {
  statusModal.classList.add('hidden');
});

resetButton.addEventListener('click', resetForm);

logoutButton.addEventListener('click', () => {
  clearSession();
  window.location.href = '/admin/index.html';
});

loadTrackings();
