import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const superHash = await bcrypt.hash('Admin@1234', 12);
  const modHash = await bcrypt.hash('Mod@12345', 12);

  await supabase.from('admin_users').upsert([
    { name: 'Super Admin', email: 'admin@vexpense.app', password_hash: superHash, role: 'super_admin' },
    { name: 'Moderator One', email: 'mod1@vexpense.app', password_hash: modHash, role: 'moderator' },
    { name: 'Moderator Two', email: 'mod2@vexpense.app', password_hash: modHash, role: 'moderator' },
  ], { onConflict: 'email' });

  console.log('✅ Admin users seeded');
  process.exit(0);
}
seed().catch(console.error);
