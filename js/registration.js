// Inscrição de Eventos - registration.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const registrationForm = document.getElementById('registration-form');
    const registrationCard = document.getElementById('registration-card');
    const registrationSuccess = document.getElementById('registration-success');
    const eventNotFound = document.getElementById('event-not-found');
    const eventDetailsSection = document.getElementById('event-details-section');

    // Carregar evento selecionado
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const event = events.find(e => e.id === eventId);

    if (!event) {
        eventNotFound.classList.remove('hidden');
        eventDetailsSection.classList.add('hidden');
        return;
    }

    // Preencher detalhes do evento na página
    document.getElementById('event-display-title').textContent = event.title;
    document.getElementById('event-display-subtitle').textContent = `Participe deste evento exclusivo.`;
    document.getElementById('event-display-description').textContent = event.description;
    document.getElementById('event-display-date').textContent = formatDate(event.date);
    document.getElementById('event-display-time').textContent = event.time;
    
    const badge = document.getElementById('event-display-badge');
    badge.textContent = event.type.toUpperCase();
    if (event.type === 'pago') badge.classList.add('badge-paid');

    const price = document.getElementById('event-display-price');
    price.textContent = event.type === 'pago' ? `R$ ${parseFloat(event.price).toFixed(2)}` : 'GRÁTIS';

    // Submissão do formulário de inscrição
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const registrationDate = new Date().toLocaleString('pt-BR');
        const attendeeData = {
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            registrationDate: registrationDate
        };

        // Salvar inscrição no evento
        const updatedEvents = events.map(ev => {
            if (ev.id === eventId) {
                if (!ev.registrations) ev.registrations = [];
                ev.registrations.push(attendeeData);
            }
            return ev;
        });

        localStorage.setItem('events', JSON.stringify(updatedEvents));

        // Mostrar tela de sucesso
        registrationCard.classList.add('hidden');
        registrationSuccess.classList.remove('hidden');
        
        document.getElementById('success-name').textContent = attendeeData.name;
        document.getElementById('success-email').textContent = attendeeData.email;
        document.getElementById('success-phone').textContent = attendeeData.phone;
        document.getElementById('success-reg-date').textContent = attendeeData.registrationDate;
        
        alert('Inscrição realizada com sucesso!');
    });

    // Função para formatar data
    function formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
});
