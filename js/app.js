// Gerenciamento de Eventos - PCKL Hub com Firebase

let db;

// Inicializar Firestore quando disponível
if (typeof firebase !== 'undefined') {
    db = firebase.firestore();
} else {
    console.error('Firebase não foi carregado corretamente');
}

document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('event-form');
    const eventTypeSelect = document.getElementById('event-type');
    const priceGroup = document.getElementById('price-group');
    const eventsList = document.getElementById('events-list');

    // Mostrar/esconder campo de preço
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'pago') {
                priceGroup.style.display = 'block';
                document.getElementById('event-price').required = true;
            } else {
                priceGroup.style.display = 'none';
                document.getElementById('event-price').required = false;
            }
        });
    }

    // Função para carregar eventos do Firestore
    const loadEvents = async () => {
        if (!db) {
            console.error('Firestore não está inicializado');
            return;
        }

        try {
            const eventsSnapshot = await db.collection('events')
                .orderBy('startDate', 'asc')
                .orderBy('startTime', 'asc')
                .get();

            const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const role = sessionStorage.getItem('userRole');
            
            if (!eventsList) return;

            if (events.length === 0) {
                eventsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Não há eventos disponíveis no momento.</p>';
                return;
            }

            eventsList.innerHTML = '';
            events.forEach((event) => {
                const eventCard = document.createElement('div');
                eventCard.className = 'card';
                
                const badgeClass = event.type === 'pago' ? 'badge badge-paid' : 'badge';
                const priceDisplay = event.type === 'pago' ? `R$ ${parseFloat(event.price).toFixed(2)}` : 'GRÁTIS';
                
                let actionButtons = '';
                if (role === 'admin') {
                    const registrationCount = event.registrations ? event.registrations.length : 0;
                    actionButtons = `
                        <button onclick="viewAttendees('${event.id}')" class="btn btn-outline" style="font-size: 0.8rem;">VER INSCRITOS (${registrationCount})</button>
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
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; gap: 1rem;">
                        <div style="font-size: 0.9rem;">
                            <div style="font-weight: 600;">INÍCIO: ${formatDate(event.startDate)} às ${event.startTime}</div>
                            <div style="font-weight: 600;">TÉRMINO: ${formatDate(event.endDate)} às ${event.endTime}</div>
                        </div>
                        <div>
                            ${actionButtons}
                        </div>
                    </div>
                `;
                eventsList.appendChild(eventCard);
            });
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            if (eventsList) {
                eventsList.innerHTML = '<p style="text-align: center; color: #ff4444; padding: 2rem;">Erro ao carregar eventos. Tente novamente.</p>';
            }
        }
    };

    // Função para formatar data
    const formatDate = (dateStr) => {
        if (!dateStr) return '--/--/----';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Submissão do formulário de evento
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newEvent = {
                title: document.getElementById('event-title').value,
                description: document.getElementById('event-description').value,
                startDate: document.getElementById('event-start-date').value,
                startTime: document.getElementById('event-start-time').value,
                endDate: document.getElementById('event-end-date').value,
                endTime: document.getElementById('event-end-time').value,
                type: document.getElementById('event-type').value,
                price: document.getElementById('event-price').value || 0,
                registrations: []
            };

            try {
                await db.collection('events').add(newEvent);
                eventForm.reset();
                if (priceGroup) priceGroup.style.display = 'none';
                loadEvents();
                alert('Evento criado com sucesso!');
            } catch (error) {
                console.error('Erro ao criar evento:', error);
                alert('Erro ao criar evento. Tente novamente.');
            }
        });
    }

    // Inicializar lista
    loadEvents();
});

// Função global para ver inscritos no Modal
async function viewAttendees(id) {
    if (!db) {
        console.error('Firestore não está inicializado');
        return;
    }

    try {
        const eventDocSnap = await db.collection('events').doc(id).get();
        const event = eventDocSnap.exists ? { id: eventDocSnap.id, ...eventDocSnap.data() } : null;

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
    } catch (error) {
        console.error('Erro ao carregar inscritos:', error);
        alert('Erro ao carregar inscritos. Tente novamente.');
    }
}

// Relatório de Frequência (Admin)
async function generateFrequencyReport() {
    if (!isAdmin()) {
        alert('Acesso negado. Apenas administradores podem gerar relatórios.');
        return;
    }

    if (!db) {
        console.error('Firestore não está inicializado');
        return;
    }

    try {
        const eventsSnapshot = await db.collection('events').get();
        const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const frequencyMap = {};

        events.forEach(event => {
            if (event.registrations) {
                event.registrations.forEach(reg => {
                    const email = reg.email;
                    if (!frequencyMap[email]) {
                        frequencyMap[email] = {
                            name: reg.name,
                            email: email,
                            count: 0
                        };
                    }
                    frequencyMap[email].count++;
                });
            }
        });

        const reportData = Object.values(frequencyMap).sort((a, b) => b.count - a.count);

        const modal = document.getElementById('attendees-modal');
        const modalTitle = document.getElementById('modal-event-title');
        const tbody = document.getElementById('attendees-tbody');
        const table = document.getElementById('attendees-table');
        const emptyMsg = document.getElementById('no-attendees-msg');

        modalTitle.textContent = `Relatório Mensal de Frequência`;
        tbody.innerHTML = '';

        if (reportData.length === 0) {
            table.classList.add('hidden');
            emptyMsg.classList.remove('hidden');
            emptyMsg.textContent = 'Nenhuma inscrição encontrada para gerar o relatório.';
        } else {
            table.classList.remove('hidden');
            emptyMsg.classList.add('hidden');
            
            const thead = table.querySelector('thead tr');
            thead.innerHTML = '<th>Nome</th><th>E-mail</th><th>Participações</th>';

            reportData.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${user.name}</td>
                    <td>${user.email}</td>
                    <td style="font-weight: 700;">${user.count} eventos</td>
                `;
                tbody.appendChild(tr);
            });
        }
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório. Tente novamente.');
    }
}

// Função global para fechar o Modal
function closeModal() {
    document.getElementById('attendees-modal').classList.add('hidden');
    const table = document.getElementById('attendees-table');
    if (table) {
        const thead = table.querySelector('thead tr');
        thead.innerHTML = '<th>Nome</th><th>E-mail</th><th>Telefone</th><th>Data Inscrição</th>';
    }
}

// Função global para deletar evento
async function deleteEvent(id) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
        try {
            await db.collection('events').doc(id).delete();
            document.location.reload();
        } catch (error) {
            console.error('Erro ao deletar evento:', error);
            alert('Erro ao deletar evento. Tente novamente.');
        }
    }
}

// Expor funções globalmente
window.viewAttendees = viewAttendees;
window.generateFrequencyReport = generateFrequencyReport;
window.closeModal = closeModal;
window.deleteEvent = deleteEvent;
