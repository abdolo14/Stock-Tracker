document.addEventListener('DOMContentLoaded', () => {
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('loginError');
            errorDiv.classList.add('hidden');
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    errorDiv.textContent = data.error || 'Login failed';
                    errorDiv.classList.remove('hidden');
                    return;
                }

                window.location.href = '/dashboard';
            } catch (error) {
                console.error('Error:', error);
                errorDiv.textContent = 'An error occurred during login';
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Register form handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('registerPasswordConfirm');
        
        // Password validation
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const isValid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
            passwordInput.setCustomValidity(
                isValid ? '' : 'Password must be at least 8 characters with at least one letter and one number'
            );
        });

        // Password confirmation validation
        confirmPasswordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            confirmPasswordInput.setCustomValidity(
                password === confirmPassword ? '' : 'Passwords do not match'
            );
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('registerError');
            errorDiv.classList.add('hidden');
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Client-side validation
            if (password !== confirmPassword) {
                errorDiv.textContent = 'Passwords do not match';
                errorDiv.classList.remove('hidden');
                return;
            }

            if (password.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
                errorDiv.textContent = 'Password must be at least 8 characters with at least one letter and one number';
                errorDiv.classList.remove('hidden');
                return;
            }

            if (username.length < 3) {
                errorDiv.textContent = 'Username must be at least 3 characters';
                errorDiv.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    errorDiv.textContent = data.error || 'Registration failed';
                    errorDiv.classList.remove('hidden');
                    return;
                }

                window.location.href = '/dashboard';
            } catch (error) {
                console.error('Error:', error);
                errorDiv.textContent = 'An error occurred during registration';
                errorDiv.classList.remove('hidden');
            }
        });
    }
});
