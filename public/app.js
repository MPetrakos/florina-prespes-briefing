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
  $('runMeta').innerHTML = `${escapeHtml(data.period_label || '')}<br>${escapeHtml(data.generated_at || '')}`;

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

async function runBriefing() {
  setLoading(true);
  try {
    const response = await fetch('/api/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hours: Number($('hours').value),
        focus: $('focus').value,
        minImportance: $('importance').value
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    renderBriefing(payload);
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
