import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusinessRole } from '@/lib/utils/auth';
import { updateOrderSchema } from '@/lib/validations/order';

export const dynamic = 'force-dynamic';

// GET /api/orders/[id] - Obtener pedido individual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        courier:couriers!assigned_courier_id(id, display_name, phone),
        customer:customers(id, name, phone)
      `)
      .eq('id', orderId)
      .eq('business_id', businessMember.business_id)
      .single();
    
    if (error || !order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ order });
    
  } catch (error: unknown) {
    console.error('GET /api/orders/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener pedido';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Actualizar pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;
    
    // Verificar que el pedido existe y pertenece al negocio
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, business_id, status, customer_id')
      .eq('id', orderId)
      .eq('business_id', businessMember.business_id)
      .single();
    
    if (checkError || !existingOrder) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Solo permitir editar pedidos que no estén entregados o cancelados
    if (['delivered', 'canceled'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'No se puede editar un pedido entregado o cancelado' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const data = updateOrderSchema.parse(body);
    
    // Actualizar cliente si se proporcionó info
    const existingCustomerId = (existingOrder as any).customer_id as string | null;
    let customer_id = existingCustomerId || null;
    if (data.customer_name || data.customer_phone) {
      // Buscar cliente existente o crear uno nuevo
      if (existingCustomerId) {
        // Actualizar cliente existente
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            name: data.customer_name || null,
            phone: data.customer_phone || null,
          })
          .eq('id', existingCustomerId);
        
        if (customerError) {
          console.error('Error updating customer:', customerError);
        }
      } else {
        // Crear nuevo cliente
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert({
            business_id: businessMember.business_id,
            name: data.customer_name,
            phone: data.customer_phone,
          })
          .select('id')
          .single();
        
        if (!customerError && customer) {
          customer_id = customer.id;
        }
      }
    }
    
    // Actualizar pedido
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        dropoff_address: data.dropoff_address,
        pickup_address: data.pickup_address,
        dropoff_lat: data.dropoff_lat,
        dropoff_lng: data.dropoff_lng,
        items_summary: data.items_summary,
        notes: data.notes,
        amount_cents: data.amount_cents,
        customer_id,
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ order });
    
  } catch (error: unknown) {
    console.error('PATCH /api/orders/[id] error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar pedido';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
