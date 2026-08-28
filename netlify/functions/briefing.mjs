const OPENAI_URL = 'https://api.openai.com/v1/responses';

const SOURCE_CATEGORIES = {
  local_media: {
    label: 'Τοπικά ΜΜΕ',
    guide: `- Νέα Φλώρινα — neaflorina.gr
- ΕΡΤ Φλώρινας — ertnews.gr/news/perifereiakoi-stathmoi/florina
- Ελεύθερο Βήμα / FlorinaPress — florinapress.gr
- Ράδιο Λέχοβο — radio-lehovo.gr
- Floriniotika — floriniotika.gr
- Περισκόπιο Αμυνταίου — eperiskopio.blogspot.com`
  },
  regional_media: {
    label: 'Περιφερειακά ΜΜΕ',
    guide: `- Kozan.gr — kozan.gr
- KozaniMedia — kozanimedia.gr
- EordaiaLive — eordaialive.com
- Άλλα αξιόπιστα περιφερειακά ΜΜΕ Δυτικής Μακεδονίας μόνο όταν είναι άμεσα συναφή με την Π.Ε. Φλώρινας.`
  },
  institutions: {
    label: 'Αυτοδιοίκηση & θεσμικές',
    guide: `- Δήμος Πρεσπών — prespes.gr
- Δήμος Φλώρινας — cityoflorina.gr
- Δήμος Αμυνταίου — amyntaio.gr
- ΠΕ Φλώρινας — florina.pdm.gov.gr
- Περιφέρεια Δυτικής Μακεδονίας — pdm.gov.gr
- Διαύγεια — diavgeia.gov.gr / et.diavgeia.gov.gr`
  },
  prespes_environment: {
    label: 'Πρέσπες & περιβάλλον',
    guide: `- ΟΦΥΠΕΚΑ — necca.gov.gr
- Εταιρία Προστασίας Πρεσπών και οι επίσημες ψηφιακές της πηγές
- Άλλες αξιόπιστες πρωτογενείς πηγές για Εθνικό Πάρκο, νερά, Natura 2000, βιοποικιλότητα, δάση και διασυνοριακή λεκάνη Πρεσπών.`
  },
  economy_funding: {
    label: 'Οικονομία, έργα & χρηματοδοτήσεις',
    guide: `- Πρόγραμμα Δίκαιης Αναπτυξιακής Μετάβασης — dam.gov.gr και επίσημες διαχειριστικές σελίδες
- Επιμελητήριο Φλώρινας — ebef.gr
- ΑΝΦΛΩ / Αναπτυξιακή Φλώρινας και επίσημες σχετικές ανακοινώσεις
- Επίσημες πηγές ΕΣΠΑ, Interreg, ΠΔΕ και άλλων προγραμμάτων όταν η πράξη αφορά Φλώρινα ή Πρέσπες.`
  },
  safety: {
    label: 'Πολιτική προστασία & ασφάλεια',
    guide: `- Ελληνική Αστυνομία — astynomia.gr
- Πυροσβεστικό Σώμα — fireservice.gr
- Επίσημες πηγές πολιτικής προστασίας της Περιφέρειας / ΠΕ Φλώρινας όταν είναι σχετικές με συμβάντα, απαγορεύσεις, κινδύνους ή έκτακτες ανάγκες.`
  },
  culture_education: {
    label: 'Πολιτισμός & εκπαίδευση',
    guide: `- Υπουργείο Πολιτισμού / Εφορεία Αρχαιοτήτων Φλώρινας — culture.gov.gr
- Πανεπιστήμιο Δυτικής Μακεδονίας — uowm.gr και επίσημες μονάδες / τμήματα στη Φλώρινα
- Συναφείς επίσημες πηγές πολιτισμού, αρχαιολογίας και εκπαίδευσης όταν αφορούν την Π.Ε. Φλώρινας ή τις Πρέσπες.`
  }
};

