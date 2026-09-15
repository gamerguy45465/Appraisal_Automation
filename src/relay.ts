import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { JobPayload, JobView } from './domain.js';
import type { JobRunner } from './jobs.js';
import { AppError } from './errors.js';
import { COMPANION_TOKEN_PATTERN, relayExchangeInputSchema, serializeJobPayload, type RelayExchangeResponse } from './companion-protocol.js';

const PAIRING_LIFETIME_MS = 10 * 60 * 1000;
const CONNECTION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const CONNECTED_WINDOW_MS = 30 * 1000;
const QUEUE_LIFETIME_MS = 5 * 60 * 1000;
const readyStatuses = new Set(['awaiting_review', 'user_submitted', 'browser_closed', 'failed']);

interface Connection {
  readonly owner: string;
  pairingHash?: Buffer;
  pairingExpiresAt: number;
  bearerHash?: Buffer;
  expiresAt: number;
  lastSeen?: number;
  sequence: number;
  currentJobId?: string;
  lastAcceptedJobId?: string;
  browserOpen: boolean;
  acceptsJobs: boolean;
}
interface RelayJob {
  readonly connection: Connection;
  readonly createdAt: number;
  view: JobView;
  payload?: JobPayload;
  delivered: boolean;
  accepted: boolean;
  declined: boolean;
}
export interface RelayJobRunner extends JobRunner {
  getActive(owner: string): JobView | undefined;
  pair(owner: string): { token: string; expiresAt: number };
  connect(pairingToken: string): { token: string };
  exchange(bearer: string, input: unknown): RelayExchangeResponse;
  state(owner: string): { connected: boolean; paired: boolean };
}

const hash = (value: string): Buffer => createHash('sha256').update(value).digest();
function matches(token: string, expected?: Buffer): boolean {
  return typeof token === 'string' && COMPANION_TOKEN_PATTERN.test(token) && Boolean(expected && timingSafeEqual(hash(token), expected));
}
function wipePayload(job: RelayJob): void {
  job.payload?.urla.buffer.fill(0);
  job.payload?.salesContract?.buffer.fill(0);
  if (job.payload) job.payload.input.apiKey = '';
  job.payload = undefined;
}
function wipeConnection(connection?: Connection): void {
  connection?.pairingHash?.fill(0);
  connection?.bearerHash?.fill(0);
}

