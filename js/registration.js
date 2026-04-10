// Inscrição de Eventos - PCKL Hub com Firebase

let db, auth;

// Inicializar Firebase quando disponível
if (typeof firebase !== 'undefined') {
    db = firebase.firestore();
    auth = firebase.auth();
} else {
    console.error('Firebase não foi carregado corretamente');
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const registrationForm = document.getElementById('registration-form');
    const registrationCard = document.getElementById('registration-card');
    const registrationSuccess = document.getElementById('registration-success');
    const eventNotFound = document.getElementById('event-not-found');
    const eventDetailsSection = document.getElementById('event-details-section');

    let event = null;

    // Carregar evento selecionado do Firestore
    if (eventId && db) {
        try {
            const eventDocSnap = await db.collection('events').doc(eventId).get();
            if (eventDocSnap.exists) {
                event = { id: eventDocSnap.id, ...eventDocSnap.data() };
            } else {
                eventNotFound.classList.remove('hidden');
                eventDetailsSection.classList.add('hidden');
                return;
            }
        } catch (error) {
            console.error('Erro ao carregar evento:', error);
            eventNotFound.classList.remove('hidden');
            eventDetailsSection.classList.add('hidden');
            return;
        }
    } else {
        eventNotFound.classList.remove('hidden');
        eventDetailsSection.classList.add('hidden');
        return;
    }

    // Preencher detalhes do evento na página
    document.getElementById('event-display-title').textContent = event.title;
    document.getElementById('event-display-subtitle').textContent = `Participe deste evento no PCKL Hub.`;
    document.getElementById('event-display-description').textContent = event.description;
    document.getElementById('event-display-start').textContent = `${formatDate(event.startDate)} às ${event.startTime}`;
    document.getElementById('event-display-end').textContent = `${formatDate(event.endDate)} às ${event.endTime}`;
    
    const badge = document.getElementById('event-display-badge');
    badge.textContent = event.type.toUpperCase();
    if (event.type === 'pago') {
        badge.classList.add('badge-paid');
        document.getElementById('payment-notice').classList.remove('hidden');
    }

    const price = document.getElementById('event-display-price');
    price.textContent = event.type === 'pago' ? `R$ ${parseFloat(event.price).toFixed(2)}` : 'GRÁTIS';

    // Preencher automaticamente se o usuário estiver logado via Firebase Auth
    if (auth) {
        auth.onAuthStateChanged(async user => {
            if (user) {
                document.getElementById('reg-email').value = user.email;
                // Tentar buscar o nome do usuário no Firestore se disponível
                try {
                    const userDocSnap = await db.collection('users').doc(user.uid).get();
                    if (userDocSnap.exists) {
                        document.getElementById('reg-name').value = userDocSnap.data().name || '';
                    }
                } catch (error) {
                    console.error('Erro ao buscar dados do usuário:', error);
                }
            }
        });
    }

    // Submissão do formulário de inscrição
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const registrationDate = new Date().toLocaleString('pt-BR');
            const attendeeData = {
                name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                phone: document.getElementById('reg-phone').value,
                registrationDate: registrationDate
            };

            try {
                await db.collection('events').doc(eventId).update({
                    registrations: firebase.firestore.FieldValue.arrayUnion(attendeeData)
                });

                // Mostrar tela de sucesso
                registrationCard.classList.add('hidden');
                registrationSuccess.classList.remove('hidden');
                
                document.getElementById('success-name').textContent = attendeeData.name;
                document.getElementById('success-email').textContent = attendeeData.email;
                document.getElementById('success-phone').textContent = attendeeData.phone;
                document.getElementById('success-reg-date').textContent = attendeeData.registrationDate;
                
                alert('Inscrição realizada com sucesso!');

            } catch (error) {
                console.error('Erro ao registrar inscrição:', error);
                alert('Erro ao realizar inscrição. Tente novamente.');
            }
        });
    }

    // Função para formatar data
    function formatDate(dateStr) {
        if (!dateStr) return '--/--/----';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
});
