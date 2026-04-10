// Sistema de Autenticação Unificado - auth.js

// Configuração das Credenciais
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Usuário padrão (exemplo)
const USER_USER = 'usuario';
const USER_PASS = '123456';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            // Verificar se é Administrador
            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'admin');
                sessionStorage.setItem('userName', 'Administrador');
                window.location.href = 'index.html';
            } 
            // Verificar se é Usuário Padrão
            else if (user === USER_USER && pass === USER_PASS) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'user');
                sessionStorage.setItem('userName', 'Visitante');
                window.location.href = 'index.html';
            } 
            else {
                loginError.style.display = 'block';
                document.getElementById('password').value = '';
            }
        });
    }
});

// Função para verificar se o usuário está logado
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
    }
}

// Função para verificar se é ADM
function isAdmin() {
    return sessionStorage.getItem('userRole') === 'admin';
}

// Função para fazer logout
function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}