function sourceGuideFor(keys) {
  return keys.map(key => {
    const item = SOURCE_CATEGORIES[key];
    return `### ${item.label}\n${item.guide}`;
  }).join('\n\n');
}

function sourceCategoryLabel(keys) {
  return keys.map(key => SOURCE_CATEGORIES[key]?.label).filter(Boolean).join(' · ');
}


const focusInstructions = {
  all: 'Κάλυψε όλα τα ουσιώδη θέματα, αλλά δώσε μεγαλύτερο βάρος σε όσα επηρεάζουν άμεσα ή έμμεσα τον Δήμο Πρεσπών.',
  prespes: 'Κράτησε μόνο θέματα που αφορούν άμεσα τις Πρέσπες ή έχουν σαφή πρακτική συνέπεια για τον Δήμο Πρεσπών.',
  funding: 'Εστίασε σε χρηματοδοτήσεις, προσκλήσεις, έργα, προγράμματα, συμβάσεις, ΕΣΠΑ, Interreg, ΔΑΜ, ΠΔΕ και αποφάσεις χρηματοδότησης.',
  environment: 'Εστίασε σε περιβάλλον, λίμνες, νερά, Natura 2000, ΟΦΥΠΕΚΑ, βιοποικιλότητα, δάση, προστασία οικοσυστημάτων και κλιματική ανθεκτικότητα.',
  energy: 'Εστίασε σε ΔΑΜ, ενέργεια, ΔΕΗ, τηλεθέρμανση, απολιγνιτοποίηση, επενδύσεις και επιπτώσεις στην Π.Ε. Φλώρινας.',
  crossborder: 'Εστίασε σε σύνορα, διασυνοριακές σχέσεις, συνοριακούς σταθμούς, Αλβανία, Βόρεια Μακεδονία, Resen, Pustec, Devoll και διασυνοριακά προγράμματα.',
  civil: 'Εστίασε σε πολιτική προστασία, πυρκαγιές, πλημμύρες, χιονοπτώσεις, οδικό δίκτυο, υποδομές, ασφάλεια και έκτακτες ανάγκες.',
  agri: 'Εστίασε σε αγροτικά, κτηνοτροφία, φασόλια Πρεσπών, αρδεύσεις, αναδασμούς, αποζημιώσεις, ΚΑΠ και πρωτογενή τομέα.',
  tourism: 'Εστίασε σε τουρισμό, πολιτισμό, εκδηλώσεις, αρχαιολογία, μνημεία, διαδρομές, φυσιολατρικό τουρισμό και τοπική προβολή.'
};

const importanceRank = { low: 1, medium: 2, high: 3 };

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function dateTimeInAthens(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

function shiftHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text) return data.output_text;
  for (const item of data.output || []) {
    if (item.type !== 'message') continue;
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    period_label: { type: 'string' },
    generated_at: { type: 'string' },
    executive_summary: { type: 'string' },
    stories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          why_it_matters: { type: 'string' },
          category: { type: 'string' },
          importance: { type: 'string', enum: ['high', 'medium', 'low'] },
          date: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                url: { type: 'string' }
              },
              required: ['name', 'url']
            }
          }
        },
        required: ['title', 'summary', 'why_it_matters', 'category', 'importance', 'date', 'sources']
      }
    },
    watch_next: { type: 'array', items: { type: 'string' } },
    additional_sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { name: { type: 'string' }, url: { type: 'string' } },
        required: ['name', 'url']
      }
    }
  },
  required: ['title', 'period_label', 'generated_at', 'executive_summary', 'stories', 'watch_next', 'additional_sources']
};

function validateResponseId(value) {
  return typeof value === 'string' && /^resp_[A-Za-z0-9_-]+$/.test(value);
}

function periodLabelFor(hours) {
  return ({
    12: 'Τελευταίες 12 ώρες',
    24: 'Τελευταίες 24 ώρες',
    72: 'Τελευταίες 3 ημέρες',
    168: 'Τελευταίες 7 ημέρες',
    720: 'Τελευταίες 30 ημέρες'
  })[hours] || 'Τελευταίες 24 ώρες';
}

