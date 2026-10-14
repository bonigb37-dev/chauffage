'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, background: '#FAF8F3', color: '#1c1917', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h1>Diese Seite ist vorübergehend nicht verfügbar.</h1>
          <p>Bitte versuchen Sie es erneut. Bei Fragen helfen wir Ihnen gerne weiter.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 32 }}>
            <button type="button" onClick={reset} style={{ padding: '12px 24px', border: 0, borderRadius: 24, background: '#286044', color: '#fff', fontSize: 16, cursor: 'pointer' }}>Erneut versuchen</button>
            <a href="/de" style={{ padding: '12px 24px', color: '#286044' }}>Zur Startseite</a>
            <a href="/de/contact" style={{ padding: '12px 24px', color: '#286044' }}>Kontakt aufnehmen</a>
          </div>
        </main>
      </body>
    </html>
  );
}
