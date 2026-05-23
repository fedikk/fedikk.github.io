// Trip Expense Tracker - Main JavaScript

class ExpenseTracker {
    constructor() {
        this.data = {
            trip: {
                name: '',
                destination: '',
                startDate: '',
                endDate: '',
                budget: 0
            },
            participants: [],
            expenses: []
        };
        
        this.charts = {
            category: null,
            time: null,
            person: null
        };
        
        this.editingExpenseId = null;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.initTheme();
        this.initEventListeners();
        this.initUI();
        this.updateDashboard();
        this.renderParticipants();
        this.renderExpenses();
        this.updateCharts();
        this.calculateSettlements();
    }
    
    // LocalStorage Methods
    saveData() {
        localStorage.setItem('tripExpenseTracker', JSON.stringify(this.data));
    }
    
    loadData() {
        const saved = localStorage.getItem('tripExpenseTracker');
        if (saved) {
            this.data = JSON.parse(saved);
        }
    }
    
    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
    
    // Event Listeners
    initEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateTo(section);
            });
        });
        
        // Trip form
        document.getElementById('tripForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTripInfo();
        });
        
        // Add participant
        document.getElementById('addParticipantBtn').addEventListener('click', () => {
            this.openModal('participantModal');
        });
        
        document.getElementById('closeParticipantModal').addEventListener('click', () => {
            this.closeModal('participantModal');
        });
        
        document.getElementById('closeParticipantExpensesModal').addEventListener('click', () => {
            this.closeModal('participantExpensesModal');
        });
        
        document.getElementById('participantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addParticipant();
        });
        
        // Add expense
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.openExpenseModal();
        });
        
        document.getElementById('floatingAddBtn').addEventListener('click', () => {
            this.openExpenseModal();
        });
        
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal('expenseModal');
        });
        
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });
        
        // Expense search and filter
        document.getElementById('expenseSearch').addEventListener('input', (e) => {
            this.filterExpenses(e.target.value, document.getElementById('expenseFilter').value);
        });
        
        document.getElementById('expenseFilter').addEventListener('change', (e) => {
            this.filterExpenses(document.getElementById('expenseSearch').value, e.target.value);
        });
        
        // Export CSV
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToCSV();
        });
        
        // Export/Import JSON Backup
        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportToJson();
        });
        
        document.getElementById('importJsonBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importFromJson(e);
        });
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }
    
    // UI Initialization
    initUI() {
        // Set today's date as default for expense date
        document.getElementById('expenseDate').valueAsDate = new Date();
        
        // Load trip info into form
        if (this.data.trip.name) {
            document.getElementById('tripName').value = this.data.trip.name;
        }
        if (this.data.trip.destination) {
            document.getElementById('tripDestination').value = this.data.trip.destination;
        }
        if (this.data.trip.startDate) {
            document.getElementById('tripStartDate').value = this.data.trip.startDate;
        }
        if (this.data.trip.endDate) {
            document.getElementById('tripEndDate').value = this.data.trip.endDate;
        }
        if (this.data.trip.budget) {
            document.getElementById('tripBudget').value = this.data.trip.budget;
        }
    }
    
    // Navigation
    navigateTo(section) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });
        
        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === section) {
                sec.classList.add('active');
            }
        });
        
        // Update charts when navigating to analytics
        if (section === 'analytics') {
            setTimeout(() => this.updateCharts(), 100);
        }
    }
    
    // Modal Methods
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    openExpenseModal() {
        if (this.data.participants.length === 0) {
            this.showToast('Please add participants first', 'error');
            this.navigateTo('participants');
            return;
        }
        
        this.editingExpenseId = null;
        document.querySelector('#expenseModal .modal-header h2').textContent = 'Add Expense';
        
        // Populate paid by dropdown
        const paidBySelect = document.getElementById('expensePaidBy');
        paidBySelect.innerHTML = '<option value="">Select who paid</option>';
        this.data.participants.forEach(p => {
            paidBySelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
        
        // Populate split between checkboxes
        const splitBetween = document.getElementById('splitBetween');
        splitBetween.innerHTML = '';
        this.data.participants.forEach(p => {
            splitBetween.innerHTML += `
                <label class="checkbox-item">
                    <input type="checkbox" value="${p.id}" checked>
                    <span>${p.name}</span>
                </label>
            `;
        });
        
        this.openModal('expenseModal');
    }
    
    editExpense(id) {
        const expense = this.data.expenses.find(e => e.id === id);
        if (!expense) {
            this.showToast('Expense not found', 'error');
            return;
        }
        
        this.editingExpenseId = id;
        document.querySelector('#expenseModal .modal-header h2').textContent = 'Edit Expense';
        
        // Populate paid by dropdown
        const paidBySelect = document.getElementById('expensePaidBy');
        paidBySelect.innerHTML = '<option value="">Select who paid</option>';
        this.data.participants.forEach(p => {
            paidBySelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
        
        // Populate split between checkboxes
        const splitBetween = document.getElementById('splitBetween');
        splitBetween.innerHTML = '';
        this.data.participants.forEach(p => {
            const isChecked = expense.splitBetween.includes(p.id) ? 'checked' : '';
            splitBetween.innerHTML += `
                <label class="checkbox-item">
                    <input type="checkbox" value="${p.id}" ${isChecked}>
                    <span>${p.name}</span>
                </label>
            `;
        });
        
        // Fill form with expense data
        document.getElementById('expenseTitle').value = expense.title;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expensePaidBy').value = expense.paidBy;
        document.getElementById('expenseNotes').value = expense.notes || '';
        document.getElementById('expenseLink').value = expense.link || '';
        
        this.openModal('expenseModal');
    }
    
    // Trip Info Methods
    saveTripInfo() {
        this.data.trip = {
            name: document.getElementById('tripName').value,
            destination: document.getElementById('tripDestination').value,
            startDate: document.getElementById('tripStartDate').value,
            endDate: document.getElementById('tripEndDate').value,
            budget: parseFloat(document.getElementById('tripBudget').value) || 0
        };
        
        this.saveData();
        this.updateDashboard();
        this.showToast('Trip information saved!', 'success');
    }
    
    // Participant Methods
    addParticipant() {
        const name = document.getElementById('participantName').value.trim();
        
        if (!name) {
            this.showToast('Please enter a name', 'error');
            return;
        }
        
        const participant = {
            id: Date.now().toString(),
            name: name,
            avatar: this.getInitials(name)
        };
        
        this.data.participants.push(participant);
        this.saveData();
        this.renderParticipants();
        this.updateDashboard();
        this.closeModal('participantModal');
        document.getElementById('participantForm').reset();
        this.showToast(`${name} added as participant!`, 'success');
    }
    
    removeParticipant(id) {
        const participant = this.data.participants.find(p => p.id === id);
        
        // Check if participant has expenses
        const hasExpenses = this.data.expenses.some(e => e.paidBy === id || e.splitBetween.includes(id));
        
        if (hasExpenses) {
            this.showToast('Cannot remove participant with expenses', 'error');
            return;
        }
        
        this.data.participants = this.data.participants.filter(p => p.id !== id);
        this.saveData();
        this.renderParticipants();
        this.updateDashboard();
        this.showToast(`${participant.name} removed`, 'info');
    }
    
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    }
    
    renderParticipants() {
        const grid = document.getElementById('participantsGrid');
        
        if (this.data.participants.length === 0) {
            grid.innerHTML = '<div class="empty-state">No participants yet. Add your first participant!</div>';
            return;
        }
        
        grid.innerHTML = this.data.participants.map(p => `
            <div class="participant-card glass" onclick="tracker.showParticipantExpenses('${p.id}')" style="cursor: pointer;">
                <button class="remove-btn" onclick="event.stopPropagation(); tracker.removeParticipant('${p.id}')">✕</button>
                <div class="avatar">${p.avatar}</div>
                <p class="name">${p.name}</p>
            </div>
        `).join('');
    }
    
    getParticipantExpenses(participantId) {
        return this.data.expenses.filter(e => 
            e.paidBy === participantId || e.splitBetween.includes(participantId)
        );
    }
    
    showParticipantExpenses(participantId) {
        const participant = this.data.participants.find(p => p.id === participantId);
        if (!participant) {
            this.showToast('Participant not found', 'error');
            return;
        }
        
        const expenses = this.getParticipantExpenses(participantId);
        
        document.getElementById('participantExpensesTitle').textContent = `${participant.name}'s Expenses`;
        
        const content = document.getElementById('participantExpensesContent');
        
        if (expenses.length === 0) {
            content.innerHTML = '<p class="empty-state">No expenses related to this participant</p>';
        } else {
            // Calculate totals
            const paidAmount = expenses
                .filter(e => e.paidBy === participantId)
                .reduce((sum, e) => sum + e.amount, 0);
            
            const involvedAmount = expenses.reduce((sum, e) => {
                if (e.paidBy === participantId) {
                    return sum + e.amount;
                } else if (e.splitBetween.includes(participantId)) {
                    return sum + (e.amount / e.splitBetween.length);
                }
                return sum;
            }, 0);
            
            content.innerHTML = `
                <div class="participant-expenses-summary">
                    <div class="summary-item">
                        <span class="label">Total Paid:</span>
                        <span class="value">€${paidAmount.toFixed(2)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Total Involved:</span>
                        <span class="value">€${involvedAmount.toFixed(2)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Number of Expenses:</span>
                        <span class="value">${expenses.length}</span>
                    </div>
                </div>
                <div class="participant-expenses-list">
                    ${expenses.map(e => {
                        const payer = this.data.participants.find(p => p.id === e.paidBy);
                        const payerName = payer ? payer.name : 'Unknown';
                        const isPaidByParticipant = e.paidBy === participantId;
                        const isInSplit = e.splitBetween.includes(participantId);
                        
                        let share = 0;
                        if (isPaidByParticipant) {
                            share = e.amount;
                        } else if (isInSplit) {
                            share = e.amount / e.splitBetween.length;
                        }
                        
                        return `
                            <div class="participant-expense-item glass">
                                <div class="expense-header">
                                    <strong>${e.title}</strong>
                                    <span class="amount">€${e.amount.toFixed(2)}</span>
                                </div>
                                <div class="expense-details">
                                    <span class="category-badge ${e.category}">${e.category}</span>
                                    <span class="date">${this.formatDate(e.date)}</span>
                                    <span class="payer">Paid by: ${payerName}</span>
                                </div>
                                <div class="expense-role">
                                    ${isPaidByParticipant ? '<span class="role-badge paid">Paid this expense</span>' : ''}
                                    ${isInSplit ? '<span class="role-badge split">In split</span>' : ''}
                                    <span class="share">Your share: €${share.toFixed(2)}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        this.openModal('participantExpensesModal');
    }
    
    // Expense Methods
    addExpense() {
        const title = document.getElementById('expenseTitle').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;
        const paidBy = document.getElementById('expensePaidBy').value;
        const notes = document.getElementById('expenseNotes').value.trim();
        const link = document.getElementById('expenseLink').value.trim();
        
        const splitBetween = Array.from(document.querySelectorAll('#splitBetween input:checked'))
            .map(cb => cb.value);
        
        if (!title || !amount || !category || !date || !paidBy || splitBetween.length === 0) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (this.editingExpenseId) {
            // Update existing expense
            this.updateExpense(this.editingExpenseId, {
                title,
                amount,
                category,
                date,
                paidBy,
                splitBetween,
                notes,
                link
            });
        } else {
            // Add new expense
            const expense = {
                id: Date.now().toString(),
                title,
                amount,
                category,
                date,
                paidBy,
                splitBetween,
                notes,
                link,
                createdAt: new Date().toISOString()
            };
            
            this.data.expenses.push(expense);
            this.saveData();
            this.renderExpenses();
            this.updateDashboard();
            this.updateCharts();
            this.calculateSettlements();
            this.closeModal('expenseModal');
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseDate').valueAsDate = new Date();
            this.showToast('Expense added successfully!', 'success');
        }
    }
    
    updateExpense(id, updatedData) {
        const expenseIndex = this.data.expenses.findIndex(e => e.id === id);
        if (expenseIndex === -1) {
            this.showToast('Expense not found', 'error');
            return;
        }
        
        this.data.expenses[expenseIndex] = {
            ...this.data.expenses[expenseIndex],
            ...updatedData
        };
        
        this.saveData();
        this.renderExpenses();
        this.updateDashboard();
        this.updateCharts();
        this.calculateSettlements();
        this.closeModal('expenseModal');
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').valueAsDate = new Date();
        this.editingExpenseId = null;
        document.querySelector('#expenseModal .modal-header h2').textContent = 'Add Expense';
        this.showToast('Expense updated successfully!', 'success');
    }
    
    deleteExpense(id) {
        this.data.expenses = this.data.expenses.filter(e => e.id !== id);
        this.saveData();
        this.renderExpenses();
        this.updateDashboard();
        this.updateCharts();
        this.calculateSettlements();
        this.showToast('Expense deleted', 'info');
    }
    
    renderExpenses(filter = '', categoryFilter = 'all') {
        const tbody = document.getElementById('expensesTableBody');
        
        let filtered = this.data.expenses;
        
        // Apply search filter
        if (filter) {
            const searchLower = filter.toLowerCase();
            filtered = filtered.filter(e => 
                e.title.toLowerCase().includes(searchLower) ||
                e.notes.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(e => e.category === categoryFilter);
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No expenses yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(e => {
            const payer = this.data.participants.find(p => p.id === e.paidBy);
            const payerName = payer ? payer.name : 'Unknown';
            
            return `
                <tr>
                    <td>
                        <div>
                            <strong>${e.title}</strong>
                            ${e.notes ? `<small style="color: var(--text-muted); display: block;">${e.notes}</small>` : ''}
                        </div>
                    </td>
                    <td>€${e.amount.toFixed(2)}</td>
                    <td><span class="category-badge ${e.category}">${e.category}</span></td>
                    <td>${this.formatDate(e.date)}</td>
                    <td>${payerName}</td>
                    <td>
                        ${e.link ? `<a href="${e.link}" target="_blank" class="link-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>` : ''}
                    </td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="tracker.editExpense('${e.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="btn btn-danger" style="padding: 0.5rem;" onclick="tracker.deleteExpense('${e.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 7L18.2257 17.2257C18.1612 18.0725 17.4526 18.7222 16.6033 18.7222H7.39674C6.54736 18.7222 5.83879 18.0725 5.77429 17.2257L5 7M10 11V17M14 11V17M15 7V4H9V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    filterExpenses(search, category) {
        this.renderExpenses(search, category);
    }
    
    // Dashboard Methods
    updateDashboard() {
        // Calculate totals
        const totalCost = this.data.expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = this.data.expenses.length;
        const remainingBudget = this.data.trip.budget - totalCost;
        const participantCount = this.data.participants.length;
        
        // Update stat cards with animation
        this.animateValue('totalCost', totalCost, '€');
        this.animateValue('totalExpenses', totalExpenses, '');
        this.animateValue('remainingBudget', remainingBudget, '€');
        this.animateValue('participantCount', participantCount, '');
        
        // Find biggest spender
        this.updateBiggestSpender();
        
        // Update recent expenses
        this.updateRecentExpenses();
    }
    
    animateValue(elementId, value, prefix) {
        const element = document.getElementById(elementId);
        const start = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
        const duration = 500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (value - start) * progress;
            
            if (prefix === '€') {
                element.textContent = `€${current.toFixed(2)}`;
            } else {
                element.textContent = Math.round(current);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    updateBiggestSpender() {
        const container = document.getElementById('biggestSpender');
        
        if (this.data.expenses.length === 0) {
            container.innerHTML = `
                <div class="avatar">-</div>
                <div class="info">
                    <p class="name">No data</p>
                    <p class="amount">€0</p>
                </div>
            `;
            return;
        }
        
        // Calculate spending per person
        const spending = {};
        this.data.participants.forEach(p => {
            spending[p.id] = 0;
        });
        
        this.data.expenses.forEach(e => {
            if (spending[e.paidBy] !== undefined) {
                spending[e.paidBy] += e.amount;
            }
        });
        
        // Find biggest spender
        let biggestSpenderId = null;
        let maxAmount = 0;
        
        Object.entries(spending).forEach(([id, amount]) => {
            if (amount > maxAmount) {
                maxAmount = amount;
                biggestSpenderId = id;
            }
        });
        
        const biggestSpender = this.data.participants.find(p => p.id === biggestSpenderId);
        
        if (biggestSpender) {
            container.innerHTML = `
                <div class="avatar">${biggestSpender.avatar}</div>
                <div class="info">
                    <p class="name">${biggestSpender.name}</p>
                    <p class="amount">€${maxAmount.toFixed(2)}</p>
                </div>
            `;
        }
    }
    
    updateRecentExpenses() {
        const container = document.getElementById('recentExpenses');
        
        if (this.data.expenses.length === 0) {
            container.innerHTML = '<p class="empty-state">No expenses yet</p>';
            return;
        }
        
        const recent = [...this.data.expenses]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        container.innerHTML = recent.map(e => `
            <div class="recent-expense-item">
                <span class="title">${e.title}</span>
                <span class="amount">€${e.amount.toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    // Chart Methods
    updateCharts() {
        this.updateCategoryChart();
        this.updateTimeChart();
        this.updatePersonChart();
    }
    
    updateCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Calculate spending by category
        const categoryData = {};
        this.data.expenses.forEach(e => {
            categoryData[e.category] = (categoryData[e.category] || 0) + e.amount;
        });
        
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        const colors = {
            hotel: '#6366f1',
            food: '#10b981',
            transport: '#3b82f6',
            activities: '#f59e0b',
            shopping: '#ec4899',
            fuel: '#8b5cf6',
            misc: '#64748b'
        };
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                datasets: [{
                    data: data,
                    backgroundColor: labels.map(l => colors[l] || '#64748b'),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    updateTimeChart() {
        const ctx = document.getElementById('timeChart').getContext('2d');
        
        // Group expenses by date
        const timeData = {};
        this.data.expenses.forEach(e => {
            const date = this.formatDate(e.date);
            timeData[date] = (timeData[date] || 0) + e.amount;
        });
        
        const sortedDates = Object.keys(timeData).sort((a, b) => new Date(a) - new Date(b));
        const data = sortedDates.map(d => timeData[d]);
        
        if (this.charts.time) {
            this.charts.time.destroy();
        }
        
        this.charts.time = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Spending',
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    updatePersonChart() {
        const ctx = document.getElementById('personChart').getContext('2d');
        
        // Calculate spending per person
        const personData = {};
        this.data.participants.forEach(p => {
            personData[p.id] = 0;
        });
        
        this.data.expenses.forEach(e => {
            if (personData[e.paidBy] !== undefined) {
                personData[e.paidBy] += e.amount;
            }
        });
        
        const labels = this.data.participants.map(p => p.name);
        const data = this.data.participants.map(p => personData[p.id]);
        
        if (this.charts.person) {
            this.charts.person.destroy();
        }
        
        this.charts.person = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Amount Paid',
                    data: data,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Settlement Methods
    calculateSettlements() {
        const balances = {};
        
        // Initialize balances
        this.data.participants.forEach(p => {
            balances[p.id] = 0;
        });
        
        // Calculate balances from expenses
        this.data.expenses.forEach(e => {
            const payer = e.paidBy;
            const splitCount = e.splitBetween.length;
            const share = e.amount / splitCount;
            
            // Payer paid the full amount
            balances[payer] += e.amount;
            
            // Each person in split owes their share
            e.splitBetween.forEach(personId => {
                balances[personId] -= share;
            });
        });
        
        // Render net balances
        this.renderBalances(balances);
        
        // Calculate simplified settlements
        this.calculateSimplifiedSettlements(balances);
    }
    
    renderBalances(balances) {
        const container = document.getElementById('balancesList');
        
        if (this.data.participants.length === 0) {
            container.innerHTML = '<p class="empty-state">No balances calculated yet</p>';
            return;
        }
        
        container.innerHTML = this.data.participants.map(p => {
            const balance = balances[p.id] || 0;
            const isPositive = balance >= 0;
            
            return `
                <div class="balance-item">
                    <div class="person">
                        <div class="avatar" style="width: 40px; height: 40px; font-size: 0.875rem;">${p.avatar}</div>
                        <span>${p.name}</span>
                    </div>
                    <span class="amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}€${Math.abs(balance).toFixed(2)}
                    </span>
                </div>
            `;
        }).join('');
    }
    
    calculateSimplifiedSettlements(balances) {
        const container = document.getElementById('settlementsList');
        
        // Separate debtors and creditors
        const debtors = [];
        const creditors = [];
        
        Object.entries(balances).forEach(([id, balance]) => {
            if (balance < -0.01) {
                debtors.push({ id, amount: Math.abs(balance) });
            } else if (balance > 0.01) {
                creditors.push({ id, amount: balance });
            }
        });
        
        // Sort by amount (descending)
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        
        // Calculate settlements
        const settlements = [];
        let i = 0, j = 0;
        
        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(debtor.amount, creditor.amount);
            
            if (amount > 0.01) {
                settlements.push({
                    from: debtor.id,
                    to: creditor.id,
                    amount: amount
                });
            }
            
            debtor.amount -= amount;
            creditor.amount -= amount;
            
            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }
        
        if (settlements.length === 0) {
            container.innerHTML = '<p class="empty-state">No settlements needed</p>';
            return;
        }
        
        container.innerHTML = settlements.map(s => {
            const fromPerson = this.data.participants.find(p => p.id === s.from);
            const toPerson = this.data.participants.find(p => p.id === s.to);
            
            return `
                <div class="settlement-item">
                    <div class="from">
                        <div class="avatar" style="width: 36px; height: 36px; font-size: 0.75rem;">${fromPerson.avatar}</div>
                        <span>${fromPerson.name}</span>
                    </div>
                    <div class="arrow">owes</div>
                    <div class="to">
                        <div class="avatar" style="width: 36px; height: 36px; font-size: 0.75rem;">${toPerson.avatar}</div>
                        <span>${toPerson.name}</span>
                    </div>
                    <span class="amount">€${s.amount.toFixed(2)}</span>
                </div>
            `;
        }).join('');
    }
    
    // Export Methods
    exportToCSV() {
        if (this.data.expenses.length === 0) {
            this.showToast('No expenses to export', 'error');
            return;
        }
        
        const headers = ['Title', 'Amount', 'Category', 'Date', 'Paid By', 'Notes'];
        const rows = this.data.expenses.map(e => {
            const payer = this.data.participants.find(p => p.id === e.paidBy);
            return [
                e.title,
                e.amount.toFixed(2),
                e.category,
                e.date,
                payer ? payer.name : 'Unknown',
                e.notes || ''
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses_${this.data.trip.name || 'trip'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Expenses exported to CSV!', 'success');
    }
    
    exportToJson() {
        if (!this.data || (this.data.participants.length === 0 && !this.data.trip.name)) {
            this.showToast('No trip data to export', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const fileName = `trip_backup_${(this.data.trip.name || 'data').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        this.showToast('Trip backup exported successfully!', 'success');
    }
    
    importFromJson(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            this.showToast('Please select a valid JSON file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validation
                if (!importedData.trip || !importedData.participants || !importedData.expenses) {
                    throw new Error('Invalid backup file format. Missing core trip data.');
                }
                
                if (confirm('Importing this file will replace all your current trip data. Are you sure you want to proceed?')) {
                    this.data = importedData;
                    this.saveData();
                    
                    // Refresh UI
                    this.initUI();
                    this.updateDashboard();
                    this.renderParticipants();
                    this.renderExpenses();
                    this.updateCharts();
                    this.calculateSettlements();
                    
                    this.showToast('Trip data imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Error importing file: ' + error.message, 'error');
            }
            // Reset the file input
            event.target.value = '';
        };
        reader.readAsText(file);
    }
    
    // Toast Methods
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="currentColor"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="currentColor"/></svg>'
        };
        
        toast.innerHTML = `${icons[type]}<span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the app
const tracker = new ExpenseTracker();
