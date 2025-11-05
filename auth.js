// Authentication Functions

// Sign up new user
async function signUp(email, password, fullName, phone) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone
                }
            }
        });

        if (error) throw error;
        
        alert('Registration successful! Please check your email to verify your account.');
        return data;
    } catch (error) {
        alert('Error: ' + error.message);
        return null;
    }
}

// Sign in user
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        
        alert('Login successful!');
        window.location.href = 'index.html';
        return data;
    } catch (error) {
        alert('Error: ' + error.message);
        return null;
    }
}

// Sign out user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        alert('Logged out successfully!');
        window.location.href = 'auth.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Update user profile
async function updateProfile(fullName, phone) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: { full_name: fullName, phone: phone }
        });

        if (error) throw error;
        
        alert('Profile updated successfully!');
        return data;
    } catch (error) {
        alert('Error: ' + error.message);
        return null;
    }
}

// Check authentication on page load
async function initAuth() {
    const user = await getCurrentUser();
    
    // Update UI based on auth state
    const authButtons = document.getElementById('authButtons');
    if (authButtons) {
        if (user) {
            authButtons.innerHTML = `
                <span>Welcome, ${user.user_metadata?.full_name || user.email}</span>
                <button onclick="signOut()">Logout</button>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="auth.html"><button>Login</button></a>
            `;
        }
    }
    
    return user;
}

// Protect page (redirect if not logged in)
async function protectPage() {
    const user = await getCurrentUser();
    if (!user) {
        alert('Please login to access this page');
        window.location.href = 'auth.html';
    }
    return user;
}

// Protect admin page
async function protectAdminPage() {
    const admin = await isAdmin();
    if (!admin) {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
    }
}