import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

interface ParsedInvoice {
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: InvoiceItem[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, pdfBase64 } = await req.json();
    
    if (!pdfText && !pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF text or base64 content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Ești un asistent specializat în extragerea datelor din facturi românești pentru produse pirotehnice.
    
Analizează textul facturii și extrage:
1. Numele furnizorului (din secțiunea VANZATOR, câmpul "Nume" sau "Denumire")
2. Numărul facturii (din câmpul care conține "Nr." sau "Numar factura" sau identificator similar)
3. Data facturii (format YYYY-MM-DD, din "Data emitere" sau similar)
4. Lista de produse cu:
   - Cod produs (VEZI REGULILE DE MAI JOS!)
   - Denumire produs (din coloana "Nume articol", "Descriere articol" sau "Denumire" - include TOATE textul descriptiv)
   - Cantitate (din coloana "Cantitate" sau "Cantitate facturata" - NU din "Cantitate de baza")
   - Preț unitar (din coloana "Pret unitar" sau "Pretul net al articolului" - în RON, fără TVA)
   - Categorie pirotehnică (F1, F2, F3, F4, T1, T2) - deduse din denumire

=== REGULI CRITICE PENTRU CODUL PRODUSULUI ===

DETECTARE RO eFactura:
- Dacă vezi textul "RO eFactura" ORIUNDE în factură (de obicei deasupra numărului facturii) → FOLOSEȘTE ÎNTOTDEAUNA denumirea completă din "Nume articol" sau "Descriere articol" ca și cod!
- Pentru facturile RO eFactura, NU căuta coduri - folosește direct denumirea produsului ca "code"

PENTRU ALTE FACTURI (fără "RO eFactura"):
PASUL 1: Caută un COD REAL în factură. Un cod real are aceste caracteristici:
- Este SCURT (2-15 caractere)
- Este ALFANUMERIC (conține litere și/sau cifre, poate avea cratimă)
- Apare într-o coloană separată numită "Cod", "Cod produs", "Cod articol" SAU la începutul denumirii
- Exemple de coduri REALE: "FS710", "FS711", "LBF120", "NS-SMR25", "CLE4030", "SFT9001", "ABC123", "X-100"

PASUL 2: Dacă găsești un cod real → folosește-l ca valoare pentru "code"
         Dacă NU găsești un cod real → folosește DENUMIREA COMPLETĂ a produsului ca "code"

EXEMPLE CONCRETE:
- Factură cu coloană "Cod" = "FS710" și denumire = "Artificii F2" → code: "FS710"
- Factură cu denumire = "FS711 - Petarde mici 50 buc" → code: "FS711" (codul e la început)
- Factură FĂRĂ cod, doar denumire = "Single Shot calibru 1\" Green..." → code: "Single Shot calibru 1\" Green..." (copiază denumirea)

NU CONFUNDA:
- "150buc", "72buc", "100buc" NU sunt coduri, sunt cantități în ambalaj
- "30mm", "1\"", "4\"" NU sunt coduri, sunt dimensiuni
- Numerele de ordine din tabel (1, 2, 3...) NU sunt coduri

=== REGULI PENTRU EXTRAGEREA TABELULUI ===
- Coloana "Cantitate" sau "Cantitate facturata" conține CANTITATEA REALĂ comandată
- NU folosi "Cantitate de baza" care este de obicei 1
- Prețul unitar este în coloana "Pretul net al articolului" sau similar

IMPORTANT:
- Ignoră pozițiile care nu sunt produse (transport, ambalaj, servicii, etc.)
- Dacă nu poți determina categoria, folosește F2 ca valoare implicită
- Pentru categorii: calibru mic (1", 1.2") = F2, calibru mare (3", 4", 5", 6") sau baterii = F3
- Prețurile trebuie să fie numere (fără simbol monetar)
- Cantitățile trebuie să fie numere întregi pozitive (rotunjește dacă e cazul)`;

    const userPrompt = `Analizează această factură și extrage datele structurate:

${pdfText || 'Conținut PDF atașat în format base64.'}

Răspunde DOAR cu un JSON valid în formatul:
{
  "supplier": "Nume Furnizor SRL",
  "invoiceNumber": "FAC-2024-001",
  "invoiceDate": "2024-01-15",
  "items": [
    {
      "code": "PYRO001",
      "name": "Artificii F2 pachet",
      "quantity": 10,
      "unitPrice": 25.50,
      "category": "F2"
    }
  ]
}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // If we have base64 PDF, use vision capabilities
    if (pdfBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${pdfBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    console.log('Calling AI gateway to parse invoice...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limită de rate depășită, încearcă din nou mai târziu.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credite AI insuficiente.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Eroare la procesarea AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nu s-a primit răspuns de la AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response:', content);

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      const parsedInvoice: ParsedInvoice = JSON.parse(jsonStr.trim());
      
      // Validate the parsed data
      if (!parsedInvoice.items || !Array.isArray(parsedInvoice.items)) {
        throw new Error('Invalid items array');
      }

      // Clean up and validate items
      parsedInvoice.items = parsedInvoice.items
        .filter(item => item.quantity > 0 && item.name)
        .map(item => ({
          code: item.code || `PYRO-${Date.now().toString(36).toUpperCase()}`,
          name: item.name,
          quantity: Math.max(1, Math.round(item.quantity)),
          unitPrice: Math.max(0, parseFloat(String(item.unitPrice)) || 0),
          category: ['F1', 'F2', 'F3', 'F4', 'T1', 'T2'].includes(item.category?.toUpperCase() || '') 
            ? item.category?.toUpperCase() 
            : 'F2'
        }));

      console.log('Parsed invoice:', parsedInvoice);

      return new Response(
        JSON.stringify({ success: true, data: parsedInvoice }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonStr);
      return new Response(
        JSON.stringify({ success: false, error: 'Nu s-au putut extrage datele din factură' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error parsing invoice:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Eroare necunoscută' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
