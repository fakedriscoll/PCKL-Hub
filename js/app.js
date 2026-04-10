// Gerenciamento de Eventos - app.js

document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('event-form');
    const eventTypeSelect = document.getElementById('event-type');
    const priceGroup = document.getElementById('price-group');
    const eventsList = document.getElementById('events-list');

    // Mostrar/esconder campo de preço
    eventTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'pago') {
            priceGroup.style.display = 'block';
            document.getElementById('event-price').required = true;
        } else {
            priceGroup.style.display = 'none';
            document.getElementById('event-price').required = false;
        }
    });

    // Função para carregar eventos do LocalStorage
    const loadEvents = () => {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const role = sessionStorage.getItem('userRole');
        
        if (events.length === 0) {
            eventsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Não há eventos disponíveis no momento.</p>';
            return;
        }

        eventsList.innerHTML = '';
        events.forEach((event, index) => {
            const eventCard = document.createElement('div');
            eventCard.className = 'card';
            
            const badgeClass = event.type === 'pago' ? 'badge badge-paid' : 'badge';
            const priceDisplay = event.type === 'pago' ? `R$ ${parseFloat(event.price).toFixed(2)}` : 'GRÁTIS';
            
            // Gerar botões baseados no papel (role)
            let actionButtons = '';
            if (role === 'admin') {
                actionButtons = `
                    <button onclick="viewAttendees('${event.id}')" class="btn btn-outline" style="font-size: 0.8rem;">VER INSCRITOS (${event.registrations ? event.registrations.length : 0})</button>
                    <a href="event.html?id=${event.id}" class="btn btn-outline" style="font-size: 0.8rem;">PÁGINA DE INSCRIÇÃO</a>
                    <button onclick="deleteEvent('${event.id}')" class="btn btn-outline" style="font-size: 0.8rem; border-color: #ff4444; color: #ff4444; margin-left: 0.5rem;">EXCLUIR</button>
                `;
            } else {
                actionButtons = `
                    <a href="event.html?id=${event.id}" class="btn" style="font-size: 0.8rem;">QUERO ME INSCREVER</a>
                `;
            }

            eventCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <span class="${badgeClass}">${event.type.toUpperCase()}</span>
                        <h3 style="margin-top: 0.5rem;">${event.title}</h3>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: 700; font-size: 1.2rem;">${priceDisplay}</span>
                    </div>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${event.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem;">
                    <div>
                        <span style="font-size: 0.9rem; font-weight: 600;">DATA: ${formatDate(event.date)} às ${event.time}</span>
                    </div>
                    <div>
                        ${actionButtons}
                    </div>
                </div>
            `;
            eventsList.appendChild(eventCard);
        });
    };

    // Função para formatar data
    const formatDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Submissão do formulário de evento
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newEvent = {
            id: Date.now().toString(),
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            type: document.getElementById('event-type').value,
            price: document.getElementById('event-price').value || 0,
            registrations: []
        };

        const events = JSON.parse(localStorage.getItem('events')) || [];
        events.push(newEvent);
        localStorage.setItem('events', JSON.stringify(events));
        
        eventForm.reset();
        priceGroup.style.display = 'none';
        loadEvents();
        alert('Evento criado com sucesso!');
    });

    // Função global para ver inscritos no Modal
    window.viewAttendees = (id) => {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const event = events.find(e => e.id === id);
        const modal = document.getElementById('attendees-modal');
        const modalTitle = document.getElementById('modal-event-title');
        const tbody = document.getElementById('attendees-tbody');
        const table = document.getElementById('attendees-table');
        const emptyMsg = document.getElementById('no-attendees-msg');
        
        if (!event) return;

        modalTitle.textContent = `Inscritos: ${event.title}`;
        tbody.innerHTML = '';
        
        if (!event.registrations || event.registrations.length === 0) {
            table.classList.add('hidden');
            emptyMsg.classList.remove('hidden');
        } else {
            table.classList.remove('hidden');
            emptyMsg.classList.add('hidden');
            
            event.registrations.forEach(reg => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${reg.name}</td>
                    <td>${reg.email}</td>
                    <td>${reg.phone}</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${reg.registrationDate}</td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        modal.classList.remove('hidden');
    };

    // Função global para fechar o Modal
    window.closeModal = () => {
        document.getElementById('attendees-modal').classList.add('hidden');
    };

    // Função global para deletar evento (acessível pelo HTML inline)
    window.deleteEvent = (id) => {
        if (confirm('Tem certeza que deseja excluir este evento?')) {
            let events = JSON.parse(localStorage.getItem('events')) || [];
            events = events.filter(event => event.id !== id);
            localStorage.setItem('events', JSON.stringify(events));
            loadEvents();
        }
    };

    // Inicializar lista
    loadEvents();
});