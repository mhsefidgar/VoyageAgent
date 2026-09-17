create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger booking_requests_updated_at
before update on public.booking_requests
for each row execute procedure public.set_updated_at();

create trigger bookings_updated_at
before update on public.bookings
for each row execute procedure public.set_updated_at();

create unique index approvals_one_pending_per_request
on public.approvals (request_id)
where decision = 'pending';

create or replace function public.approve_booking_request(
  p_request_id uuid,
  p_approval_id uuid,
  p_user_id uuid,
  p_comment text default null
)
returns public.approvals
language plpgsql
security invoker
as $$
declare
  result public.approvals;
begin
  update public.approvals
  set decision = 'approved', comment = p_comment, decided_at = now()
  where id = p_approval_id
    and request_id = p_request_id
    and user_id = p_user_id
    and decision = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'Approval is no longer pending or is not owned by the user';
  end if;

  update public.booking_requests
  set status = 'approved'
  where id = p_request_id
    and user_id = p_user_id
    and status = 'awaiting_human_approval';

  insert into public.workflow_events(request_id, agent, event_type, payload)
  values (p_request_id, 'approval', 'approval_granted', jsonb_build_object('approvalId', p_approval_id, 'offerId', result.offer_id));

  return result;
end;
$$;
