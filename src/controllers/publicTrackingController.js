const pool = require('../config/db');
const {
  normalizeCpf,
  normalizeTrackingCode,
} = require('../middlewares/validationMiddleware');

async function lookupTracking(req, res) {
  const cpf = normalizeCpf(req.body.cpf);
  const trackingCode = normalizeTrackingCode(req.body.trackingCode);

  if (!cpf || !trackingCode) {
    return res.status(400).json({ message: 'CPF e codigo de rastreio sao obrigatorios.' });
  }

  const trackingResult = await pool.query(
    `
      SELECT *
      FROM trackings
      WHERE cpf = $1 AND tracking_code = $2
      LIMIT 1
    `,
    [cpf, trackingCode]
  );

  if (trackingResult.rowCount === 0) {
    return res.status(404).json({ message: 'Rastreio nao encontrado para os dados informados.' });
  }

  const tracking = trackingResult.rows[0];
  const historyResult = await pool.query(
    `
      SELECT id, status, note, created_at
      FROM tracking_history
      WHERE tracking_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [tracking.id]
  );

  return res.json({
    tracking: {
      id: tracking.id,
      customerName: tracking.customer_name,
      cpf: tracking.cpf,
      trackingCode: tracking.tracking_code,
      originState: tracking.origin_state,
      destinationState: tracking.destination_state,
      street: tracking.street,
      addressNumber: tracking.address_number,
      cep: tracking.cep,
      estimatedDeliveryAt: tracking.estimated_delivery_at,
      currentStatus: tracking.current_status,
      observations: tracking.observations,
      createdAt: tracking.created_at,
      updatedAt: tracking.updated_at,
    },
    history: historyResult.rows.map((row) => ({
      id: row.id,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
    })),
  });
}

module.exports = {
  lookupTracking,
};
