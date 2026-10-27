insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', false)
on conflict (id) do nothing;
