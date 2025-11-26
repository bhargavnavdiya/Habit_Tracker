// Habit Tracker Application
class HabitTracker {
    constructor() {
        this.currentDate = new Date();
        this.habits = this.loadHabits();
        this.data = this.loadData();
        this.charts = {};
        this.useBackend = false; // Set to true if backend is available
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderMonthlyView();
        this.updateSummary();
        this.checkBackend();
    }

    async checkBackend() {
        try {
            const response = await fetch('/api/data');
            if (response.ok) {
                this.useBackend = true;
                await this.loadDataFromBackend();
            }
        } catch (error) {
            console.log('Backend not available, using localStorage');
        }
    }

    async loadDataFromBackend() {
        try {
            const response = await fetch('/api/data');
            const backendData = await response.json();
            if (backendData.habits) this.habits = backendData.habits;
            if (backendData.data) this.data = backendData.data;
            this.renderMonthlyView();
            this.updateSummary();
        } catch (error) {
            console.error('Error loading from backend:', error);
        }
    }

    async saveDataToBackend() {
        if (!this.useBackend) return;
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habits: this.habits, data: this.data })
            });
        } catch (error) {
            console.error('Error saving to backend:', error);
        }
    }

    // Default habits matching the images
    getDefaultHabits() {
        return [
            { id: 1, name: "Wake up at 05:00", emoji: "⏰" },
            { id: 2, name: "Gym", emoji: "💪" },
            { id: 3, name: "Reading / Learning", emoji: "📖" },
            { id: 4, name: "Day Planning", emoji: "🗓️" },
            { id: 5, name: "Budget Tracking", emoji: "💰" },
            { id: 6, name: "Project Work", emoji: "🎯" },
            { id: 7, name: "No Alcohol", emoji: "🍾" },
            { id: 8, name: "Social Media Detox", emoji: "🌿" },
            { id: 9, name: "Goal Journaling", emoji: "📔" },
            { id: 10, name: "Cold Shower", emoji: "🚿" }
        ];
    }

    loadHabits() {
        const stored = localStorage.getItem('habits');
        if (stored) {
            return JSON.parse(stored);
        }
        return this.getDefaultHabits();
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
        this.saveDataToBackend();
    }

    loadData() {
        const stored = localStorage.getItem('habitData');
        if (stored) {
            return JSON.parse(stored);
        }
        return {};
    }

    saveData() {
        localStorage.setItem('habitData', JSON.stringify(this.data));
        this.saveDataToBackend();
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    normalizeDate(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    isSameDay(dateA, dateB) {
        return (
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate()
        );
    }

    isTodayDate(date) {
        const today = this.normalizeDate(new Date());
        return this.isSameDay(this.normalizeDate(date), today);
    }

    isPastDate(date) {
        const today = this.normalizeDate(new Date());
        return this.normalizeDate(date) < today;
    }

    isFutureDate(date) {
        const today = this.normalizeDate(new Date());
        return this.normalizeDate(date) > today;
    }

    parseDateKey(dateKey) {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarFab = document.getElementById('sidebar-fab');

        const setMobileSidebarState = (isOpen) => {
            if (isOpen) {
                document.body.classList.add('mobile-sidebar-open');
            } else {
                document.body.classList.remove('mobile-sidebar-open');
            }
        };

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    const isActive = sidebar.classList.toggle('active');
                    setMobileSidebarState(isActive);
                } else {
                    document.body.classList.toggle('sidebar-collapsed');
                }
            });
        }

        if (sidebarFab) {
            sidebarFab.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('active');
                    setMobileSidebarState(true);
                } else {
                    document.body.classList.remove('sidebar-collapsed');
                }
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const clickedToggle = sidebarToggle && sidebarToggle.contains(e.target);
            const clickedFab = sidebarFab && sidebarFab.contains(e.target);
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !clickedToggle && !clickedFab) {
                sidebar.classList.remove('active');
                setMobileSidebarState(false);
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    setMobileSidebarState(false);
                }
            });
        });

        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateMonthPicker();
            this.renderMonthlyView();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateMonthPicker();
            this.renderMonthlyView();
        });

        // Month picker
        const monthPicker = document.getElementById('month-picker');
        monthPicker.addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            this.currentDate = new Date(year, month - 1, 1);
            this.renderMonthlyView();
        });

        // Go to today
        document.getElementById('go-to-today').addEventListener('click', () => {
            this.currentDate = new Date();
            this.updateMonthPicker();
            this.renderMonthlyView();
        });

        // Year navigation
        document.getElementById('prev-year').addEventListener('click', () => {
            this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
            this.renderYearlyView();
        });

        document.getElementById('next-year').addEventListener('click', () => {
            this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
            this.renderYearlyView();
        });

        // Add habit
        document.getElementById('add-habit-btn').addEventListener('click', () => {
            this.openAddHabitModal();
        });

        document.getElementById('add-habit-settings-btn').addEventListener('click', () => {
            this.openAddHabitModal();
        });

        document.getElementById('save-habit-btn').addEventListener('click', () => {
            this.saveNewHabit();
        });

        // Modal
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        document.getElementById('add-habit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-habit-modal') {
                this.closeModal();
            }
        });

        // Data management
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clear-data-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                this.clearData();
            }
        });

        // Event delegation for checkboxes (fixes clicking issue)
        document.getElementById('tracker-grid').addEventListener('click', (e) => {
            const target = e.target.closest('.habit-checkbox');
            if (!target || target.classList.contains('future')) return;

            const habitId = parseInt(target.dataset.habitId);
            const dateKey = target.dataset.date;
            this.toggleHabit(habitId, dateKey);
        });
    }

    updateMonthPicker() {
        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        document.getElementById('month-picker').value = `${year}-${month}`;
    }

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        document.getElementById(`${viewName}-view`).classList.add('active');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        if (viewName === 'monthly') {
            this.renderMonthlyView();
        } else if (viewName === 'yearly') {
            this.renderYearlyView();
        } else if (viewName === 'settings') {
            this.renderSettings();
        }
    }

    renderMonthlyView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('current-month-year').textContent = 
            `${this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

        this.updateMonthPicker();
        this.renderTrackerGrid(year, month);
        this.updateSummary();
        this.renderCharts(year, month);
        this.renderMentalState(year, month);
        this.renderAnalysis();
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    renderTrackerGrid(year, month) {
        const grid = document.getElementById('tracker-grid');
        const daysInMonth = this.getDaysInMonth(year, month);
        const today = this.normalizeDate(new Date());
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        const weekBlocks = [];
        for (let start = 1; start <= daysInMonth; start += 7) {
            const span = Math.min(7, daysInMonth - start + 1);
            weekBlocks.push({ label: `Week ${weekBlocks.length + 1}`, span });
        }

        let html = '<div class="grid-week-row">';
        html += '<div class="week-label-cell">Weeks</div>';
        weekBlocks.forEach((block, index) => {
            html += `<div class="week-block week-color-${(index % 4) + 1}" style="grid-column: span ${block.span};">${block.label}</div>`;
        });
        html += '</div>';

        html += '<div class="grid-header">';
        html += '<div class="day-header">Habit</div>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = this.isTodayDate(date);
            const isPast = this.isPastDate(date);
            const isFuture = this.isFutureDate(date);
            const dayClasses = ['day-header'];
            if (isToday) dayClasses.push('today');
            if (isPast) dayClasses.push('past');
            if (isFuture) dayClasses.push('future');
            
            html += `<div class="${dayClasses.join(' ')}">${dayName}<br>${day}</div>`;
        }
        html += '</div>';

        this.habits.forEach(habit => {
            html += '<div class="grid-row">';
            html += `<div class="habit-name">${habit.emoji} ${habit.name}</div>`;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                const isChecked = this.isHabitCompleted(dateKey, habit.id);
                const isToday = this.isTodayDate(date);
                const isPast = this.isPastDate(date);
                const isFuture = this.isFutureDate(date);
                const checkboxClasses = ['habit-checkbox'];
                if (isChecked) checkboxClasses.push('checked');
                if (isToday) checkboxClasses.push('today');
                if (isPast) checkboxClasses.push('past');
                if (isFuture) checkboxClasses.push('future');
                
                html += `<div class="${checkboxClasses.join(' ')}" 
                    data-habit-id="${habit.id}" 
                    data-date="${dateKey}">
                    ${isChecked ? '✓' : ''}
                </div>`;
            }
            
            html += '</div>';
        });

        grid.innerHTML = html;
    }

    isHabitCompleted(dateKey, habitId) {
        if (!this.data[dateKey]) return false;
        return this.data[dateKey].habits && this.data[dateKey].habits.includes(habitId);
    }

    toggleHabit(habitId, dateKey) {
        if (this.isFutureDate(this.parseDateKey(dateKey))) {
            return;
        }

        if (!this.data[dateKey]) {
            this.data[dateKey] = { habits: [], mood: null, motivation: null };
        }
        if (!this.data[dateKey].habits) {
            this.data[dateKey].habits = [];
        }

        const index = this.data[dateKey].habits.indexOf(habitId);
        if (index > -1) {
            this.data[dateKey].habits.splice(index, 1);
        } else {
            this.data[dateKey].habits.push(habitId);
        }

        this.saveData();
        this.renderMonthlyView();
        this.updateSummary();
    }

    updateSummary() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = this.getDaysInMonth(year, month);
        
        let totalCompleted = 0;
        let totalPossible = this.habits.length * daysInMonth;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            if (this.data[dateKey] && this.data[dateKey].habits) {
                totalCompleted += this.data[dateKey].habits.length;
            }
        }

        document.getElementById('total-habits').textContent = this.habits.length;
        document.getElementById('completed-habits').textContent = totalCompleted;
        
        let todaysProgress = 0;
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth()) {
            const todayKey = this.getDateKey(today);
            const todayCompleted = (this.data[todayKey]?.habits?.length) || 0;
            todaysProgress = this.habits.length ? (todayCompleted / this.habits.length) * 100 : 0;
        }
        document.getElementById('progress-percent').textContent = `${todaysProgress.toFixed(0)}%`;
        document.getElementById('overall-progress-bar').style.width = `${todaysProgress}%`;
        const progressLabel = document.getElementById('progress-bar-label');
        if (progressLabel) {
            progressLabel.textContent = `${todaysProgress.toFixed(0)}%`;
        }
    }

    renderCharts(year, month) {
        const daysInMonth = this.getDaysInMonth(year, month);
        const progressData = [];
        const labels = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            labels.push(`Day ${day}`);
            
            let completed = 0;
            if (this.data[dateKey] && this.data[dateKey].habits) {
                completed = this.data[dateKey].habits.length;
            }
            progressData.push((completed / this.habits.length) * 100);
        }

        const ctx = document.getElementById('progress-chart');
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Completion %',
                    data: progressData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Habit Completion Progress',
                        font: { size: 16, weight: 'bold' },
                        padding: { top: 10, bottom: 20 }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Completion: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Day of Month',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Completion Percentage (%)',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }

    renderMentalState(year, month) {
        const grid = document.getElementById('mental-state-grid');
        const daysInMonth = this.getDaysInMonth(year, month);
        
        let html = '<div class="mental-state-row mental-state-header">';
        html += '<div class="mental-state-label">Date</div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            html += `<div><span>${dayName}</span><br><strong>${day}</strong></div>`;
        }
        html += '</div>';

        html += '<div class="mental-state-row">';
        html += '<div class="mental-state-label">Mood</div>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const mood = this.data[dateKey]?.mood || '';
            const isFuture = this.isFutureDate(date);
            
            html += `<select class="mental-state-select ${isFuture ? 'future' : ''}" 
                data-type="mood" 
                data-date="${dateKey}"
                onchange="tracker.updateMentalState('${dateKey}', 'mood', this.value)"
                ${isFuture ? 'disabled' : ''}>
                <option value="">-</option>
                ${[1,2,3,4,5,6,7,8,9,10].map(n => 
                    `<option value="${n}" ${mood == n ? 'selected' : ''}>${n}</option>`
                ).join('')}
            </select>`;
        }
        html += '</div>';

        html += '<div class="mental-state-row">';
        html += '<div class="mental-state-label">Motivation</div>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const motivation = this.data[dateKey]?.motivation || '';
            const isFuture = this.isFutureDate(date);
            
            html += `<select class="mental-state-select ${isFuture ? 'future' : ''}" 
                data-type="motivation" 
                data-date="${dateKey}"
                onchange="tracker.updateMentalState('${dateKey}', 'motivation', this.value)"
                ${isFuture ? 'disabled' : ''}>
                <option value="">-</option>
                ${[1,2,3,4,5,6,7,8,9,10].map(n => 
                    `<option value="${n}" ${motivation == n ? 'selected' : ''}>${n}</option>`
                ).join('')}
            </select>`;
        }
        html += '</div>';

        grid.innerHTML = html;
        this.renderMentalStateChart(year, month);
    }

    updateMentalState(dateKey, type, value) {
        if (this.isFutureDate(this.parseDateKey(dateKey))) {
            return;
        }
        if (!this.data[dateKey]) {
            this.data[dateKey] = { habits: [], mood: null, motivation: null };
        }
        this.data[dateKey][type] = value ? parseInt(value) : null;
        this.saveData();
        this.renderMentalState(this.currentDate.getFullYear(), this.currentDate.getMonth());
    }

    renderMentalStateChart(year, month) {
        const daysInMonth = this.getDaysInMonth(year, month);
        const moodData = [];
        const motivationData = [];
        const labels = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            labels.push(`Day ${day}`);
            
            moodData.push(this.data[dateKey]?.mood || null);
            motivationData.push(this.data[dateKey]?.motivation || null);
        }

        const ctx = document.getElementById('mental-state-chart');
        if (this.charts.mentalState) {
            this.charts.mentalState.destroy();
        }

        this.charts.mentalState = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Mood (1-10)',
                        data: moodData,
                        borderColor: '#f26ca7',
                        backgroundColor: 'rgba(242, 108, 167, 0.2)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    },
                    {
                        label: 'Motivation (1-10)',
                        data: motivationData,
                        borderColor: '#8f7bff',
                        backgroundColor: 'rgba(143, 123, 255, 0.2)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Mental State Tracking (Mood & Motivation)',
                        font: { size: 16, weight: 'bold' },
                        padding: { top: 10, bottom: 20 }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y !== null ? context.parsed.y : 'N/A'}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Day of Month',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Score (1-10)',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderAnalysis() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = this.getDaysInMonth(year, month);
        const table = document.getElementById('analysis-table');
        
        let html = '<div class="analysis-row">';
        html += '<div>Habit</div><div>Goal</div><div>Actual</div><div>Progress</div>';
        html += '</div>';

        this.habits.forEach(habit => {
            let completed = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                if (this.isHabitCompleted(dateKey, habit.id)) {
                    completed++;
                }
            }
            
            const goal = daysInMonth;
            const progress = goal > 0 ? (completed / goal) * 100 : 0;
            
            html += '<div class="analysis-row">';
            html += `<div class="analysis-habit">${habit.emoji} ${habit.name}</div>`;
            html += `<div class="analysis-goal">${goal}</div>`;
            html += `<div class="analysis-actual">${completed}</div>`;
            html += `<div class="analysis-progress">`;
            html += `<div class="analysis-progress-bar" style="width: ${progress}%">${progress.toFixed(0)}%</div>`;
            html += `</div>`;
            html += '</div>';
        });

        table.innerHTML = html;
    }

    renderYearlyView() {
        const year = this.currentDate.getFullYear();
        document.getElementById('current-year').textContent = year;
        
        const monthlyData = [];
        const labels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
        
        // Calculate data for each month (Nov of previous year to Oct of current year)
        for (let i = 0; i < 12; i++) {
            let monthYear = year;
            let month = (11 + i) % 12; // Start from November (11)
            if (i < 2) monthYear = year - 1; // Nov, Dec are previous year
            
            const daysInMonth = this.getDaysInMonth(monthYear, month);
            let totalCompleted = 0;
            let totalPossible = this.habits.length * daysInMonth;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(monthYear, month, day);
                const dateKey = this.getDateKey(date);
                if (this.data[dateKey] && this.data[dateKey].habits) {
                    totalCompleted += this.data[dateKey].habits.length;
                }
            }
            
            const progress = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;
            monthlyData.push(progress);
        }

        // Render chart
        const ctx = document.getElementById('yearly-chart');
        if (this.charts.yearly) {
            this.charts.yearly.destroy();
        }

        this.charts.yearly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Progress %',
                    data: monthlyData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Yearly Habit Completion Progress',
                        font: { size: 18, weight: 'bold' },
                        padding: { top: 10, bottom: 30 }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Progress: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month',
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Completion Percentage (%)',
                            font: { size: 14, weight: 'bold' }
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            stepSize: 20
                        }
                    }
                }
            }
        });

        // Render monthly stats grid
        this.renderMonthlyStatsGrid(year, monthlyData, labels);
    }

    renderMonthlyStatsGrid(year, monthlyData, labels) {
        const grid = document.getElementById('monthly-stats-grid');
        const monthNames = ['November', 'December', 'January', 'February', 'March', 'April',
                           'May', 'June', 'July', 'August', 'September', 'October'];
        
        let html = '';
        
        for (let i = 0; i < 12; i++) {
            let monthYear = year;
            let month = (11 + i) % 12;
            if (i < 2) monthYear = year - 1;
            
            const daysInMonth = this.getDaysInMonth(monthYear, month);
            let totalCompleted = 0;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(monthYear, month, day);
                const dateKey = this.getDateKey(date);
                if (this.data[dateKey] && this.data[dateKey].habits) {
                    totalCompleted += this.data[dateKey].habits.length;
                }
            }
            
            html += '<div class="month-stat-card">';
            html += `<h4>${monthNames[i]}</h4>`;
            html += '<div class="stat-item">';
            html += '<span class="stat-label">Number of Habits:</span>';
            html += `<span class="stat-value">${this.habits.length}</span>`;
            html += '</div>';
            html += '<div class="stat-item">';
            html += '<span class="stat-label">Completed:</span>';
            html += `<span class="stat-value">${totalCompleted}</span>`;
            html += '</div>';
            html += '<div class="stat-item">';
            html += '<span class="stat-label">Progress:</span>';
            html += `<span class="stat-value">${monthlyData[i].toFixed(2)}%</span>`;
            html += '</div>';
            html += '</div>';
        }
        
        grid.innerHTML = html;
    }

    renderSettings() {
        const list = document.getElementById('habits-list');
        let html = '';
        
        this.habits.forEach(habit => {
            html += '<div class="habit-item">';
            html += `<span class="habit-item-name">${habit.emoji} ${habit.name}</span>`;
            html += '<div class="habit-item-actions">';
            html += `<button class="btn-danger" onclick="tracker.deleteHabit(${habit.id})">Delete</button>`;
            html += '</div>';
            html += '</div>';
        });
        
        list.innerHTML = html;
    }

    openAddHabitModal() {
        document.getElementById('add-habit-modal').classList.add('active');
        document.getElementById('habit-name-input').value = '';
        document.getElementById('habit-emoji-input').value = '';
        document.getElementById('habit-goal-input').value = '1';
    }

    closeModal() {
        document.getElementById('add-habit-modal').classList.remove('active');
    }

    saveNewHabit() {
        const name = document.getElementById('habit-name-input').value.trim();
        const emoji = document.getElementById('habit-emoji-input').value.trim() || '✓';
        
        if (!name) {
            alert('Please enter a habit name');
            return;
        }
        
        const newId = Math.max(...this.habits.map(h => h.id), 0) + 1;
        this.habits.push({ id: newId, name, emoji });
        this.saveHabits();
        this.closeModal();
        this.renderMonthlyView();
        this.renderSettings();
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveHabits();
            this.renderMonthlyView();
            this.renderSettings();
        }
    }

    exportData() {
        const data = {
            habits: this.habits,
            data: this.data,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.habits) this.habits = imported.habits;
                if (imported.data) this.data = imported.data;
                this.saveHabits();
                this.saveData();
                this.renderMonthlyView();
                this.renderSettings();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    clearData() {
        this.data = {};
        this.saveData();
        this.renderMonthlyView();
        alert('All data cleared!');
    }
}

// Initialize the app
const tracker = new HabitTracker();
