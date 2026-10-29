'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'sandbox.js');
const enquiry = {
  name: 'Alex Example',
  email: 'alex@example.test',
  experience: 'unsure',
  journey: 'europe',
  timing: '3-6',
  budget: '10000-20000',
  message: 'A thoughtful local-only demo enquiry.',
  acknowledgedDemo: true
};

class MemoryStorage {
  constructor(entries) {
    this.values = new Map(entries);
    this.blockRead = false;
    this.blockWrite = false;
  }

  getItem(key) {
    if (this.blockRead) throw new Error('storage blocked');
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.blockWrite) throw new Error('quota exceeded');
    this.values.set(key, String(value));
  }
}

async function loadDemo(storage = new MemoryStorage()) {
  const source = await readFile(sourcePath, 'utf8');
  const sandbox = {
    Response,
    Headers,
    TextEncoder,
    Intl,
    Date,
    JSON,
    Set,
    Map,
    Object,
    Array,
    String,
    Number,
    RegExp,
    Error,
    encodeURIComponent,
    unescape,
    localStorage: storage,
    crypto: { randomUUID }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: sourcePath });
  return { api: sandbox.UltimateDemo, storage };
}

function jsonOptions(body) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) };
}

async function payload(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type'), /^application\/json/i);
  return response.json();
}

test('saves an enquiry locally, returns its standard acknowledgement, and updates its status', async () => {
  const { api } = await loadDemo();
  const created = await payload(await api.request('/api/enquiries', jsonOptions(enquiry)), 201);
  assert.equal(created.ok, true);
  assert.match(created.id, /^[0-9a-f-]{36}$/);
  assert.equal(created.message, 'Demo enquiry saved locally. Nothing has been emailed or booked.');

  const listed = await payload(await api.request('/api/admin/enquiries'), 200);
  assert.equal(listed.enquiries.length, 1);
  assert.equal(listed.enquiries[0].id, created.id);
  assert.equal(listed.enquiries[0].status, 'new');

  const status = await payload(await api.request(`/api/admin/enquiries/${created.id}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'contacted' })
  }), 200);
  assert.equal(status.enquiry.status, 'contacted');
});

test('valid complete offers persist between browser contexts and calculate a valid state', async () => {
  const storage = new MemoryStorage();
  const first = await loadDemo(storage);
  const offers = await payload(await first.api.request('/api/offers'), 200);
  const offer = { ...offers.offers[0], approved: true, startDate: offers.today, endDate: offers.today, terms: 'Valid for this browser demonstration only.' };
  delete offer.state;
  const updated = await payload(await first.api.request(`/api/admin/offers/${offer.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(offer)
  }), 200);
  assert.equal(updated.offer.state, 'active');

  const second = await loadDemo(storage);
  const persisted = await payload(await second.api.request('/api/offers'), 200);
  assert.equal(persisted.offers[0].approved, true);
  assert.equal(persisted.offers[0].terms, offer.terms);
});

test('rejects invalid input, sensitive extra fields, invalid dates, and missing JSON content types', async () => {
  const { api } = await loadDemo();
  const extra = await payload(await api.request('/api/enquiries', jsonOptions({ ...enquiry, cardNumber: '4111111111111111' })), 400);
  assert.equal(extra.error.code, 'INVALID_INPUT');

  const offers = await payload(await api.request('/api/offers'), 200);
  const invalidOffer = { ...offers.offers[0], startDate: '2026-02-30', endDate: '2026-03-01' };
  const invalid = await payload(await api.request(`/api/admin/offers/${invalidOffer.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invalidOffer)
  }), 400);
  assert.equal(invalid.error.code, 'INVALID_INPUT');

  const contentType = await payload(await api.request('/api/enquiries', { method: 'POST', body: JSON.stringify(enquiry) }), 415);
  assert.equal(contentType.error.code, 'CONTENT_TYPE');
});

test('fails closed for corrupt, blocked, quota-limited, and capacity-limited local storage', async () => {
  const corrupted = await loadDemo(new MemoryStorage([['ut-public-demo-v1', '{not-json']]));
  const corruptResult = await payload(await corrupted.api.request('/api/offers'), 500);
  assert.equal(corruptResult.error.code, 'PERSISTENCE_INVALID');

  const blockedStorage = new MemoryStorage();
  blockedStorage.blockRead = true;
  const blocked = await loadDemo(blockedStorage);
  const blockedResult = await payload(await blocked.api.request('/api/offers'), 500);
  assert.equal(blockedResult.error.code, 'PERSISTENCE_UNAVAILABLE');

  const quotaStorage = new MemoryStorage();
  quotaStorage.blockWrite = true;
  const quota = await loadDemo(quotaStorage);
  const quotaResult = await payload(await quota.api.request('/api/enquiries', jsonOptions(enquiry)), 500);
  assert.equal(quotaResult.error.code, 'PERSISTENCE_UNAVAILABLE');

  const bounded = await loadDemo();
  for (let index = 0; index < 50; index += 1) {
    const result = await bounded.api.request('/api/enquiries', jsonOptions({ ...enquiry, email: `alex${index}@example.test` }));
    assert.equal(result.status, 201);
  }
  const full = await payload(await bounded.api.request('/api/enquiries', jsonOptions(enquiry)), 409);
  assert.equal(full.error.code, 'CAPACITY_REACHED');
});

test('isolates separate browser storage areas and reset explicitly restores the embedded seed', async () => {
  const one = await loadDemo();
  const two = await loadDemo();
  await payload(await one.api.request('/api/enquiries', jsonOptions(enquiry)), 201);
  assert.equal((await payload(await one.api.request('/api/admin/enquiries'), 200)).enquiries.length, 1);
  assert.equal((await payload(await two.api.request('/api/admin/enquiries'), 200)).enquiries.length, 0);

  const reset = await payload(await one.api.reset(), 200);
  assert.equal(reset.ok, true);
  const afterReset = await payload(await one.api.request('/api/admin/enquiries'), 200);
  const offers = await payload(await one.api.request('/api/offers'), 200);
  assert.equal(afterReset.enquiries.length, 0);
  assert.equal(offers.offers.length, 3);
  assert.equal(offers.offers.every((offer) => offer.approved === false && offer.state === 'draft'), true);
});
