import { run } from '../db/client.js';

export const writeAuditLog = async ({ actorUserId = null, action, resourceType, resourceId = null, details = null }) => {
  await run(
    `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [actorUserId, action, resourceType, resourceId, details ? JSON.stringify(details) : null],
  );
};
