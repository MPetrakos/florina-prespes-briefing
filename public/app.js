const $ = (id) => document.getElementById(id);

const runBtn = $('runBtn');
const clearBtn = $('clearBtn');
const emptyState = $('emptyState');
const loadingState = $('loadingState');
const errorState = $('errorState');
const results = $('results');
const statusPill = $('statusPill');

const importanceLabel = {
  high: 'Υψηλή σημασία',
  medium: 'Μέση σημασία',
  low: 'Χαμηλή σημασία'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch {
    return '#';
  }
}

function showOnly(which) {
  [emptyState, loadingState, errorState, results].forEach(el => el.classList.add('hidden'));
  which.classList.remove('hidden');
}

function setLoading(isLoading) {
  runBtn.disabled = isLoading;
  if (isLoading) {
    statusPill.textContent = 'Αναζήτηση…';
    showOnly(loadingState);
    const messages = [
      'Σαρώνω τα τοπικά ΜΜΕ και τις θεσμικές πηγές…',
      'Εντοπίζω νέες δημοσιεύσεις και πρωτογενείς ανακοινώσεις…',
      'Αφαιρώ αναδημοσιεύσεις και παρόμοια θέματα…',
      'Αξιολογώ τι έχει πρακτική σημασία για τις Πρέσπες…'
    ];
    let i = 0;
    $('loadingText').textContent = messages[0];
    window.__loadingTimer = setInterval(() => {
      i = (i + 1) % messages.length;
      $('loadingText').textContent = messages[i];
    }, 2200);
  } else {
    clearInterval(window.__loadingTimer);
  }
}

