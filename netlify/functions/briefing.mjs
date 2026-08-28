const OPENAI_URL = 'https://api.openai.com/v1/responses';

const SOURCE_GUIDE = `
ΠΡΩΤΕΥΟΥΣΕΣ ΠΗΓΕΣ / ΤΟΠΙΚΑ ΜΜΕ
- Νέα Φλώρινα — neaflorina.gr
- ΕΡΤ Φλώρινας — ertnews.gr/news/perifereiakoi-stathmoi/florina
- Ελεύθερο Βήμα / FlorinaPress — florinapress.gr
- Ράδιο Λέχοβο — radio-lehovo.gr
- Floriniotika — floriniotika.gr
- Περισκόπιο Αμυνταίου — eperiskopio.blogspot.com

ΘΕΣΜΙΚΕΣ / ΠΡΩΤΟΓΕΝΕΙΣ
- Δήμος Πρεσπών — prespes.gr
- Δήμος Φλώρινας — cityoflorina.gr
- Δήμος Αμυνταίου — amyntaio.gr
- ΠΕ Φλώρινας — florina.pdm.gov.gr
- Περιφέρεια Δυτικής Μακεδονίας — pdm.gov.gr
- ΟΦΥΠΕΚΑ — necca.gov.gr
- Επιμελητήριο Φλώρινας — ebef.gr
- Υπουργείο Πολιτισμού / Εφορεία Αρχαιοτήτων Φλώρινας — culture.gov.gr
- Ελληνική Αστυνομία — astynomia.gr
- Πυροσβεστικό Σώμα — fireservice.gr
- Πρόγραμμα Δίκαιης Αναπτυξιακής Μετάβασης — dam.gov.gr και σχετικές επίσημες κυβερνητικές/διαχειριστικές σελίδες
- Διαύγεια — diavgeia.gov.gr / et.diavgeia.gov.gr όταν υπάρχουν σχετικές πράξεις

ΠΕΡΙΦΕΡΕΙΑΚΑ / ΣΥΜΠΛΗΡΩΜΑΤΙΚΑ
- Kozan.gr — kozan.gr
- KozaniMedia — kozanimedia.gr
- EordaiaLive — eordaialive.com

ΕΙΔΙΚΑ ΓΙΑ ΠΡΕΣΠΕΣ
- Εταιρία Προστασίας Πρεσπών και λοιπές αξιόπιστες πρωτογενείς πηγές για το Εθνικό Πάρκο, τα νερά, Natura, βιοποικιλότητα και διασυνοριακή λεκάνη.
`;

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

