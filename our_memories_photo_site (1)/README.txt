OUR MEMORIES — setup notes

1. Open config.js and replace the two placeholders with your Supabase Project URL and sb_publishable_ key.
2. Keep your Storage bucket private and named riaa.
3. In Supabase Authentication, create email/password user(s) for the people allowed to view the gallery.
4. In Storage > Policies, add policies for storage.objects limited to bucket_id = 'riaa'. Use authenticated access only, and restrict INSERT/DELETE to your own user ID if only you should manage photos. Do not enable public access.
5. Publish these files on GitHub Pages or another free static host.

Never put a Supabase secret key or service_role key in config.js.
This starter uses Supabase email/password authentication; it does not use a fake password-only page.
Before sharing, test login and confirm Storage policies prevent unauthenticated access.
