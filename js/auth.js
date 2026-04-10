// Sistema de Autenticação - PCKL Hub com Firebase

// Aguardar o Firebase estar carregado
let auth, db;

// Inicializar Firebase quando disponível
if (typeof firebase !== 'undefined') {
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase inicializado com sucesso');
} else {
    console.error('Firebase não foi carregado corretamente');
}

// Configuração das Credenciais Fixas do Admin
const ADMIN_EMAIL = 'admin@pcklhub.com';
const ADMIN_PASS = 'admin123';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Lógica de Login com Firebase Authentication
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (loginError) loginError.style.display = 'none';

            // 1. Verificar se é Administrador (credenciais fixas)
            if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'admin');
                sessionStorage.setItem('userName', 'Administrador');
                window.location.href = 'index.html';
                return;
            }

            // 2. Tentar login com Firebase Authentication
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Buscar nome do usuário no Firestore
                try {
                    const userDocSnap = await db.collection('users').doc(user.uid).get();
                    let userName = 'Usuário';
                    if (userDocSnap.exists) {
                        userName = userDocSnap.data().name || 'Usuário';
                    }
                    sessionStorage.setItem('userName', userName);
                } catch (firestoreError) {
                    console.warn('Aviso ao buscar dados do Firestore:', firestoreError);
                    sessionStorage.setItem('userName', 'Usuário');
                }

                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'user');
                sessionStorage.setItem('userEmail', user.email);
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Erro no login:', error.code, error.message);
                if (loginError) {
                    if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                        loginError.textContent = 'E-mail ou senha incorretos.';
                    } else if (error.code === 'auth/too-many-requests') {
                        loginError.textContent = 'Muitas tentativas de login. Tente novamente mais tarde.';
                    } else {
                        loginError.textContent = 'Erro ao fazer login. Tente novamente.';
                    }
                    loginError.style.display = 'block';
                }
                document.getElementById('password').value = '';
            }
        });
    }

    // Lógica de Registro com Firebase Authentication
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;

            if (registerError) registerError.style.display = 'none';

            console.log('Iniciando registro para:', email);

            // Verificar se o e-mail é o do admin
            if (email === ADMIN_EMAIL) {
                if (registerError) {
                    registerError.textContent = 'Este e-mail é reservado para o administrador.';
                    registerError.style.display = 'block';
                }
                return;
            }

            try {
                // Passo 1: Criar usuário no Authentication
                console.log('Passo 1: Criando usuário no Authentication...');
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('Usuário criado com sucesso no Authentication:', user.uid);

                // Passo 2: Tentar salvar dados no Firestore (opcional, não bloqueia o registro)
                console.log('Passo 2: Salvando dados no Firestore...');
                try {
                    await db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: new Date()
                    });
                    console.log('Dados salvos no Firestore com sucesso');
                } catch (firestoreError) {
                    console.warn('Aviso ao salvar no Firestore (não é crítico):', firestoreError.code, firestoreError.message);
                    // Não bloqueia o registro se o Firestore falhar
                }

                alert('Conta criada com sucesso! Faça login para continuar.');
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Erro no registro:', error.code, error.message);
                
                // Mensagens de erro detalhadas
                let mensagemErro = 'Erro ao criar conta. Tente novamente.';
                
                if (error.code === 'auth/email-already-in-use') {
                    mensagemErro = 'Este e-mail já está cadastrado.';
                } else if (error.code === 'auth/invalid-email') {
                    mensagemErro = 'Formato de e-mail inválido.';
                } else if (error.code === 'auth/weak-password') {
                    mensagemErro = 'A senha deve ter pelo menos 6 caracteres.';
                } else if (error.code === 'auth/operation-not-allowed') {
                    mensagemErro = 'Registro por e-mail/senha não está ativado no Firebase. Ative em: Console Firebase > Authentication > Sign-in method > Email/Password.';
                } else if (error.code === 'auth/network-request-failed') {
                    mensagemErro = 'Erro de conexão com o Firebase. Verifique sua internet.';
                } else {
                    mensagemErro = `Erro: ${error.code} - ${error.message}`;
                }

                if (registerError) {
                    registerError.textContent = mensagemErro;
                    registerError.style.display = 'block';
                }
                
                console.error('Mensagem completa do erro:', error);
            }
        });
    }
});

// Monitorar estado de autenticação
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Usuário autenticado:', user.email);
        } else {
            console.log('Nenhum usuário autenticado');
        }
    });
}

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
async function logout() {
    try {
        await auth.signOut();
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Tente novamente.');
    }
}

// Expor funções globalmente
window.checkAuth = checkAuth;
window.isAdmin = isAdmin;
window.logout = logout;
