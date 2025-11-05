// Supabase Configuration
// Replace these with your actual Supabase credentials

const SUPABASE_URL = 'https://bhxalvyzfgxyzjjacipj.supabase.co'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoeGFsdnl6Zmd4eXpqamFjaXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTgzNzcsImV4cCI6MjA3NzMzNDM3N30.XqEvefjnHqRJnprsEbhjD5r-CKpxdmPb0xiBZ5nuEH0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is logged in
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Get current user session
async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}

// Check if user is admin
async function isAdmin() {
    const user = await getCurrentUser();
    // Add admin emails here
    const adminEmails = ['alexander@mmtyres.com', 'admin@mmtyres.com'];
    return user && adminEmails.includes(user.email);
}