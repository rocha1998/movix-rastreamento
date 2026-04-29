const searchForm = document.getElementById('search-form');
const searchMessage = document.getElementById('search-message');
const trackingResult = document.getElementById('tracking-result');
const trackingSummary = document.getElementById('tracking-summary');
const timeline = document.getElementById('timeline');

function renderLookup(data) {
  const { tracking, history } = data;

  trackingSummary.innerHTML = `
    <div class="summary-item"><small>Cliente</small><strong>${escapeHtml(tracking.customerName)}</strong></div>
    <div class="summary-item"><small>Codigo</small><strong>${escapeHtml(tracking.trackingCode)}</strong></div>
    <div class="summary-item"><small>CPF</small><strong>${escapeHtml(formatCpf(tracking.cpf))}</strong></div>
    <div class="summary-item"><small>Status atual</small><strong class="status-highlight">${escapeHtml(tracking.currentStatus)}</strong></div>
    <div class="summary-item"><small>Origem</small><strong>${escapeHtml(tracking.originState)}</strong></div>
    <div class="summary-item"><small>Destino</small><strong>${escapeHtml(tracking.destinationState)}</strong></div>
    <div class="summary-item"><small>Endereco</small><strong>${escapeHtml(`${tracking.street}, ${tracking.addressNumber} - CEP ${tracking.cep}`)}</strong></div>
    <div class="summary-item"><small>Entrega prevista</small><strong>${escapeHtml(formatDateTime(tracking.estimatedDeliveryAt))}</strong></div>
  `;

  timeline.innerHTML = history
    .map(
      (item) => `
        <article class="timeline-item">
          <strong>${escapeHtml(item.status)}</strong>
          <p class="muted">${escapeHtml(item.note || 'Sem observacoes adicionais.')}</p>
          <small class="muted">${escapeHtml(formatDateTime(item.createdAt))}</small>
        </article>
      `
    )
    .join('');

  trackingResult.classList.remove('hidden');
  trackingResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (searchForm && searchMessage && trackingResult && trackingSummary && timeline) {
  searchForm.cpf.addEventListener('input', (event) => {
    event.target.value = formatCpf(event.target.value);
  });

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(searchMessage);
    trackingResult.classList.add('hidden');

    const submitButton = searchForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const formData = new FormData(searchForm);
      const payload = Object.fromEntries(formData.entries());
      const result = await fetch(`${API_BASE}/trackings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await result.json();
      if (!result.ok) {
        throw new Error(body.message || 'Nao foi possivel consultar o rastreio.');
      }

      renderLookup(body);
    } catch (error) {
      showMessage(searchMessage, error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}
