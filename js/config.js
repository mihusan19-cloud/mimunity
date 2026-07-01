const supabaseUrl = 'https://tofcvucrwcyvbmkywtaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZmN2dWNyd2N5dmJta3l3dGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Mjk4MDcsImV4cCI6MjA4ODAwNTgwN30.NcgcbKVL9zR7_PM2L6mfYe2AIh5P1EnILRO9QN0j4Bg';

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});

let currentUser = null;
let chatTarget = null;
let viewingUserId = null;
let userPresence = {};
let presenceChannel = null;
let messageChannel = null;
let selectedFx = "";
