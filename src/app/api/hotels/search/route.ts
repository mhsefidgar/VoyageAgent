import { NextResponse } from 'next/server';

async function getToken() {
  const key = process.env.AMADEUS_API_KEY;
  const secret = process.env.AMADEUS_API_SECRET;
  if (!key || !secret) throw new Error('Amadeus credentials are not configured');
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: key, client_secret: secret }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Hotel provider authentication failed');
  return (await response.json()).access_token as string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityCode = searchParams.get('cityCode')?.trim().toUpperCase();
  const checkInDate = searchParams.get('checkInDate');
  const checkOutDate = searchParams.get('checkOutDate');
  const adults = searchParams.get('adults') ?? '1';
  if (!cityCode || !checkInDate || !checkOutDate) return NextResponse.json({ error: 'cityCode, checkInDate and checkOutDate are required' }, { status: 400 });

  try {
    const token = await getToken();
    const hotels = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!hotels.ok) throw new Error('Hotel search failed');
    const hotelData = await hotels.json();
    const ids = (hotelData.data ?? []).slice(0, 20).map((h: { hotelId: string }) => h.hotelId).join(',');
    if (!ids) return NextResponse.json({ data: [] });
    const offers = await fetch(`https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${encodeURIComponent(ids)}&checkInDate=${encodeURIComponent(checkInDate)}&checkOutDate=${encodeURIComponent(checkOutDate)}&adults=${encodeURIComponent(adults)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!offers.ok) throw new Error('Hotel offers unavailable');
    return NextResponse.json(await offers.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Hotel search failed' }, { status: 503 });
  }
}