export default async (request) => {
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: 'Λείπει το OPENAI_API_KEY. Πρόσθεσέ το στο Netlify → Site configuration → Environment variables και ξανακάνε deploy.'
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
  const focus = focusInstructions[body.focus] ? body.focus : 'all';
  const minImportance = importanceRank[body.minImportance] ? body.minImportance : 'medium';
  const now = new Date();
  const endDateTime = dateTimeInAthens(now);
  const startDateTime = dateTimeInAthens(shiftHours(now, -hours));
  const windowLabels = {
    12: 'Τελευταίες 12 ώρες',
    24: 'Τελευταίες 24 ώρες',
    72: 'Τελευταίες 3 ημέρες',
    168: 'Τελευταίες 7 ημέρες',
    720: 'Τελευταίες 30 ημέρες'
  };
  const periodLabel = windowLabels[hours];

  const prompt = `
Ετοίμασε ένα αυστηρά τεκμηριωμένο briefing για την Περιφερειακή Ενότητα Φλώρινας με ιδιαίτερη έμφαση στον Δήμο Πρεσπών.

ΧΡΟΝΙΚΟ ΠΑΡΑΘΥΡΟ
Από ${startDateTime} έως ${endDateTime}, ώρα Ελλάδας (Europe/Athens). Πρόκειται για κυλιόμενο παράθυρο ακριβώς ${hours} ωρών. ΜΗΝ συμπεριλάβεις δημοσίευση ή νέο γεγονός εκτός αυτού του χρονικού παραθύρου μόνο επειδή εμφανίζεται ψηλά στα αποτελέσματα αναζήτησης. Αν ένα πρόσφατο άρθρο αναφέρεται αποκλειστικά σε παλιό γεγονός χωρίς νέα εξέλιξη μέσα στο παράθυρο, απόρριψέ το.

ΕΣΤΙΑΣΗ
${focusInstructions[focus]}

ΠΗΓΕΣ ΠΡΟΤΕΡΑΙΟΤΗΤΑΣ
${SOURCE_GUIDE}

ΚΑΝΟΝΕΣ ΕΡΓΑΣΙΑΣ
1. Χρησιμοποίησε web search και έλεγξε πολλές από τις παραπάνω πηγές, όχι μόνο μία ή δύο.
2. Προτίμησε πρωτογενείς θεσμικές πηγές όταν υπάρχει επίσημη ανακοίνωση. Τοπικό δημοσίευμα μπορεί να χρησιμοποιείται ως συμπληρωματική πηγή.
3. Κάνε deduplication: το ίδιο δελτίο Τύπου ή η ίδια είδηση που αναδημοσιεύεται σε πολλά sites να εμφανίζεται ως ΕΝΑ θέμα με πολλαπλές πηγές.
4. Απόρριψε πανελλαδικές ειδήσεις που δεν έχουν ειδική σύνδεση με Φλώρινα, Αμύνταιο ή Πρέσπες.
5. Απόρριψε κοινωνικές αγγελίες, κηδείες, γενικές αθλητικές ανακοινώσεις και χαμηλής αξίας εκδηλώσεις, εκτός αν έχουν σαφή δημόσια/στρατηγική σημασία.
6. Για κάθε θέμα δώσε importance = high / medium / low ως προς τη χρησιμότητά του για έναν Δήμο όπως ο Δήμος Πρεσπών. High = άμεση ενέργεια/ευκαιρία/κίνδυνος/απόφαση ή σημαντική πολιτική εξέλιξη. Medium = χρήσιμη ενημέρωση με πιθανή επίπτωση. Low = περιφερειακό context χωρίς άμεση δράση.
7. Η επιλογή χρήστη απαιτεί ελάχιστη σημασία "${minImportance}". Μην επιστρέψεις θέματα χαμηλότερα από αυτό το επίπεδο.
8. Κράτησε 5-12 πραγματικά σημαντικά θέματα. Αν υπάρχουν λιγότερα, επέστρεψε λιγότερα. Μην γεμίζεις τεχνητά το briefing.
9. Κάθε πηγή πρέπει να έχει πραγματικό URL που βρήκες στην αναζήτηση. Μην κατασκευάζεις URLs.
10. Η περίληψη κάθε θέματος να είναι 1-3 προτάσεις. Το "why_it_matters" να εξηγεί πρακτικά γιατί αξίζει προσοχή από τον Δήμο Πρεσπών.
11. Οι κατηγορίες να είναι σύντομες, π.χ. Πρέσπες, Χρηματοδοτήσεις, Περιβάλλον, ΔΑΜ/Ενέργεια, Αγροτικά, Πολιτική Προστασία, Διασυνοριακά, Τουρισμός/Πολιτισμός, Αυτοδιοίκηση, Υγεία/Κοινωνία.
12. Στο watch_next βάλε 3-5 εξελίξεις που αξίζει να παρακολουθούνται τις επόμενες ημέρες, μόνο αν προκύπτουν από το υλικό.
13. Γράψε στα ελληνικά, καθαρά και χωρίς υπερβολές.
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
        text: {
          format: {
            type: 'json_schema',
            name: 'florina_prespes_briefing',
            strict: true,
            schema: responseSchema
          },
          verbosity: 'medium'
        },
        reasoning: { effort: 'low' },
        store: false
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

  const text = extractOutputText(raw);
  if (!text) return jsonResponse(502, { error: 'Το μοντέλο δεν επέστρεψε briefing.' });

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    return jsonResponse(502, { error: 'Το briefing επέστρεψε σε μη αναμενόμενη μορφή.' });
  }

  // Final deterministic guard for the requested minimum importance.
  const minRank = importanceRank[minImportance];
  result.stories = (result.stories || []).filter(s => importanceRank[s.importance] >= minRank);
  result.generated_at = `Δημιουργήθηκε ${endDateTime} (ώρα Ελλάδας)`;
  result.period_label = periodLabel;

  return jsonResponse(200, result);
};