function renderBriefing(data) {
  $('resultTitle').textContent = data.title || 'Σημαντικότερα θέματα';
  $('runMeta').innerHTML = `${escapeHtml(data.period_label || '')}<br>${escapeHtml(data.source_categories_label ? `Πηγές: ${data.source_categories_label}` : '')}${data.source_categories_label ? '<br>' : ''}${escapeHtml(data.generated_at || '')}`;

  $('executiveSummary').innerHTML = `
    <h3>Σύνοψη</h3>
    <p>${escapeHtml(data.executive_summary || 'Δεν προέκυψε συνοπτικό συμπέρασμα.')}</p>
  `;

  const stories = Array.isArray(data.stories) ? data.stories : [];
  $('storyCount').textContent = `${stories.length} ${stories.length === 1 ? 'θέμα' : 'θέματα'}`;
  $('stories').innerHTML = stories.length ? stories.map(story => {
    const level = ['high','medium','low'].includes(story.importance) ? story.importance : 'low';
    const links = Array.isArray(story.sources) ? story.sources : [];
    const linksHtml = links.map(src => {
      const href = safeUrl(src.url);
      if (href === '#') return '';
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.name || 'Πηγή')} ↗</a>`;
    }).join('');

    return `
      <article class="story-card">
        <div class="story-accent ${level}"></div>
        <div class="story-body">
          <div class="story-meta">
            <span class="badge ${level}">${importanceLabel[level]}</span>
            <span class="badge category-badge">${escapeHtml(story.category || 'Γενικά')}</span>
            ${story.date ? `<span class="story-date">${escapeHtml(story.date)}</span>` : ''}
          </div>
          <h3 class="story-title">${escapeHtml(story.title || '')}</h3>
          <p class="story-summary">${escapeHtml(story.summary || '')}</p>
          ${story.why_it_matters ? `<p class="why"><strong>Γιατί μας ενδιαφέρει:</strong> ${escapeHtml(story.why_it_matters)}</p>` : ''}
          <div class="story-links">${linksHtml}</div>
        </div>
      </article>`;
  }).join('') : '<div class="summary-card"><p>Δεν βρέθηκαν θέματα που να περνούν τα επιλεγμένα φίλτρα.</p></div>';

  const watch = Array.isArray(data.watch_next) ? data.watch_next : [];
  $('watchList').innerHTML = watch.length
    ? watch.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>Δεν προέκυψε συγκεκριμένο θέμα προς παρακολούθηση.</li>';

  const allSources = new Map();
  stories.forEach(story => (story.sources || []).forEach(src => {
    const href = safeUrl(src.url);
    if (href !== '#') allSources.set(href, src.name || new URL(href).hostname);
  }));
  (data.additional_sources || []).forEach(src => {
    const href = safeUrl(src.url);
    if (href !== '#') allSources.set(href, src.name || new URL(href).hostname);
  });

  $('sourcesList').innerHTML = allSources.size
    ? [...allSources.entries()].map(([url, name]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)} ↗</a>`).join('')
    : '<span>Δεν επιστράφηκαν σύνδεσμοι πηγών.</span>';

  statusPill.textContent = 'Ολοκληρώθηκε';
  showOnly(results);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function postBriefing(payload) {
  const response = await fetch('/api/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function selectedSourceCategories() {
  return [...document.querySelectorAll('.source-category:checked')].map(input => input.value);
}

function updateSourceSelectionHint() {
  const total = document.querySelectorAll('.source-category').length;
  const selected = selectedSourceCategories().length;
  const hint = $('sourceSelectionHint');
  hint.textContent = `Επιλεγμένες: ${selected} από ${total} κατηγορίες`;
  hint.classList.toggle('warning', selected === 0);
  runBtn.disabled = selected === 0 || statusPill.textContent.includes('Αναζήτηση') || statusPill.textContent.includes('εξέλιξη') || statusPill.textContent.includes('αναμονή') || statusPill.textContent.includes('σύνθεση');
}

class RateLimitError extends Error {
  constructor(message, retryAfter = 15) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = Number.isFinite(Number(retryAfter)) ? Number(retryAfter) : 15;
  }
}

async function waitForRateLimit(seconds) {
  const total = Math.max(5, Math.min(90, Math.ceil(seconds)));
  for (let remaining = total; remaining > 0; remaining--) {
    statusPill.textContent = `Όριο API · ${remaining}s`;
    $('loadingText').textContent = `Το OpenAI API έφτασε προσωρινά το όριο tokens/minute. Αυτόματη επανάληψη σε ${remaining} δευτ.…`;
    await sleep(1000);
  }
}

async function startAndPollBriefing({ hours, focus, minImportance, sourceCategories }) {
  let { response, data } = await postBriefing({
    action: 'start',
    hours,
    focus,
    minImportance,
    sourceCategories
  });

  if (response.status === 429 && data.code === 'rate_limit') {
    throw new RateLimitError(data.error || 'Προσωρινό όριο OpenAI API.', data.retry_after);
  }
  if (!response.ok && response.status !== 202) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  if (!data.responseId) throw new Error('Δεν επιστράφηκε response ID από τον server.');

  const responseId = data.responseId;
  statusPill.textContent = 'Έρευνα σε εξέλιξη…';
  $('loadingText').textContent = 'Η έρευνα ξεκίνησε. Ελέγχω την πρόοδο χωρίς να διακόπτω το briefing…';

  for (let attempt = 0; attempt < 180; attempt++) {
    await sleep(3000);
    ({ response, data } = await postBriefing({
      action: 'status',
      responseId,
      hours,
      minImportance,
      sourceCategories
    }));

    if (response.status === 202) {
      const state = data.status === 'queued' ? 'Σε αναμονή…' : 'Αναζήτηση & σύνθεση…';
      statusPill.textContent = state;
      continue;
    }

    if (response.status === 429 && data.code === 'rate_limit') {
      throw new RateLimitError(data.error || 'Προσωρινό όριο OpenAI API.', data.retry_after);
    }

    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  throw new Error('Το briefing συνεχίζει να επεξεργάζεται για υπερβολικά μεγάλο διάστημα. Δοκίμασε ξανά αργότερα.');
}

async function runBriefing() {
  setLoading(true);
  const hours = Number($('hours').value);
  const focus = $('focus').value;
  const minImportance = $('importance').value;
  const sourceCategories = selectedSourceCategories();

  if (!sourceCategories.length) {
    $('errorText').textContent = 'Επίλεξε τουλάχιστον μία κατηγορία πηγών.';
    statusPill.textContent = 'Χρειάζεται επιλογή';
    showOnly(errorState);
    setLoading(false);
    updateSourceSelectionHint();
    return;
  }

  try {
    const params = { hours, focus, minImportance, sourceCategories };

    // Up to two automatic retries. A rate-limit failure is temporary and the
    // API tells us approximately how long to wait before submitting again.
    for (let retry = 0; retry <= 2; retry++) {
      try {
        const data = await startAndPollBriefing(params);
        renderBriefing(data);
        return;
      } catch (error) {
        if (error instanceof RateLimitError && retry < 2) {
          const extraBackoff = retry * 5;
          await waitForRateLimit(error.retryAfter + extraBackoff);
          statusPill.textContent = 'Επανάληψη έρευνας…';
          $('loadingText').textContent = 'Το όριο αποδεσμεύτηκε. Ξεκινώ ξανά το briefing αυτόματα…';
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    $('errorText').textContent = error.message || 'Άγνωστο σφάλμα.';
    statusPill.textContent = 'Σφάλμα';
    showOnly(errorState);
  } finally {
    setLoading(false);
  }
}

function clearResults() {
  $('stories').innerHTML = '';
  $('watchList').innerHTML = '';
  $('sourcesList').innerHTML = '';
  statusPill.textContent = 'Έτοιμο';
  showOnly(emptyState);
}

runBtn.addEventListener('click', runBriefing);
clearBtn.addEventListener('click', clearResults);
$('selectAllSources').addEventListener('click', () => {
  document.querySelectorAll('.source-category').forEach(input => { input.checked = true; });
  updateSourceSelectionHint();
});
$('clearAllSources').addEventListener('click', () => {
  document.querySelectorAll('.source-category').forEach(input => { input.checked = false; });
  updateSourceSelectionHint();
});
document.querySelectorAll('.source-category').forEach(input => input.addEventListener('change', updateSourceSelectionHint));
updateSourceSelectionHint();
