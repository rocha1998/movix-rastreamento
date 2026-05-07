function normalizeCpf(value = '') {
  return String(value).replace(/\D/g, '');
}

function normalizeCep(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeTrackingCode(value = '') {
  return String(value).trim().toUpperCase();
}

function validateTrackingPayload(payload, { partial = false } = {}) {
  const errors = [];

  const normalized = {
    customerName: payload.customerName?.trim(),
    cpf: normalizeCpf(payload.cpf),
    trackingCode: normalizeTrackingCode(payload.trackingCode),
    originState: payload.originState?.trim(),
    destinationState: payload.destinationState?.trim(),
    street: payload.street?.trim(),
    addressNumber: payload.addressNumber?.trim(),
    cep: normalizeCep(payload.cep),
    estimatedDeliveryAt: payload.estimatedDeliveryAt,
    currentStatus: payload.currentStatus?.trim(),
    observations: payload.observations?.trim() || '',
  };

  const requiredFields = [
    ['customerName', 'Nome do cliente'],
    ['cpf', 'CPF'],
    ['trackingCode', 'Codigo do rastreio'],
    ['originState', 'Estado de origem'],
    ['destinationState', 'Estado de destino'],
    ['street', 'Rua'],
    ['addressNumber', 'Numero'],
    ['cep', 'CEP'],
    ['estimatedDeliveryAt', 'Data prevista de entrega'],
    ['currentStatus', 'Status atual'],
  ];

  for (const [key, label] of requiredFields) {
    if (!partial || payload[key] !== undefined) {
      if (!normalized[key]) {
        errors.push(`${label} e obrigatorio.`);
      }
    }
  }

  if (normalized.cpf && normalized.cpf.length !== 11) {
    errors.push('CPF deve conter 11 digitos.');
  }

  if (normalized.cep && normalized.cep.replace(/\D/g, '').length !== 8) {
    errors.push('CEP deve conter 8 digitos.');
  }

  if (normalized.addressNumber && normalized.addressNumber.length > 50) {
    errors.push('Numero deve conter no maximo 50 caracteres.');
  }

  if (normalized.estimatedDeliveryAt) {
    const parsedDate = new Date(normalized.estimatedDeliveryAt);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('Data prevista de entrega invalida.');
    } else {
      normalized.estimatedDeliveryAt = parsedDate.toISOString();
    }
  }

  return {
    errors,
    values: normalized,
  };
}

module.exports = {
  normalizeCpf,
  normalizeCep,
  normalizeTrackingCode,
  validateTrackingPayload,
};
