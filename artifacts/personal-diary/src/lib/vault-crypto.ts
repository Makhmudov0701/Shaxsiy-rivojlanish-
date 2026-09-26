export const VAULT_KDF_ITERATIONS = 600_000;
const LEGACY_KDF_ITERATIONS = 150_000;
const LEGACY_VERIFIER = 'shaxsiy-kundalik-sandiq-tekshiruvi';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const vaultCategories = [
  'password',
  'bank-pin',
  'wifi-key',
  'secret-note',
  'api-recovery',
] as const;

export type VaultCategory = (typeof vaultCategories)[number];
export type VaultCredentialType = 'pin' | 'password';

export type VaultEntry = {
  id: string;
  category: VaultCategory;
  title: string;
  username: string;
  secret: string;
  url: string;
  notes: string;
  reminderDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VaultEnvelope = {
  version: 2;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  credentialType: VaultCredentialType;
  salt: string;
  iv: string;
  ciphertext: string;
};

type EncryptedValue = { iv: string; ciphertext: string };
type LegacyNote = EncryptedValue & {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};
type LegacyVault = {
  salt: string;
  verifier: EncryptedValue;
  notes: LegacyNote[];
};

export type StoredVault = VaultEnvelope | LegacyVault;

export type UnlockedVault = {
  key: CryptoKey;
  envelope: VaultEnvelope;
  entries: VaultEntry[];
  migrated: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('vault-crypto-unavailable');
  }
  return globalThis.crypto;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return globalThis.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isEncryptedValue(value: unknown): value is EncryptedValue {
  if (!isObject(value) || typeof value.iv !== 'string' || typeof value.ciphertext !== 'string') return false;
  try {
    return base64ToBytes(value.iv).length === 12 && base64ToBytes(value.ciphertext).length > 0;
  } catch {
    return false;
  }
}

function isVaultCategory(value: unknown): value is VaultCategory {
  return typeof value === 'string' && vaultCategories.includes(value as VaultCategory);
}

export function isVaultEntry(value: unknown): value is VaultEntry {
  if (!isObject(value)) return false;
  const reminderDateIsValid = value.reminderDate === null
    || (typeof value.reminderDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.reminderDate));
  return typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 128
    && isVaultCategory(value.category)
    && typeof value.title === 'string'
    && value.title.length <= 200
    && typeof value.username === 'string'
    && value.username.length <= 500
    && typeof value.secret === 'string'
    && value.secret.length <= 10_000
    && typeof value.url === 'string'
    && value.url.length <= 2_000
    && typeof value.notes === 'string'
    && value.notes.length <= 20_000
    && reminderDateIsValid
    && typeof value.createdAt === 'string'
    && Number.isFinite(Date.parse(value.createdAt))
    && typeof value.updatedAt === 'string'
    && Number.isFinite(Date.parse(value.updatedAt));
}

function isVaultEntryList(value: unknown): value is VaultEntry[] {
  return Array.isArray(value) && value.every(isVaultEntry);
}

