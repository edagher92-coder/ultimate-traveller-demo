/* Public, browser-only demonstration data adapter. No network or provider calls. */
(function installUltimateDemo(global) {
  'use strict';

  const STORAGE_KEY = 'ut-public-demo-v1';
  const MAX_ENQUIRIES = 50;
  const JOURNEYS = ['honeymoons', 'europe', 'cruises', 'africa', 'break', 'other'];
  const STATUSES = ['new', 'contacted', 'closed'];
  const OFFER_KEYS = ['id', 'kind', 'title', 'description', 'approved', 'startDate', 'endDate', 'priceLabel', 'terms', 'journey'];
  const ENQUIRY_KEYS = ['name', 'email', 'experience', 'journey', 'timing', 'budget', 'message', 'acknowledgedDemo'];
  const SEED = Object.freeze({
    version: 1,
    offers: [
      { id: 'opening-conversation', kind: 'launch', title: 'A first conversation about your travel idea', description: 'Draft opening promotion: an introductory planning conversation. Any no-fee invitation is subject to Susie\'s agreement before publication.', approved: false, startDate: null, endDate: null, priceLabel: 'Wording awaiting approval', terms: '', journey: 'other' },
      { id: 'honeymoon-monthly', kind: 'monthly', title: 'A honeymoon with room for both of you', description: 'A monthly inspiration draft for a thoughtful honeymoon conversation. No supplier offer, availability or price has been confirmed.', approved: false, startDate: null, endDate: null, priceLabel: 'Planning theme only', terms: '', journey: 'honeymoons' },
      { id: 'europe-cruise-monthly', kind: 'monthly', title: 'Europe, with a little time on the water', description: 'A monthly inspiration draft to explore European journeys and cruise ideas with Susie. Routes, suppliers, dates and prices remain to be agreed.', approved: false, startDate: null, endDate: null, priceLabel: 'Planning theme only', terms: '', journey: 'europe' }
    ],
    enquiries: []
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function exactKeys(value, keys, optional) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      && Object.keys(value).every((key) => keys.includes(key))
      && keys.every((key) => optional.includes(key) || Object.hasOwn(value, key));
  }

  function string(value, maximum, required) {
    return typeof value === 'string' && value.length <= maximum
      && (!required || value.trim().length > 0) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= monthDays[month - 1];
  }

  function validateOffer(value) {
    return exactKeys(value, OFFER_KEYS, [])
      && string(value.id, 60, true) && /^[a-z0-9-]+$/.test(value.id)
      && ['launch', 'monthly'].includes(value.kind)
      && string(value.title, 140, true) && string(value.description, 600, false)
      && typeof value.approved === 'boolean'
      && (value.startDate === null || validDate(value.startDate))
      && (value.endDate === null || validDate(value.endDate))
      && !(value.startDate && value.endDate && value.startDate > value.endDate)
      && string(value.priceLabel, 100, false) && string(value.terms, 800, false)
      && JOURNEYS.includes(value.journey);
  }

  function validateEnquiry(value) {
    return exactKeys(value, ENQUIRY_KEYS, ['message'])
      && string(value.name, 80, true) && string(value.email, 254, true)
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)
      && ['first-trip', 'experienced', 'unsure'].includes(value.experience)
      && JOURNEYS.includes(value.journey)
      && ['flexible', '0-3', '3-6', '6-12', '12-plus'].includes(value.timing)
      && ['unsure', 'under-5000', '5000-10000', '10000-20000', '20000-plus'].includes(value.budget)
      && (!Object.hasOwn(value, 'message') || string(value.message, 400, false))
      && value.acknowledgedDemo === true;
  }

  function validUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
  }

  function validateRecord(value) {
    if (!exactKeys(value, [...ENQUIRY_KEYS, 'id', 'createdAt', 'status'], [])) return false;
    const { id, createdAt, status, ...input } = value;
    return validateEnquiry(input) && validUuid(id)
      && typeof createdAt === 'string' && Number.isFinite(Date.parse(createdAt))
      && new Date(createdAt).toISOString() === createdAt && STATUSES.includes(status);
  }

  function validateData(value) {
    return exactKeys(value, ['version', 'offers', 'enquiries'], []) && value.version === 1
      && Array.isArray(value.offers) && value.offers.length <= 100 && value.offers.every(validateOffer)
      && new Set(value.offers.map((offer) => offer.id)).size === value.offers.length
      && Array.isArray(value.enquiries) && value.enquiries.length <= MAX_ENQUIRIES && value.enquiries.every(validateRecord)
      && new Set(value.enquiries.map((enquiry) => enquiry.id)).size === value.enquiries.length;
  }

  function sydneyToday(now) {
    const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now || new Date());
    const part = (type) => parts.find((item) => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  function offerState(offer, today) {
    if (!validateOffer(offer) || !validDate(today)) return 'invalid';
    if (!offer.approved || !offer.startDate || !offer.endDate || !offer.terms.trim()) return 'draft';
    if (today < offer.startDate) return 'scheduled';
    if (today > offer.endDate) return 'expired';
    return 'active';
  }

  function response(status, body) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  function fail(status, code, message) {
    return response(status, { ok: false, error: { code, message } });
  }

  function storageError(error) {
    if (error && error.kind === 'invalid') {
      return fail(500, 'PERSISTENCE_INVALID', 'The browser demo data is invalid. Reset it explicitly to continue.');
    }
    return fail(500, 'PERSISTENCE_UNAVAILABLE', 'Browser storage is unavailable. No demo data was changed.');
  }

  function readStore() {
    let serialized;
    try {
      serialized = global.localStorage.getItem(STORAGE_KEY);
    } catch {
      throw { kind: 'unavailable' };
    }
    if (serialized === null) return clone(SEED);
    let value;
    try {
      value = JSON.parse(serialized);
    } catch {
      throw { kind: 'invalid' };
    }
    if (!validateData(value)) throw { kind: 'invalid' };
    return value;
  }

  function writeStore(value) {
    if (!validateData(value)) throw { kind: 'invalid' };
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      throw { kind: 'unavailable' };
    }
  }

  function contentType(options) {
    const headers = options && options.headers;
    if (!headers) return '';
    if (typeof Headers !== 'undefined' && headers instanceof Headers) return headers.get('content-type') || '';
    if (Array.isArray(headers)) {
      const header = headers.find((entry) => Array.isArray(entry) && String(entry[0]).toLowerCase() === 'content-type');
      return header ? String(header[1]) : '';
    }
    if (typeof headers === 'object') {
      const key = Object.keys(headers).find((item) => item.toLowerCase() === 'content-type');
      return key ? String(headers[key]) : '';
    }
    return '';
  }

  function encodedLength(value) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
    return unescape(encodeURIComponent(value)).length;
  }

  function parseBody(options) {
    const body = options && Object.hasOwn(options, 'body') ? options.body : undefined;
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType(options))) {
      return { error: fail(415, 'CONTENT_TYPE', 'Use a JSON request body.') };
    }
    if (typeof body !== 'string') return { error: fail(400, 'INVALID_JSON', 'Use a valid JSON request body.') };
    if (encodedLength(body) > 8192) return { error: fail(413, 'PAYLOAD_TOO_LARGE', 'The request is too large.') };
    try {
      return { value: JSON.parse(body) };
    } catch {
      return { error: fail(400, 'INVALID_JSON', 'Use a valid JSON request body.') };
    }
  }

  function newId() {
    try {
      const id = global.crypto.randomUUID();
      return validUuid(id) ? id : null;
    } catch {
      return null;
    }
  }

  async function request(route, options = {}) {
    const requestOptions = options !== null && typeof options === 'object' ? options : {};
    const method = typeof requestOptions.method === 'string' ? requestOptions.method.toUpperCase() : 'GET';
    if (typeof route !== 'string' || !route.startsWith('/')) return fail(404, 'NOT_FOUND', 'This local demo page or endpoint was not found.');
    const path = route.split('?')[0];

    try {
      if (method === 'GET' && path === '/api/offers') {
        const data = readStore();
        const today = sydneyToday();
        return response(200, { ok: true, today, offers: data.offers.map((offer) => ({ ...offer, state: offerState(offer, today) })) });
      }
      if (method === 'POST' && path === '/api/enquiries') {
        const parsed = parseBody(requestOptions);
        if (parsed.error) return parsed.error;
        if (!validateEnquiry(parsed.value)) return fail(400, 'INVALID_INPUT', 'Check the demo enquiry fields and acknowledgement.');
        const data = readStore();
        if (data.enquiries.length >= MAX_ENQUIRIES) return fail(409, 'CAPACITY_REACHED', 'The browser demo enquiry limit has been reached. Reset it explicitly to continue.');
        const id = newId();
        if (!id) return fail(500, 'ID_GENERATION_FAILED', 'The browser could not create a demo enquiry identifier.');
        data.enquiries.unshift({ ...parsed.value, message: parsed.value.message || '', id, createdAt: new Date().toISOString(), status: 'new' });
        writeStore(data);
        return response(201, { ok: true, id, message: 'Demo enquiry saved locally. Nothing has been emailed or booked.' });
      }
      if (method === 'GET' && path === '/api/admin/enquiries') {
        return response(200, { ok: true, enquiries: readStore().enquiries });
      }
      const enquiryMatch = /^\/api\/admin\/enquiries\/([0-9a-f-]{36})$/.exec(path);
      if (method === 'PATCH' && enquiryMatch) {
        const parsed = parseBody(requestOptions);
        if (parsed.error) return parsed.error;
        if (!parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value) || Object.keys(parsed.value).length !== 1 || !STATUSES.includes(parsed.value.status)) {
          return fail(400, 'INVALID_INPUT', 'Choose a valid enquiry status.');
        }
        const data = readStore();
        const enquiry = data.enquiries.find((item) => item.id === enquiryMatch[1]);
        if (!enquiry) return fail(404, 'NOT_FOUND', 'This demo enquiry was not found.');
        enquiry.status = parsed.value.status;
        writeStore(data);
        return response(200, { ok: true, enquiry });
      }
      const offerMatch = /^\/api\/admin\/offers\/([a-z0-9-]{1,60})$/.exec(path);
      if (method === 'PUT' && offerMatch) {
        const parsed = parseBody(requestOptions);
        if (parsed.error) return parsed.error;
        if (!validateOffer(parsed.value) || parsed.value.id !== offerMatch[1]) return fail(400, 'INVALID_INPUT', 'Check the complete offer, dates and terms.');
        const data = readStore();
        const index = data.offers.findIndex((item) => item.id === parsed.value.id);
        if (index < 0) return fail(404, 'NOT_FOUND', 'This demo offer was not found.');
        data.offers[index] = parsed.value;
        writeStore(data);
        return response(200, { ok: true, offer: { ...parsed.value, state: offerState(parsed.value, sydneyToday()) } });
      }
      return fail(404, 'NOT_FOUND', 'This local demo page or endpoint was not found.');
    } catch (error) {
      if (error && (error.kind === 'invalid' || error.kind === 'unavailable')) return storageError(error);
      return fail(500, 'SERVER_ERROR', 'The local demo could not complete this request. Please try again.');
    }
  }

  async function reset() {
    try {
      writeStore(clone(SEED));
      return response(200, { ok: true, message: 'Browser demo data was reset locally.' });
    } catch (error) {
      if (error && (error.kind === 'invalid' || error.kind === 'unavailable')) return storageError(error);
      return fail(500, 'SERVER_ERROR', 'The local demo could not complete this request. Please try again.');
    }
  }

  global.UltimateDemo = Object.freeze({ request, reset });
}(typeof window !== 'undefined' ? window : globalThis));
