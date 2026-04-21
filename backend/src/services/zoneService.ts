import db, { RowDataPacket, ResultSetHeader } from "../config/database";

interface ZoneRow extends RowDataPacket {
  id: number;
  name: string;
  display_name: string | null;
  coordinates: string | null;
  status: number;
  is_default: number;
  minimum_service_charge: number | null;
  per_km_service_charge: number | null;
  maximum_service_charge: number | null;
  increased_service_fee: number;
  increased_service_fee_status: number;
  increase_service_charge_message: string | null;
  created_at: Date;
  updated_at: Date;
  hostels_count?: number;
}

export interface ZoneData {
  id?: number;
  name: string;
  displayName?: string | null;
  coordinates?: string | null;
  status?: boolean;
  isDefault?: boolean;
  minimumServiceCharge?: number | null;
  perKmServiceCharge?: number | null;
  maximumServiceCharge?: number | null;
  increasedServiceFee?: number;
  increasedServiceFeeStatus?: boolean;
  increaseServiceChargeMessage?: string | null;
}

// Get all zones with optional search
export const getAllZones = async (search?: string) => {
  let query = `
    SELECT z.*,
      (SELECT COUNT(*) FROM users u WHERE u.role = 'OWNER' AND u.zone_id = z.id) AS hostels_count
    FROM zones z
  `;
  const params: any[] = [];

  if (search) {
    query += ` WHERE z.name LIKE ?`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY z.id DESC`;

  const [rows] = await db.execute<ZoneRow[]>(query, params);
  return rows;
};

// Get single zone by ID
export const getZoneById = async (id: number) => {
  const [rows] = await db.execute<ZoneRow[]>(
    `SELECT z.*,
      (SELECT COUNT(*) FROM users u WHERE u.role = 'OWNER' AND u.zone_id = z.id) AS hostels_count
    FROM zones z WHERE z.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Create zone
export const createZone = async (data: ZoneData) => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO zones (name, display_name, coordinates, status, is_default,
      minimum_service_charge, per_km_service_charge, maximum_service_charge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.displayName || null,
      data.coordinates || null,
      data.status !== false ? 1 : 0,
      data.isDefault ? 1 : 0,
      data.minimumServiceCharge ?? null,
      data.perKmServiceCharge ?? null,
      data.maximumServiceCharge ?? null,
    ]
  );
  return getZoneById(result.insertId);
};

// Update zone
export const updateZone = async (id: number, data: Partial<ZoneData>) => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.displayName !== undefined) { fields.push("display_name = ?"); values.push(data.displayName || null); }
  if (data.coordinates !== undefined) { fields.push("coordinates = ?"); values.push(data.coordinates); }
  if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status ? 1 : 0); }
  if (data.isDefault !== undefined) { fields.push("is_default = ?"); values.push(data.isDefault ? 1 : 0); }
  if (data.minimumServiceCharge !== undefined) { fields.push("minimum_service_charge = ?"); values.push(data.minimumServiceCharge); }
  if (data.perKmServiceCharge !== undefined) { fields.push("per_km_service_charge = ?"); values.push(data.perKmServiceCharge); }
  if (data.maximumServiceCharge !== undefined) { fields.push("maximum_service_charge = ?"); values.push(data.maximumServiceCharge); }
  if (data.increasedServiceFee !== undefined) { fields.push("increased_service_fee = ?"); values.push(data.increasedServiceFee); }
  if (data.increasedServiceFeeStatus !== undefined) { fields.push("increased_service_fee_status = ?"); values.push(data.increasedServiceFeeStatus ? 1 : 0); }
  if (data.increaseServiceChargeMessage !== undefined) { fields.push("increase_service_charge_message = ?"); values.push(data.increaseServiceChargeMessage || null); }

  if (fields.length === 0) return getZoneById(id);

  values.push(id);
  await db.execute(
    `UPDATE zones SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  return getZoneById(id);
};

// Delete zone
export const deleteZone = async (id: number) => {
  await db.execute("DELETE FROM zones WHERE id = ?", [id]);
  return true;
};

// Toggle zone status
export const toggleZoneStatus = async (id: number, status: boolean) => {
  await db.execute("UPDATE zones SET status = ? WHERE id = ?", [status ? 1 : 0, id]);
  return getZoneById(id);
};

// Set default zone
export const setDefaultZone = async (id: number) => {
  // Remove default from all zones
  await db.execute("UPDATE zones SET is_default = 0");
  // Set this zone as default and active
  await db.execute("UPDATE zones SET is_default = 1, status = 1 WHERE id = ?", [id]);
  return getZoneById(id);
};

// Update zone settings (service charges)
export const updateZoneSettings = async (id: number, data: {
  minimumServiceCharge?: number | null;
  perKmServiceCharge?: number | null;
  maximumServiceCharge?: number | null;
  increasedServiceFee?: number;
  increasedServiceFeeStatus?: boolean;
  increaseServiceChargeMessage?: string | null;
}) => {
  await db.execute(
    `UPDATE zones SET
      minimum_service_charge = ?,
      per_km_service_charge = ?,
      maximum_service_charge = ?,
      increased_service_fee = ?,
      increased_service_fee_status = ?,
      increase_service_charge_message = ?
    WHERE id = ?`,
    [
      data.minimumServiceCharge ?? null,
      data.perKmServiceCharge ?? null,
      data.maximumServiceCharge ?? null,
      data.increasedServiceFee ?? 0,
      data.increasedServiceFeeStatus ? 1 : 0,
      data.increaseServiceChargeMessage || null,
      id,
    ]
  );
  return getZoneById(id);
};

// Get all zone coordinates (for map overlay)
export const getAllZoneCoordinates = async (excludeId?: number) => {
  let query = "SELECT id, name, coordinates FROM zones WHERE status = 1";
  const params: any[] = [];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  const [rows] = await db.execute<ZoneRow[]>(query, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    coordinates: r.coordinates ? JSON.parse(r.coordinates) : [],
  }));
};
