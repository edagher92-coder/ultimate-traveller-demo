'use strict';

(() => {
  const refreshButton = document.getElementById('refresh-button');
  const content = document.getElementById('desk-content');
  const status = document.getElementById('desk-status');
  const enquiriesContainer = document.getElementById('enquiries');
  const offersContainer = document.getElementById('offers');
  const journeys = { honeymoons: 'Honeymoons', europe: 'Europe', cruises: 'Cruises', africa: 'Africa', break: 'A well-earned break', other: 'Other travel idea' };
  let generation = 0;

  function announce(message) { status.textContent = message; }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  async function api(route, options = {}) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), Accept: 'application/json' };
    let response;
    try { response = await window.UltimateDemo.request(route, { ...options, headers, cache: 'no-store' }); }
    catch { throw new Error('Browser storage is unavailable. Allow site storage and refresh the desk.'); }
    let result;
    try { result = await response.json(); }
    catch { throw new Error('The browser demo returned an unreadable response. Please retry.'); }
    if (!response.ok || result.ok !== true) {
      throw new Error(result.error?.message ?? 'The demo update could not be completed.');
    }
    return result;
  }

  function renderEnquiries(enquiries) {
    enquiriesContainer.replaceChildren();
    if (!enquiries.length) {
      enquiriesContainer.append(element('p', 'No demo enquiries yet. Create one using synthetic details on the public demo.'));
      return;
    }
    for (const enquiry of enquiries) {
      const card = element('article');
      card.append(element('h3', enquiry.name), element('p', `${enquiry.email} · ${journeys[enquiry.journey] ?? enquiry.journey}`));
      const created = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(enquiry.createdAt));
      card.append(element('p', `Saved ${created} (Sydney) · ${enquiry.id}`, 'muted'));
      card.append(element('p', `Experience: ${enquiry.experience} · Timing: ${enquiry.timing} · Budget: ${enquiry.budget}`, 'enquiry-copy'));
      card.append(element('p', enquiry.message || 'No additional message.', 'enquiry-copy'));
      const form = element('form', undefined, 'status-form');
      const select = element('select');
      select.id = `status-${enquiry.id}`;
      const label = element('label', 'Enquiry status'); label.htmlFor = select.id;
      for (const value of ['new', 'contacted', 'closed']) {
        const option = element('option', value[0].toUpperCase() + value.slice(1)); option.value = value; select.append(option);
      }
      select.value = enquiry.status;
      const button = element('button', 'Save status'); button.type = 'submit';
      const feedback = element('p', '', 'status'); feedback.setAttribute('role', 'status');
      form.append(label, select, button, feedback);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        button.disabled = true;
        feedback.textContent = 'Saving browser-only status…';
        try {
          await api(`/api/admin/enquiries/${enquiry.id}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
          feedback.textContent = 'Status saved in this browser. No message was sent.';
        } catch (error) { feedback.textContent = error.message; }
        finally { button.disabled = false; }
      });
      card.append(form);
      enquiriesContainer.append(card);
    }
  }

  function field(form, offer, key, labelText, type, maximum) {
    const wrapper = element('div', undefined, ['title', 'description', 'terms'].includes(key) ? 'full' : '');
    const id = `${offer.id}-${key}`;
    const label = element('label', labelText); label.htmlFor = id;
    const input = element(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
    input.id = id; input.name = key;
    if (input.tagName === 'INPUT') input.type = type;
    if (maximum) input.maxLength = maximum;
    if (type === 'select') {
      const values = key === 'kind' ? { launch: 'Opening promotion', monthly: 'Monthly theme' } : journeys;
      for (const [value, text] of Object.entries(values)) {
        const option = element('option', text); option.value = value; input.append(option);
      }
    }
    input.value = offer[key] ?? '';
    if (key === 'title') input.required = true;
    wrapper.append(label, input); form.append(wrapper);
    return input;
  }

  function renderOffers(offers) {
    offersContainer.replaceChildren();
    for (const offer of offers) {
      const card = element('article');
      const heading = element('h3', offer.title);
      const badge = element('p', `Demo state: ${offer.state}`, 'badge');
      card.append(heading, badge, element('p', `Reference: ${offer.id}`, 'muted'));
      const form = element('form');
      const grid = element('div', undefined, 'grid');
      const inputs = {
        title: field(grid, offer, 'title', 'Title', 'text', 140),
        kind: field(grid, offer, 'kind', 'Promotion type', 'select'),
        journey: field(grid, offer, 'journey', 'Travel theme', 'select'),
        description: field(grid, offer, 'description', 'Description', 'textarea', 600),
        startDate: field(grid, offer, 'startDate', 'Start date (Sydney calendar)', 'date'),
        endDate: field(grid, offer, 'endDate', 'End date (inclusive)', 'date'),
        priceLabel: field(grid, offer, 'priceLabel', 'Price label (no invented prices)', 'text', 100),
        terms: field(grid, offer, 'terms', 'Terms', 'textarea', 800)
      };
      const approvedLabel = element('label', undefined, 'check');
      const approved = element('input'); approved.type = 'checkbox'; approved.checked = offer.approved;
      approvedLabel.append(approved, element('span', 'Approved for this browser demo only. This does not publish or authorise a real offer.'));
      const button = element('button', 'Save demo promotion'); button.type = 'submit';
      const feedback = element('p', '', 'status'); feedback.setAttribute('role', 'status');
      form.append(grid, approvedLabel, button, feedback);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const editable = { id: offer.id, approved: approved.checked };
        for (const [key, input] of Object.entries(inputs)) editable[key] = key.endsWith('Date') ? input.value || null : input.value;
        button.disabled = true;
        feedback.textContent = 'Saving demo promotion…';
        try {
          const result = await api(`/api/admin/offers/${offer.id}`, { method: 'PUT', body: JSON.stringify(editable) });
          heading.textContent = result.offer.title;
          badge.textContent = `Demo state: ${result.offer.state}`;
          feedback.textContent = 'Saved in this browser. Refresh the demo homepage in the same browser to see it. No shared website content was changed.';
        } catch (error) { feedback.textContent = error.message; }
        finally { button.disabled = false; }
      });
      card.append(form); offersContainer.append(card);
    }
  }

  async function loadDesk() {
    const attempt = ++generation;
    refreshButton.disabled = true;
    announce('Loading local demo records…');
    try {
      const [enquiryResult, offerResult] = await Promise.all([api('/api/admin/enquiries'), api('/api/offers')]);
      if (attempt !== generation) return;
      renderEnquiries(enquiryResult.enquiries);
      renderOffers(offerResult.offers);
      document.getElementById('business-date').textContent = `Sydney business date: ${offerResult.today}`;
      content.hidden = false;
      announce('Demo desk is ready. Changes stay only in this browser. Refresh after saving an enquiry in another tab.');
    } catch (error) { if (attempt === generation) announce(error.message); }
    finally { refreshButton.disabled = false; }
  }
  refreshButton.addEventListener('click', loadDesk);
  const resetPanel = document.getElementById('reset-confirmation');
  const resetButton = document.getElementById('reset-demo');
  resetButton.addEventListener('click', () => { resetPanel.hidden = false; document.getElementById('confirm-reset').focus(); });
  document.getElementById('cancel-reset').addEventListener('click', () => { resetPanel.hidden = true; resetButton.focus(); });
  document.getElementById('confirm-reset').addEventListener('click', async () => {
    try {
      const response = await window.UltimateDemo.reset();
      const result = await response.json();
      if (!response.ok || !result.ok) { announce(result.error?.message || 'Demo data could not be reset. Please retry.'); return; }
      resetPanel.hidden = true; await loadDesk(); resetButton.focus();
    } catch { announce('Demo data could not be reset. Allow browser storage and retry.'); }
  });
  void loadDesk();
})();
