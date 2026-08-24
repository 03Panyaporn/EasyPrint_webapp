import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("Checking bucket...");
  const bucketName = 'contact-admin-attachments';
  const res = await db.execute(sql`
    SELECT name FROM storage.buckets WHERE name = ${bucketName};
  `).catch(console.error);

  if (res && res.length === 0) {
    console.log("Bucket doesn't exist, creating...");
    await db.execute(sql`
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (
        'contact-admin-attachments', 
        'contact-admin-attachments', 
        false, 
        20971520, 
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      );
    `).catch(console.error);

    await db.execute(sql`
      create policy "Give users authenticated access to folder 1" on storage.objects for select to authenticated using ((bucket_id = 'contact-admin-attachments'::text));
      create policy "Give users authenticated access to folder 2" on storage.objects for insert to authenticated with check ((bucket_id = 'contact-admin-attachments'::text));
      create policy "Give users authenticated access to folder 3" on storage.objects for update to authenticated using ((bucket_id = 'contact-admin-attachments'::text));
      create policy "Give users authenticated access to folder 4" on storage.objects for delete to authenticated using ((bucket_id = 'contact-admin-attachments'::text));
    `).catch(console.error);
    console.log("Bucket created!");
  } else {
    console.log("Bucket exists:", res);
  }
  process.exit(0);
}

run();