/** One Windows companion owns one visible R3 browser; Azure never starts a worker. */
export function createRelayJobRunner(): RelayJobRunner {
  const jobs = new Map<string, RelayJob>();
  let connection: Connection | undefined;
  let stopped = false;

  const current = (): RelayJob | undefined => connection?.currentJobId ? jobs.get(connection.currentJobId) : undefined;
  const locked = (): boolean => Boolean(connection?.browserOpen || current() && !current()!.view.canStartAnother);
  const connected = (): boolean => Boolean(connection?.acceptsJobs && connection.bearerHash && connection.expiresAt > Date.now()
    && connection.lastSeen !== undefined && Date.now() - connection.lastSeen <= CONNECTED_WINDOW_MS);
  const ensureRunning = (): void => {
    if (stopped) throw new AppError('COMPANION_UNAVAILABLE', 'The companion relay is shutting down.', 503);
  };
  const cleanup = (): void => {
    const now = Date.now();
    if (connection?.pairingHash && connection.pairingExpiresAt <= now) {
      connection.pairingHash.fill(0); connection.pairingHash = undefined;
    }
    for (const [id, job] of jobs) {
      if (job.payload && now - job.createdAt >= QUEUE_LIFETIME_MS) {
        wipePayload(job);
        job.view = {
          id, status: 'failed', canStartAnother: !job.delivered,
          message: job.delivered
            ? 'The companion did not confirm receipt. Check its window before restarting the Azure session; this order will not be sent to another companion.'
            : 'The companion did not receive the documents in time. Reconnect it and upload the documents again.',
        };
      }
      if (id !== connection?.currentJobId && now - job.createdAt >= CONNECTION_LIFETIME_MS) {
        wipePayload(job); jobs.delete(id);
      }
    }
  };
  const timer = setInterval(cleanup, 15 * 1000);
  timer.unref();

  return {
    pair(owner) {
      ensureRunning(); cleanup();
      if (locked()) throw new AppError('COMPANION_BUSY', 'Finish the current preparation and close its R3 browser before pairing another companion.', 409);
      wipeConnection(connection);
      const token = randomBytes(32).toString('base64url');
      const expiresAt = Date.now() + PAIRING_LIFETIME_MS;
      connection = { owner, pairingHash: hash(token), pairingExpiresAt: expiresAt, expiresAt: 0, sequence: -1, browserOpen: false, acceptsJobs: true };
      return { token, expiresAt };
    },
    connect(pairingToken) {
      ensureRunning(); cleanup();
      if (!connection || connection.pairingExpiresAt <= Date.now() || !matches(pairingToken, connection.pairingHash)) {
        throw new AppError('COMPANION_AUTH_REQUIRED', 'The pairing code is invalid or expired. Generate a new code in Appraisal Desk.', 401);
      }
      connection.pairingHash!.fill(0); connection.pairingHash = undefined;
      const token = randomBytes(32).toString('base64url');
      connection.bearerHash = hash(token);
      connection.expiresAt = Date.now() + CONNECTION_LIFETIME_MS;
      connection.lastSeen = Date.now();
      return { token };
    },
    state(owner) {
      cleanup();
      return {
        connected: connection?.owner === owner && connected(),
        paired: connection?.owner === owner && Boolean(connection.pairingHash || connection.bearerHash && connection.expiresAt > Date.now()),
      };
    },
    create(owner, payload) {
      ensureRunning(); cleanup();
      if (!connection || connection.owner !== owner || !connected()) {
        throw new AppError('COMPANION_REQUIRED', 'Connect your Windows companion in this session before preparing an appraisal.', 409);
      }
      const predecessor = current();
      if (predecessor && !predecessor.view.canStartAnother) {
        throw new AppError('JOB_ACTIVE', 'Wait until preparation and cleanup finish before starting another appraisal.', 409);
      }
      // Only one pending payload exists. Preserve the previous browser until local validation succeeds.
      while (jobs.size >= 100) {
        const id = [...jobs.keys()].find(key => key !== connection?.currentJobId && key !== connection?.lastAcceptedJobId);
        if (!id) throw new AppError('JOB_LIMIT', 'Restart the Azure session after finishing the current order.', 503);
        wipePayload(jobs.get(id)!); jobs.delete(id);
      }
      const id = randomUUID();
      const view: JobView = { id, status: 'queued', message: 'Your documents are queued for the Windows companion.', canStartAnother: false };
      jobs.set(id, { connection, createdAt: Date.now(), view, payload, delivered: false, accepted: false, declined: false });
      connection.currentJobId = id;
      return view;
    },
    exchange(bearer, input) {
      ensureRunning(); cleanup();
      if (!connection || connection.expiresAt <= Date.now() || !matches(bearer, connection.bearerHash)) {
        throw new AppError('COMPANION_AUTH_REQUIRED', 'The companion connection expired. Finish any open R3 order before pairing again.', 401);
      }
      const parsed = relayExchangeInputSchema.safeParse(input);
      if (!parsed.success) throw new AppError('COMPANION_REQUEST_INVALID', 'The companion sent an invalid status update.', 400);
      const request = parsed.data;
      const job = current();
      if (request.sequence > connection.sequence) {
        const ids = [request.acceptedJobId, request.declinedJobId, request.update?.id].filter((id): id is string => Boolean(id));
        if (ids.some(id => jobs.get(id)?.connection !== connection)) throw new AppError('COMPANION_JOB_REJECTED', 'This preparation does not belong to the companion.', 409);
        const acceptsCurrent = Boolean(job && request.acceptedJobId === job.view.id);
        const declinesCurrent = Boolean(job && request.declinedJobId === job.view.id);
        if (acceptsCurrent && (!job!.delivered || job!.declined)) throw new AppError('COMPANION_JOB_REJECTED', 'This preparation is not available for acceptance.', 409);
        if (declinesCurrent && (!request.stopping || !job!.delivered || job!.accepted || acceptsCurrent)) {
          throw new AppError('COMPANION_JOB_REJECTED', 'Only a received preparation that never started may be declined.', 409);
        }
        if (job && request.update?.id === job.view.id) {
          const update = request.update;
          if (!(job.accepted || acceptsCurrent) || update.canStartAnother && !readyStatuses.has(update.status) || update.status === 'browser_closed' && update.browserOpen) {
            throw new AppError('COMPANION_REQUEST_INVALID', 'The companion sent an invalid preparation state.', 400);
          }
          job.view = { id: update.id, status: update.status, message: update.message, warnings: update.warnings, canStartAnother: update.canStartAnother };
          connection.browserOpen = update.browserOpen;
        }
        // An undelivered successor cannot yet own a local browser. Its predecessor may
        // close while waiting; update only that ownership, never the successor's view.
        if (job && (!job.delivered || job.declined || declinesCurrent) && request.update?.id === connection.lastAcceptedJobId) {
          const update = request.update;
          if (update && update.canStartAnother && readyStatuses.has(update.status) && !update.browserOpen) connection.browserOpen = false;
        }
        if (acceptsCurrent) { job!.accepted = true; connection.lastAcceptedJobId = job!.view.id; wipePayload(job!); }
        if (declinesCurrent) {
          job!.declined = true;
          wipePayload(job!);
          job!.view = { id: job!.view.id, status: 'failed', message: 'The Windows companion confirmed that it stopped before starting this order. Pair it again and upload the documents when ready.', canStartAnother: true };
        }
        if (request.stopping) {
          connection.acceptsJobs = false;
          // Work never offered to this PC can be cancelled safely during shutdown.
          // A previously offered job remains locked until its outcome is acknowledged.
          if (job?.payload && !job.delivered) {
            wipePayload(job);
            job.view = { id: job.view.id, status: 'failed', message: 'The Windows companion stopped before receiving the documents. Pair it again and upload the documents when ready.', canStartAnother: true };
          }
        }
        connection.sequence = request.sequence;
      }
      connection.lastSeen = Date.now();
      if (job?.payload && !job.accepted && connection.acceptsJobs) {
        job.delivered = true;
        return { job: { id: job.view.id, payload: serializeJobPayload(job.payload) } };
      }
      return {};
    },
    get(owner, id) { cleanup(); const job = jobs.get(id); return job?.connection.owner === owner ? job.view : undefined; },
    getActive(owner) {
      cleanup();
      const job = current();
      return connection?.owner === owner && job && (connection.browserOpen || !job.view.canStartAnother) ? job.view : undefined;
    },
    shutdown() {
      stopped = true;
      clearInterval(timer);
      for (const job of jobs.values()) wipePayload(job);
      jobs.clear(); wipeConnection(connection); connection = undefined;
      // The remote process owns the visible browser. Relay shutdown must not close it.
    },
  };
}
