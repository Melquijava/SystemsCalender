/* public/script.js (Versão Final com Descrição) */
document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();
    let events = [];
    let currentUser = null;
    let selectedColor = '#00B4D8';
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
        eventModal: document.getElementById('event-modal'),
        saveEventBtn: document.getElementById('save-event-btn'),
        closeModalBtns: document.querySelectorAll('.close-btn'),
        quickSaveBtn: document.getElementById('quick-save-btn'),
        colorPalette: document.querySelector('.color-palette'),
        newEventBtn: document.getElementById('new-event-btn'),
        eventList: document.getElementById('event-list'),
        statsContent: document.getElementById('stats-content'),
    };
    const getTextColorForBg = (hexColor) => {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#0B132B' : '#FFFFFF';
    };
    const updateUI = () => {
        currentUser = JSON.parse(sessionStorage.getItem('systembsi_user'));
        if (currentUser) {
            dom.authContainer.classList.remove('active');
            dom.appContainer.classList.add('active');
            dom.welcomeUser.textContent = `Olá, ${currentUser.username}`;
            document.getElementById('event-creator').value = currentUser.username;
            fetchAndRenderAll();
        } else {
            dom.appContainer.classList.remove('active');
            dom.authContainer.classList.add('active');
        }
    };
    const fetchAndRenderAll = async () => {
        try {
            const response = await fetch('/events');
            events = await response.json();
            renderCalendar();
            renderAllEventsList();
            renderStatistics();
        } catch (error) { console.error("Erro ao buscar dados:", error); }
    };
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        dom.currentMonthYear.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long' })} de ${year}`;
        const dayNamesHTML = `<div class="day-name">Dom</div><div class="day-name">Seg</div><div class="day-name">Ter</div><div class="day-name">Qua</div><div class="day-name">Qui</div><div class="day-name">Sex</div><div class="day-name">Sáb</div>`;
        dom.calendarGrid.innerHTML = dayNamesHTML;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDayOfMonth; i++) { dom.calendarGrid.insertAdjacentHTML('beforeend', '<div class="day other-month"></div>'); }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'day';
            dayCell.dataset.date = dateStr;
            dayCell.innerHTML = `<div class="day-number">${day}</div>`;
            if (new Date(dateStr).toDateString() === new Date().toDateString()) { dayCell.classList.add('today'); }
            const eventsForDay = events.filter(e => {
                const eventStart = new Date(e.startDate + 'T00:00:00');
                const eventEnd = new Date(e.endDate + 'T00:00:00');
                const currentDay = new Date(dateStr + 'T00:00:00');
                return currentDay >= eventStart && currentDay <= eventEnd;
            });
            if (eventsForDay.length > 0) { dayCell.classList.add('has-events'); }
            eventsForDay.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = 'event';
                eventEl.textContent = event.title;
                eventEl.style.backgroundColor = event.color;
                eventEl.style.color = getTextColorForBg(event.color);
                dayCell.appendChild(eventEl);
            });
            dayCell.addEventListener('click', () => openEventModal(dateStr));
            dom.calendarGrid.appendChild(dayCell);
        }
    };
    const renderAllEventsList = () => {
        dom.eventList.innerHTML = '';
        if (events.length === 0) {
            dom.eventList.innerHTML = '<p style="color: var(--texto-secundario);">Nenhum evento agendado.</p>';
            return;
        }
        const sortedEvents = [...events].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
        sortedEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-item';
            item.innerHTML = `
                <div class="event-info" style="border-left: 3px solid ${event.color}; padding-left: 10px;">
                    <strong>${event.title}</strong>
                    ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                    <span>${new Date(event.startDate+'T00:00').toLocaleDateString('pt-BR')} por: ${event.createdBy}</span>
                </div>
                <button class="delete-event-btn" data-id="${event.id}">Excluir</button>`;
            dom.eventList.appendChild(item);
        });
    };
    const renderStatistics = () => {
        const totalEvents = events.length;
        const members = [...new Set(events.map(e => e.createdBy))];
        dom.statsContent.innerHTML = `<p><strong>Eventos Totais:</strong> ${totalEvents}</p><p><strong>Membros Ativos:</strong> ${members.length}</p>`;
    };
    const openEventModal = (date) => {
        dom.eventModal.classList.add('active');
        document.getElementById('start-date').value = date;
        document.getElementById('end-date').value = date;
        document.getElementById('event-title').value = '';
        document.getElementById('event-description').value = '';
        document.getElementById('event-color').value = selectedColor;
    };
    dom.showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); dom.loginForm.classList.remove('active'); dom.registerForm.classList.add('active'); });
    dom.showLoginLink.addEventListener('click', (e) => { e.preventDefault(); dom.registerForm.classList.remove('active'); dom.loginForm.classList.add('active'); });
    dom.registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        if (!username || !password) return alert('Nome de usuário e senha são obrigatórios.');
        const response = await fetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await response.json();
        alert(data.message);
        if (response.ok) { dom.registerForm.classList.remove('active'); dom.loginForm.classList.add('active'); }
    });
    dom.loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        if (!username || !password) return alert('Nome de usuário e senha são obrigatórios.');
        const response = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await response.json();
        if (response.ok) { sessionStorage.setItem('systembsi_user', JSON.stringify(data.user)); updateUI(); } else { alert(data.message); }
    });
    dom.logoutBtn.addEventListener('click', () => { sessionStorage.removeItem('systembsi_user'); updateUI(); });
    dom.prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    dom.nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    dom.todayBtn.addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });
    dom.closeModalBtns.forEach(btn => btn.addEventListener('click', () => dom.eventModal.classList.remove('active')));
    dom.colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-box')) {
            dom.colorPalette.querySelector('.selected')?.classList.remove('selected');
            e.target.classList.add('selected');
            selectedColor = e.target.dataset.color;
        }
    });
    dom.quickSaveBtn.addEventListener('click', async () => {
        const title = document.getElementById('quick-event-title').value;
        const date = document.getElementById('quick-event-date').value;
        if (!title || !date) return alert('Título e data são obrigatórios para o evento rápido.');
        const eventData = { title, startDate: date, endDate: date, color: selectedColor, createdBy: currentUser.username, description: '' };
        const response = await fetch('/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
        if (response.ok) {
            document.getElementById('quick-event-title').value = '';
            document.getElementById('quick-event-date').value = '';
            fetchAndRenderAll();
        } else { alert('Erro ao salvar evento rápido.'); }
    });
    dom.newEventBtn.addEventListener('click', () => openEventModal(new Date().toISOString().split('T')[0]));
    dom.saveEventBtn.addEventListener('click', async () => {
        const eventData = { title: document.getElementById('event-title').value, description: document.getElementById('event-description').value, color: document.getElementById('event-color').value, startDate: document.getElementById('start-date').value, endDate: document.getElementById('end-date').value, createdBy: document.getElementById('event-creator').value, };
        if (!eventData.title || !eventData.startDate || !eventData.endDate) return alert('Título e datas são obrigatórios.');
        const response = await fetch('/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
        if(response.ok) { dom.eventModal.classList.remove('active'); fetchAndRenderAll(); } else { alert('Erro ao salvar evento.'); }
    });
    dom.eventList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-event-btn')) {
            const eventId = e.target.dataset.id;
            if (confirm('Tem certeza que deseja excluir este evento?')) {
                const response = await fetch(`/events/${eventId}`, { method: 'DELETE' });
                if (response.ok) { fetchAndRenderAll(); } else { alert('Falha ao excluir evento.'); }
            }
        }
    });
    updateUI();
});