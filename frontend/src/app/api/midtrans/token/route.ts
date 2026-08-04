import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, grossAmount, items } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    // Check if serverKey is not configured or is the dummy key
    if (!serverKey || serverKey.includes('YOUR_DUMMY_KEY')) {
      return NextResponse.json({ 
        token: `mock-snap-token-${Date.now()}`, 
        redirectUrl: '#',
        isMock: true,
        warning: 'Kunci API Midtrans tidak dikonfigurasi. Berjalan dalam mode simulasi/mock.'
      });
    }

    const tokenBase64 = Buffer.from(serverKey + ':').toString('base64');
    
    const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${tokenBase64}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount
        },
        item_details: items?.map((item: { id: string; price: number; quantity: number; name: string }) => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          name: item.name
        })),
        credit_card: {
          secure: true
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      // If unauthorized, fall back to mock mode
      if (response.status === 401) {
        return NextResponse.json({ 
          token: `mock-snap-token-${Date.now()}`, 
          redirectUrl: '#',
          isMock: true,
          warning: 'Kunci Server Midtrans tidak valid (401 Unauthorized). Berjalan dalam mode simulasi/mock.'
        });
      }
      throw new Error(data.error_messages ? data.error_messages.join(', ') : 'Midtrans API Error');
    }

    return NextResponse.json({ token: data.token, redirectUrl: data.redirect_url, isMock: false });
  } catch (error: unknown) {
    console.error('Error generating Midtrans token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Fallback to mock mode on connection error or any other errors
    return NextResponse.json({ 
      token: `mock-snap-token-${Date.now()}`, 
      redirectUrl: '#',
      isMock: true,
      error: errorMessage
    });
  }
}
