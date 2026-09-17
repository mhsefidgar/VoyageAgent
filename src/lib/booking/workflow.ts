import { createClient } from '@/lib/supabase/server';

export type BookingWorkflowStatus = 'draft'|'searching'|'offers_ready'|'awaiting_human_approval'|'approved'|'rejected'|'booking'|'confirmed'|'failed'|'cancelled';

export async function recordWorkflowEvent(requestId:string,agent:string,eventType:string,payload:Record<string,unknown>={}){
  const supabase=await createClient();
  const {error}=await supabase.from('workflow_events').insert({request_id:requestId,agent,event_type:eventType,payload});
  if(error) throw error;
}

export async function setWorkflowStatus(requestId:string,status:BookingWorkflowStatus){
  const supabase=await createClient();
  const {error}=await supabase.from('booking_requests').update({status,updated_at:new Date().toISOString()}).eq('id',requestId);
  if(error) throw error;
}

export async function createApprovalGate(requestId:string,offerId:string,userId:string){
  const supabase=await createClient();
  const {error}=await supabase.from('approvals').insert({request_id:requestId,offer_id:offerId,user_id:userId,decision:'pending'});
  if(error) throw error;
  await recordWorkflowEvent(requestId,'approval','approval_requested',{offerId});
  await setWorkflowStatus(requestId,'awaiting_human_approval');
}

export async function approveOffer(requestId:string,approvalId:string,userId:string,comment?:string){
  const supabase=await createClient();
  const {data,error}=await supabase.rpc('approve_booking_request',{p_request_id:requestId,p_approval_id:approvalId,p_user_id:userId,p_comment:comment??null});
  if(error) throw error;
  return data;
}

export async function rejectOffer(requestId:string,approvalId:string,userId:string,comment?:string){
  const supabase=await createClient();
  const {data,error}=await supabase.from('approvals').update({decision:'rejected',comment:comment??null,decided_at:new Date().toISOString()}).eq('id',approvalId).eq('request_id',requestId).eq('user_id',userId).eq('decision','pending').select('id').single();
  if(error) throw error;
  await recordWorkflowEvent(requestId,'approval','approval_rejected',{approvalId});
  await setWorkflowStatus(requestId,'rejected');
  return data;
}

export async function assertApprovedBeforeBooking(requestId:string,offerId:string,userId:string){
  const supabase=await createClient();
  const {data,error}=await supabase.from('approvals').select('id').eq('request_id',requestId).eq('offer_id',offerId).eq('user_id',userId).eq('decision','approved').limit(1).maybeSingle();
  if(error) throw error;
  if(!data) throw new Error('Human approval is required before booking this offer');
}
