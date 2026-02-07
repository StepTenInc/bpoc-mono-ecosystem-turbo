
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    const email = `debug_${Date.now()}@test.com`;
    const password = 'password123';

    console.log(`🧪 Attempting signup for ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('❌ Signup FAILED with error:');
        console.error(JSON.stringify(error, null, 2));

        if (error.status === 422) {
            console.log('\n💡 422 Analysis:');
            console.log('Possible causes:');
            console.log('1. Password too short (<6 chars)?');
            console.log('2. Email domain blocked?');
            console.log('3. Rate limiting?');
            console.log('4. Captcha enabled in Supabase Security settings?');
        }
    } else {
        console.log('✅ Signup SUCCESS!');
        console.log('User ID:', data.user?.id);
    }
}

testSignup();