function isLegacyNote(value: unknown): value is LegacyNote {
  return isObject(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
    && isEncryptedValue(value);
}

function isLegacyVault(value: Record<string, unknown>): value is unknown as LegacyVault {
  return typeof value.salt === 'string'
    && (() => {
      try {
        return base64ToBytes(value.salt).length === 16;
      } catch {
        return false;
      }
    })()
    && isEncryptedValue(value.verifier)
    && Array.isArray(value.notes)
    && value.notes.every(isLegacyNote);
}

export function parseStoredVault(raw: string | null): StoredVault | null {
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (!isObject(parsed)) throw new Error('vault-storage-invalid');

  if (parsed.version === 2) {
    if (
      parsed.kdf !== 'PBKDF2-SHA-256'
      || !Number.isInteger(parsed.iterations)
      || Number(parsed.iterations) < 600_000
      || Number(parsed.iterations) > 1_000_000
      || (parsed.credentialType !== 'pin' && parsed.credentialType !== 'password')
      || typeof parsed.salt !== 'string'
      || typeof parsed.iv !== 'string'
      || typeof parsed.ciphertext !== 'string'
    ) {
      throw new Error('vault-storage-invalid');
    }
    try {
      if (base64ToBytes(parsed.salt).length !== 16 || base64ToBytes(parsed.iv).length !== 12 || base64ToBytes(parsed.ciphertext).length < 16) {
        throw new Error('vault-storage-invalid');
      }
    } catch {
      throw new Error('vault-storage-invalid');
    }
    return parsed as unknown as VaultEnvelope;
  }

  if (parsed.version === undefined && isLegacyVault(parsed)) return parsed;
  throw new Error('vault-storage-invalid');
}

async function deriveVaultKey(credential: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const cryptoApi = getCrypto();
  const material = await cryptoApi.subtle.importKey('raw', textEncoder.encode(credential), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptText(key: CryptoKey, value: string): Promise<EncryptedValue> {
  const cryptoApi = getCrypto();
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const ciphertext = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(value));
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

async function decryptText(key: CryptoKey, value: EncryptedValue): Promise<string> {
  const plaintext = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(value.iv) },
    key,
    base64ToBytes(value.ciphertext),
  );
  return textDecoder.decode(plaintext);
}

async function encryptEntries(key: CryptoKey, envelope: VaultEnvelope, entries: VaultEntry[]): Promise<VaultEnvelope> {
  if (!isVaultEntryList(entries)) throw new Error('vault-entries-invalid');
  const encrypted = await encryptText(key, JSON.stringify(entries));
  return { ...envelope, ...encrypted };
}

export function isValidVaultCredential(value: string, type: VaultCredentialType): boolean {
  if (type === 'pin') return /^\d{4}$/.test(value);
  return value.trim().length >= 12 && value.length <= 128;
}

export async function createVault(
  credential: string,
  credentialType: VaultCredentialType,
): Promise<{ key: CryptoKey; envelope: VaultEnvelope }> {
  if (!isValidVaultCredential(credential, credentialType)) throw new Error('vault-credential-invalid');
  const cryptoApi = getCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const key = await deriveVaultKey(credential, salt, VAULT_KDF_ITERATIONS);
  const metadata: VaultEnvelope = {
    version: 2,
    kdf: 'PBKDF2-SHA-256',
    iterations: VAULT_KDF_ITERATIONS,
    credentialType,
    salt: bytesToBase64(salt),
    iv: '',
    ciphertext: '',
  };
  return { key, envelope: await encryptEntries(key, metadata, []) };
}

export async function saveVaultEntries(
  key: CryptoKey,
  envelope: VaultEnvelope,
  entries: VaultEntry[],
): Promise<VaultEnvelope> {
  return encryptEntries(key, envelope, entries);
}

export async function changeVaultCredential(
  credential: string,
  credentialType: VaultCredentialType,
  entries: VaultEntry[],
): Promise<{ key: CryptoKey; envelope: VaultEnvelope }> {
  return createVault(credential, credentialType).then(async ({ key, envelope }) => ({
    key,
    envelope: await encryptEntries(key, envelope, entries),
  }));
}

export async function unlockVault(credential: string, stored: StoredVault): Promise<UnlockedVault> {
  if ('version' in stored && stored.version === 2) {
    const key = await deriveVaultKey(credential, base64ToBytes(stored.salt), stored.iterations);
    try {
      const plaintext = await decryptText(key, stored);
      const parsed: unknown = JSON.parse(plaintext);
      if (!isVaultEntryList(parsed)) throw new Error('vault-entries-invalid');
      return { key, envelope: stored, entries: parsed, migrated: false };
    } catch {
      throw new Error('vault-unlock-failed');
    }
  }

  const oldKey = await deriveVaultKey(credential, base64ToBytes(stored.salt), LEGACY_KDF_ITERATIONS);
  try {
    const verifier = await decryptText(oldKey, stored.verifier);
    if (verifier !== LEGACY_VERIFIER) throw new Error('vault-unlock-failed');
    const entries: VaultEntry[] = [];
    for (const note of stored.notes) {
      const notes = await decryptText(oldKey, note);
      entries.push({
        id: note.id,
        category: 'secret-note',
        title: note.title,
        username: '',
        secret: '',
        url: '',
        notes,
        reminderDate: null,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      });
    }
    const credentialType: VaultCredentialType = /^\d{4}$/.test(credential) ? 'pin' : 'password';
    const migrated = await changeVaultCredential(credential, credentialType, entries);
    return { ...migrated, entries, migrated: true };
  } catch {
    throw new Error('vault-unlock-failed');
  }
}

export function generateStrongPassword(length = 24): string {
  const cryptoApi = getCrypto();
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%^&*()-_=+[]{}:,.?',
  ];
  const all = groups.join('');
  const targetLength = Math.max(groups.length, Math.min(128, Math.round(length)));
  const values: string[] = [];

  const randomIndex = (limit: number) => {
    const ceiling = 256 - (256 % limit);
    let byte = 0;
    do {
      byte = cryptoApi.getRandomValues(new Uint8Array(1))[0];
    } while (byte >= ceiling);
    return byte % limit;
  };

  for (const group of groups) values.push(group[randomIndex(group.length)]);
  while (values.length < targetLength) values.push(all[randomIndex(all.length)]);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values.join('');
}