function parseRetryAfterSeconds(message = '', headerValue = '') {
  const headerSeconds = Number(headerValue);
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) return Math.ceil(headerSeconds);

  const match = String(message).match(/try again in\s+([0-9.]+)s/i);
  if (match) return Math.ceil(Number(match[1]));
  return 15;
}

function isRateLimitPayload(raw) {
  const code = raw?.error?.code || raw?.code || '';
  const type = raw?.error?.type || raw?.type || '';
  const message = raw?.error?.message || raw?.message || '';
  return code === 'rate_limit_exceeded' || type === 'rate_limit_error' || /rate limit reached|too many requests/i.test(message);
}

function rateLimitResponse(raw, retryHeader = '') {
  const message = raw?.error?.message || raw?.message || 'Προσωρινό όριο ρυθμού OpenAI API.';
  return jsonResponse(429, {
    code: 'rate_limit',
    retry_after: Math.min(90, Math.max(5, parseRetryAfterSeconds(message, retryHeader) + 2)),
    error: message
  });
}

async function retrieveResponse(apiKey, responseId) {
  return fetch(`${OPENAI_URL}/${encodeURIComponent(responseId)}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
}

export default async (request) => {
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: 'Λείπει το OPENAI_API_KEY. Πρόσθεσέ το στο Netlify → Project configuration → Environment variables και ξανακάνε deploy.'
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Μη έγκυρο αίτημα.' });
  }

  const allowedHours = [12, 24, 72, 168, 720];
  const hours = allowedHours.includes(Number(body.hours)) ? Number(body.hours) : 24;
  const minImportance = importanceRank[body.minImportance] ? body.minImportance : 'medium';
  const requestedSourceCategories = Array.isArray(body.sourceCategories) ? body.sourceCategories : [];
  const sourceCategories = [...new Set(requestedSourceCategories)].filter(key => SOURCE_CATEGORIES[key]);
  if (!sourceCategories.length) {
    return jsonResponse(400, { error: 'Επίλεξε τουλάχιστον μία έγκυρη κατηγορία πηγών.' });
  }

  // POLL: retrieve an OpenAI background response. This call is quick and therefore
  // stays well below Netlify's 60-second synchronous function limit.
  if (body.action === 'status') {
    if (!validateResponseId(body.responseId)) {
      return jsonResponse(400, { error: 'Μη έγκυρο response ID.' });
    }

    let upstream;
    try {
      upstream = await retrieveResponse(apiKey, body.responseId);
    } catch (error) {
      return jsonResponse(502, { error: `Αποτυχία ελέγχου κατάστασης OpenAI: ${error.message}` });
    }

    const raw = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      if (upstream.status === 429 || isRateLimitPayload(raw)) {
        return rateLimitResponse(raw, upstream.headers.get('retry-after') || '');
      }
      return jsonResponse(upstream.status, {
        error: raw?.error?.message || `OpenAI API error (${upstream.status}).`
      });
    }

    if (['queued', 'in_progress'].includes(raw?.status)) {
      return jsonResponse(202, { status: raw.status });
    }

    if (raw?.status !== 'completed') {
      if (isRateLimitPayload(raw)) {
        return rateLimitResponse(raw);
      }
      const detail = raw?.error?.message || raw?.incomplete_details?.reason || raw?.status || 'unknown';
      if (raw?.incomplete_details?.reason === 'max_output_tokens') {
        return jsonResponse(409, {
          code: 'output_limit',
          error: 'Το μοντέλο έφτασε στο όριο εξόδου πριν ολοκληρώσει το briefing.'
        });
      }
      return jsonResponse(502, { error: `Το briefing δεν ολοκληρώθηκε (${detail}).` });
    }

    const text = extractOutputText(raw);
    if (!text) return jsonResponse(502, { error: 'Το μοντέλο ολοκλήρωσε την εργασία αλλά δεν επέστρεψε briefing.' });

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      return jsonResponse(502, { error: 'Το briefing επέστρεψε σε μη αναμενόμενη μορφή.' });
    }

    const minRank = importanceRank[minImportance];
    result.stories = (result.stories || []).filter(s => importanceRank[s.importance] >= minRank);
    result.generated_at = `Δημιουργήθηκε ${dateTimeInAthens(new Date())} (ώρα Ελλάδας)`;
    result.period_label = periodLabelFor(hours);
    result.source_categories_label = sourceCategoryLabel(sourceCategories);

    return jsonResponse(200, result);
  }

  // START: launch the slower web-research job in OpenAI background mode and
  // return its ID immediately. The browser will poll the status above.
  const focus = focusInstructions[body.focus] ? body.focus : 'all';
  const now = new Date();
  const endDateTime = dateTimeInAthens(now);
  const startDateTime = dateTimeInAthens(shiftHours(now, -hours));
  const periodLabel = periodLabelFor(hours);
  const compact = body.compact === true;
  const outputRules = compact
    ? `ΕΠΙΠΛΕΟΝ ΚΑΝΟΝΑΣ ΣΥΝΤΟΜΗΣ ΕΞΟΔΟΥ: Επέστρεψε έως 4 θέματα. Κάθε summary και why_it_matters να είναι το πολύ 1 σύντομη πρόταση. Έως 2 πηγές ανά θέμα. Το executive_summary να είναι έως 2 προτάσεις και το watch_next έως 3 σημεία.`
    : `ΕΠΙΠΛΕΟΝ ΚΑΝΟΝΑΣ ΕΞΟΔΟΥ: Επέστρεψε έως 6 θέματα. Κάθε summary να είναι 1-2 σύντομες προτάσεις, το why_it_matters 1 σύντομη πρόταση και έως 3 πηγές ανά θέμα.`;

  const prompt = `
Ετοίμασε ένα αυστηρά τεκμηριωμένο briefing για την Περιφερειακή Ενότητα Φλώρινας με ιδιαίτερη έμφαση στον Δήμο Πρεσπών.

ΧΡΟΝΙΚΟ ΠΑΡΑΘΥΡΟ
Από ${startDateTime} έως ${endDateTime}, ώρα Ελλάδας (Europe/Athens). Πρόκειται για κυλιόμενο παράθυρο ακριβώς ${hours} ωρών. ΜΗΝ συμπεριλάβεις δημοσίευση ή νέο γεγονός εκτός αυτού του χρονικού παραθύρου μόνο επειδή εμφανίζεται ψηλά στα αποτελέσματα αναζήτησης. Αν ένα πρόσφατο άρθρο αναφέρεται αποκλειστικά σε παλιό γεγονός χωρίς νέα εξέλιξη μέσα στο παράθυρο, απόρριψέ το.

ΕΣΤΙΑΣΗ
${focusInstructions[focus]}

ΕΠΙΛΕΓΜΕΝΕΣ ΚΑΤΗΓΟΡΙΕΣ ΠΗΓΩΝ
${sourceGuideFor(sourceCategories)}

ΚΑΝΟΝΕΣ ΕΡΓΑΣΙΑΣ
1. Χρησιμοποίησε web search και περιόρισε την έρευνα και τις τελικές παραπομπές στις παραπάνω επιλεγμένες κατηγορίες πηγών. Μην χρησιμοποιήσεις πηγή από μη επιλεγμένη κατηγορία μόνο επειδή εμφανίζεται ψηλά στην αναζήτηση. Έλεγξε αρκετές από τις επιλεγμένες πηγές, όχι μόνο μία ή δύο. Προτεραιότητα στην ποιότητα και τη συνάφεια αντί για εξαντλητικό crawling.
2. Προτίμησε πρωτογενείς θεσμικές πηγές όταν υπάρχει επίσημη ανακοίνωση. Τοπικό δημοσίευμα μπορεί να χρησιμοποιείται ως συμπληρωματική πηγή.
3. Κάνε deduplication: το ίδιο δελτίο Τύπου ή η ίδια είδηση που αναδημοσιεύεται σε πολλά sites να εμφανίζεται ως ΕΝΑ θέμα με πολλαπλές πηγές.
4. Απόρριψε πανελλαδικές ειδήσεις που δεν έχουν ειδική σύνδεση με Φλώρινα, Αμύνταιο ή Πρέσπες.
5. Απόρριψε κοινωνικές αγγελίες, κηδείες, γενικές αθλητικές ανακοινώσεις και χαμηλής αξίας εκδηλώσεις, εκτός αν έχουν σαφή δημόσια/στρατηγική σημασία.
6. Για κάθε θέμα δώσε importance = high / medium / low ως προς τη χρησιμότητά του για έναν Δήμο όπως ο Δήμος Πρεσπών. High = άμεση ενέργεια/ευκαιρία/κίνδυνος/απόφαση ή σημαντική πολιτική εξέλιξη. Medium = χρήσιμη ενημέρωση με πιθανή επίπτωση. Low = περιφερειακό context χωρίς άμεση δράση.
7. Η επιλογή χρήστη απαιτεί ελάχιστη σημασία "${minImportance}". Μην επιστρέψεις θέματα χαμηλότερα από αυτό το επίπεδο.
8. Κράτησε μόνο τα πραγματικά σημαντικά θέματα. Αν υπάρχουν λιγότερα, επέστρεψε λιγότερα. Μην γεμίζεις τεχνητά το briefing.
9. Κάθε πηγή πρέπει να έχει πραγματικό URL που βρήκες στην αναζήτηση. Μην κατασκευάζεις URLs.
10. Γράψε πυκνά και σύντομα. Το "why_it_matters" να εξηγεί πρακτικά γιατί αξίζει προσοχή από τον Δήμο Πρεσπών.
11. Οι κατηγορίες να είναι σύντομες, π.χ. Πρέσπες, Χρηματοδοτήσεις, Περιβάλλον, ΔΑΜ/Ενέργεια, Αγροτικά, Πολιτική Προστασία, Διασυνοριακά, Τουρισμός/Πολιτισμός, Αυτοδιοίκηση, Υγεία/Κοινωνία.
12. Στο watch_next βάλε μόνο ουσιαστικές εξελίξεις που αξίζει να παρακολουθούνται τις επόμενες ημέρες, μόνο αν προκύπτουν από το υλικό.
13. Γράψε στα ελληνικά, καθαρά και χωρίς υπερβολές.

${outputRules}
`;

  const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

  let upstream;
  try {
    upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        background: true,
        store: true,
        instructions: 'Είσαι αναλυτής τοπικής και περιφερειακής επικαιρότητας. Ερευνάς σχολαστικά, αποφεύγεις διπλοεγγραφές και δεν επινοείς πηγές ή γεγονότα.',
        input: prompt,
        tools: [{
          type: 'web_search',
          user_location: {
            type: 'approximate',
            country: 'GR',
            city: 'Florina',
            region: 'Western Macedonia',
            timezone: 'Europe/Athens'
          }
        }],
        tool_choice: 'auto',
        max_tool_calls: 7,
        max_output_tokens: 7000,
        text: {
          format: {
            type: 'json_schema',
            name: 'florina_prespes_briefing',
            strict: true,
            schema: responseSchema
          },
          verbosity: 'low'
        },
        reasoning: { effort: 'none' }
      })
    });
  } catch (error) {
    return jsonResponse(502, { error: `Αποτυχία σύνδεσης με OpenAI: ${error.message}` });
  }

  const raw = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return jsonResponse(upstream.status, {
      error: raw?.error?.message || `OpenAI API error (${upstream.status}).`
    });
  }

  if (!raw?.id) return jsonResponse(502, { error: 'Η OpenAI δεν επέστρεψε response ID.' });

  return jsonResponse(202, {
    status: raw.status || 'queued',
    responseId: raw.id,
    period_label: periodLabel
  });
};
