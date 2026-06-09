import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Webhook URL no configurada' }, { status: 500 });
    }

    // Usamos el servidor de Next.js para enviar la petición, evitando problemas de CORS en el navegador
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `N8N respondió con error: ${response.status}`, details: text }, { status: response.status });
    }

    const responseData = await response.json().catch(() => ({}));
    return NextResponse.json({ success: true, n8nResponse: responseData });

  } catch (error) {
    console.error('Error enviando a n8n:', error);
    return NextResponse.json({ error: 'Error de red o servidor al enviar a n8n' }, { status: 500 });
  }
}
