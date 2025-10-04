/* public/script.js */
document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DA APLICAÇÃO ---
    let currentDate = new Date();
    let events = [];
    let currentUser = null;

    // --- SELETORES DO DOM ---
    const dom = {
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        showRegisterLink: document.getElementById('show-register-link'),
        showLoginLink: document.getElementById('show-login-link'),
        loginBtn: document.getElementById('login-btn'),
        registerBtn: document.getElementById('register-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        welcomeUser: document.getElementById('welcome-user'),
        calendarGrid: document.getElementById('calendar-grid'),
        currentMonthYear: document.getElementById('current-month-year'),
        prevMonthBtn: document.getElementById('prev-month-btn'),
        nextMonthBtn: document.getElementById('next-month-btn'),
        todayBtn: document.getElementById('today-btn'),
        dashboardBtn: document.getElementById('dashboard-btn'),
        eventModal: document.getElementById('event-modal'),
        dashboardModal: document.getElementById('dashboard-modal'),
        saveEventBtn: document.getElementById('save-event-btn'),
        closeModalBtns: document.querySelectorAll('.close-btn'),
        eventList: document.getElementById('event-list'),
    };

    // --- FUNÇÕES DE LÓGICA ---

    const toggleAuthForms = () => {
        dom.loginForm.classList.toggle('active');
        dom.registerForm.classList.toggle('active');
    };

    const updateUI = () => {
        currentUser = JSON.parse(sessionStorage.getItem('systembsi_user'));
        if (currentUser) {
            dom.authContainer.classList.remove('active');
            dom.appContainer.classList.add('active');
            dom.welcomeUser.textContent = `Olá, ${currentUser.username}`;
            document.getElementById('event-creator').value = currentUser.username;
            fetchAndRender();
        } else {
            dom.appContainer.classList.remove('active');
            dom.authContainer.classList.add('active');
        }
    };
    
    const fetchAndRender = async () => {
        try {
            const response = await fetch('/events');
            events = await response.json();
            renderCalendar();
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);
        }
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        dom.currentMonthYear.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long' })} de ${year}`;

        // Limpa o grid, mantendo os nomes dos dias
        dom.calendarGrid.innerHTML = `
            <div class="day-name">Dom</div><div class="day-name">Seg</div><div class="day-name">Ter</div>
            <div class="day-name">Qua</div><div class="day-name">Qui</div><div class="day-name">Sex</div><div class="day-name">Sáb</div>`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Células vazias para os dias do mês anterior
        for (let i = 0; i < firstDayOfMonth; i++) {
            dom.calendarGrid.insertAdjacentHTML('beforeend', '<div class="day other-month"></div>');
        }

        // Células dos dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'day';
            dayCell.dataset.date = dateStr;
            dayCell.innerHTML = `<div class="day-number">${day}</div>`;

            if (new Date(dateStr).toDateString() === new Date().toDateString()) {
                dayCell.classList.add('today');
            }
            
            // Adicionar eventos ao dia
            const eventsForDay = events.filter(e => {
                const eventStart = new Date(e.startDate + 'T00:00:00');
                const eventEnd = new Date(e.endDate + 'T00:00:00');
                const currentDay = new Date(dateStr + 'T00:00:00');
                return currentDay >= eventStart && currentDay <= eventEnd;
            });

            eventsForDay.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = 'event';
                eventEl.style.backgroundColor = event.color;
                eventEl.textContent = event.title;
                dayCell.appendChild(eventEl);
            });
            
            dayCell.addEventListener('click', () => openEventModal(dateStr));
            dom.calendarGrid.appendChild(dayCell);
        }
    };

    const openEventModal = (date) => {
        dom.eventModal.classList.add('active');
        document.getElementById('start-date').value = date;
        document.getElementById('end-date').value = date;
        document.getElementById('event-title').value = '';
        document.getElementById('event-description').value = '';
    };

    const renderDashboard = () => {
        dom.eventList.innerHTML = '';
        if (events.length === 0) {
            dom.eventList.innerHTML = '<p>Nenhum evento cadastrado.</p>';
            return;
        }

        const sortedEvents = [...events].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));

        sortedEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-item';
            item.style.borderLeftColor = event.color;
            item.innerHTML = `
                <div class="event-info">
                    <strong>${event.title}</strong>
                    <p>${new Date(event.startDate+'T00:00').toLocaleDateString()} - ${new Date(event.endDate+'T00:00').toLocaleDateString()}</p>
                    <span>Criado por: ${event.createdBy}</span>
                </div>
                <button class="delete-event-btn" data-id="${event.id}">Excluir</button>`;
            dom.eventList.appendChild(item);
        });
    };
    
    // --- EVENT LISTENERS ---
    dom.showRegisterLink.addEventListener('click', toggleAuthForms);
    dom.showLoginLink.addEventListener('click', toggleAuthForms);
    
    dom.registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) toggleAuthForms();
    });

    dom.loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            sessionStorage.setItem('systembsi_user', JSON.stringify(data.user));
            updateUI();
        } else {
            alert(data.message);
        }
    });

    dom.logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('systembsi_user');
        updateUI();
    });

    dom.prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    dom.nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    dom.todayBtn.addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });

    dom.saveEventBtn.addEventListener('click', async () => {
        const eventData = {
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            color: document.getElementById('event-color').value,
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value,
            createdBy: document.getElementById('event-creator').value,
        };
        
        if (!eventData.title || !eventData.startDate || !eventData.endDate) {
            return alert('Título e datas são obrigatórios.');
        }

        const response = await fetch('/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if(response.ok) {
            dom.eventModal.classList.remove('active');
            fetchAndRender();
        } else {
            alert('Erro ao salvar evento.');
        }
    });

    dom.dashboardBtn.addEventListener('click', () => {
        renderDashboard();
        dom.dashboardModal.classList.add('active');
    });

    dom.eventList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-event-btn')) {
            const eventId = e.target.dataset.id;
            const response = await fetch(`/events/${eventId}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchAndRender();
                renderDashboard();
            } else {
                alert('Falha ao excluir evento.');
            }
        }
    });
    
    dom.closeModalBtns.forEach(btn => btn.addEventListener('click', () => {
        dom.eventModal.classList.remove('active');
        dom.dashboardModal.classList.remove('active');
    }));

    // --- INICIALIZAÇÃO ---
    updateUI();
});