const pool = require('../config/db');
const { validateTrackingPayload } = require('../middlewares/validationMiddleware');

function mapTrackingRow(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    cpf: row.cpf,
    trackingCode: row.tracking_code,
    originState: row.origin_state,
    destinationState: row.destination_state,
    street: row.street,
    addressNumber: row.address_number,
    cep: row.cep,
    estimatedDeliveryAt: row.estimated_delivery_at,
    currentStatus: row.current_status,
    observations: row.observations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listTrackings(req, res) {
  const result = await pool.query(`
    SELECT *
    FROM trackings
    ORDER BY created_at DESC
  `);

  return res.json(result.rows.map(mapTrackingRow));
}

async function getTracking(req, res) {
  const { id } = req.params;
  const trackingResult = await pool.query('SELECT * FROM trackings WHERE id = $1', [id]);

  if (trackingResult.rowCount === 0) {
    return res.status(404).json({ message: 'Rastreio nao encontrado.' });
  }

  const historyResult = await pool.query(
    `
      SELECT id, tracking_id, status, note, created_at
      FROM tracking_history
      WHERE tracking_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [id]
  );

  return res.json({
    tracking: mapTrackingRow(trackingResult.rows[0]),
    history: historyResult.rows.map((row) => ({
      id: row.id,
      trackingId: row.tracking_id,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
    })),
  });
}

async function createTracking(req, res) {
  const { errors, values } = validateTrackingPayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados invalidos.', errors });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertResult = await client.query(
      `
        INSERT INTO trackings (
          customer_name,
          cpf,
          tracking_code,
          origin_state,
          destination_state,
          street,
          address_number,
          cep,
          estimated_delivery_at,
          current_status,
          observations
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        values.customerName,
        values.cpf,
        values.trackingCode,
        values.originState,
        values.destinationState,
        values.street,
        values.addressNumber,
        values.cep,
        values.estimatedDeliveryAt,
        values.currentStatus,
        values.observations,
      ]
    );

    const tracking = insertResult.rows[0];

    await client.query(
      'INSERT INTO tracking_history (tracking_id, status, note) VALUES ($1, $2, $3)',
      [tracking.id, tracking.current_status, values.observations || 'Rastreio criado no sistema.']
    );

    await client.query('COMMIT');
    return res.status(201).json(mapTrackingRow(tracking));
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Codigo de rastreio ja cadastrado.' });
    }

    throw error;
  } finally {
    client.release();
  }
}

async function updateTracking(req, res) {
  const { id } = req.params;
  const { errors, values } = validateTrackingPayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Dados invalidos.', errors });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM trackings WHERE id = $1', [id]);
    if (currentResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Rastreio nao encontrado.' });
    }

    const currentTracking = currentResult.rows[0];

    const updateResult = await client.query(
      `
        UPDATE trackings
        SET
          customer_name = $1,
          cpf = $2,
          tracking_code = $3,
          origin_state = $4,
          destination_state = $5,
          street = $6,
          address_number = $7,
          cep = $8,
          estimated_delivery_at = $9,
          current_status = $10,
          observations = $11
        WHERE id = $12
        RETURNING *
      `,
      [
        values.customerName,
        values.cpf,
        values.trackingCode,
        values.originState,
        values.destinationState,
        values.street,
        values.addressNumber,
        values.cep,
        values.estimatedDeliveryAt,
        values.currentStatus,
        values.observations,
        id,
      ]
    );

    const updatedTracking = updateResult.rows[0];

    if (
      currentTracking.current_status !== updatedTracking.current_status ||
      currentTracking.observations !== updatedTracking.observations
    ) {
      await client.query(
        'INSERT INTO tracking_history (tracking_id, status, note) VALUES ($1, $2, $3)',
        [
          id,
          updatedTracking.current_status,
          values.observations || 'Dados do rastreio atualizados pelo admin.',
        ]
      );
    }

    await client.query('COMMIT');
    return res.json(mapTrackingRow(updatedTracking));
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Codigo de rastreio ja cadastrado.' });
    }

    throw error;
  } finally {
    client.release();
  }
}

async function deleteTracking(req, res) {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM trackings WHERE id = $1 RETURNING id', [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Rastreio nao encontrado.' });
  }

  return res.status(204).send();
}

async function updateTrackingStatus(req, res) {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status || !String(status).trim()) {
    return res.status(400).json({ message: 'Status e obrigatorio.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `
        UPDATE trackings
        SET current_status = $1
        WHERE id = $2
        RETURNING *
      `,
      [String(status).trim(), id]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Rastreio nao encontrado.' });
    }

    await client.query(
      'INSERT INTO tracking_history (tracking_id, status, note) VALUES ($1, $2, $3)',
      [id, String(status).trim(), String(note || '').trim() || 'Status atualizado pelo admin.']
    );

    await client.query('COMMIT');
    return res.json(mapTrackingRow(updateResult.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listTrackings,
  getTracking,
  createTracking,
  updateTracking,
  deleteTracking,
  updateTrackingStatus,
};
