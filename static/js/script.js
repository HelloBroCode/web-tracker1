document.addEventListener('DOMContentLoaded', function() {
    // Add page transition effect
    document.body.classList.add('fade-in');
    setTimeout(() => {
        document.body.classList.remove('fade-in');
    }, 500);

    // Animate form cards and stat cards on page load
    const animateElements = document.querySelectorAll('.form-card, .stats-card, .chart-container, .card');
    animateElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 + (index * 100)); // Stagger the animations
    });

    // Enhance form inputs and select elements
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        // Add focus animation
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
        });
        
        // Add validation animation
        input.addEventListener('invalid', function() {
            this.classList.add('shake');
            setTimeout(() => {
                this.classList.remove('shake');
            }, 500);
        });
    });
    
    // Record page load time
    if (window.performance) {
        const pageLoadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
        console.log(`Page loaded in ${pageLoadTime}ms`);
    }
    
    // Cache DOM elements to minimize lookups
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const mobileDarkModeToggle = document.getElementById('mobileDarkModeToggle');
    
    // Fix dark mode toggle functionality
    const body = document.body;

    // Check for saved dark mode preference
    function loadDarkModePreference() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'true') {
            body.classList.add('dark-mode');
            updateToggleButtonText(true);
            applyDarkModeToModals(true);
            updateChartColors(true);
        } else {
            body.classList.remove('dark-mode');
            updateToggleButtonText(false);
            applyDarkModeToModals(false);
            updateChartColors(false);
        }
    }

    // Update the toggle button text and icon
    function updateToggleButtonText(isDarkMode) {
        if (darkModeToggle) {
            if (isDarkMode) {
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            } else {
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            }
        }
        
        if (mobileDarkModeToggle) {
            if (isDarkMode) {
                mobileDarkModeToggle.innerHTML = '<i class="fas fa-sun me-2"></i> Toggle Light Mode';
            } else {
                mobileDarkModeToggle.innerHTML = '<i class="fas fa-moon me-2"></i> Toggle Dark Mode';
            }
        }
    }
    
    // Apply dark mode to modals
    function applyDarkModeToModals(isDarkMode) {
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            if (isDarkMode) {
                modal.classList.add('dark-mode-modal');
            } else {
                modal.classList.remove('dark-mode-modal');
            }
        });
    }
    
    // Update chart colors based on dark mode
    function updateChartColors(isDarkMode) {
        if (typeof Chart !== 'undefined') {
            // If Chart.js is available on the page
            Chart.helpers.each(Chart.instances, function(instance) {
                if (isDarkMode) {
                    // Set dark mode colors for charts
                    instance.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
                    instance.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
                    instance.options.scales.x.ticks.color = '#f0f0f0';
                    instance.options.scales.y.ticks.color = '#f0f0f0';
                    
                    if (instance.options.plugins && instance.options.plugins.legend) {
                        instance.options.plugins.legend.labels.color = '#f0f0f0';
                    }
                    
                    if (instance.config.type === 'pie' || instance.config.type === 'doughnut') {
                        // Brighten colors for pie/doughnut charts in dark mode
                        const newColors = [];
                        instance.data.datasets.forEach(dataset => {
                            if (dataset.backgroundColor) {
                                if (Array.isArray(dataset.backgroundColor)) {
                                    dataset.backgroundColor = dataset.backgroundColor.map(color => {
                                        return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/g, 
                                            function(match, r, g, b) {
                                                return `rgba(${Math.min(parseInt(r) + 20, 255)}, ${Math.min(parseInt(g) + 20, 255)}, ${Math.min(parseInt(b) + 20, 255)}, 0.8)`;
                                            });
                                    });
                                }
                            }
                        });
                    }
                } else {
                    // Reset to default light mode colors
                    instance.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
                    instance.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
                    instance.options.scales.x.ticks.color = '#666';
                    instance.options.scales.y.ticks.color = '#666';
                    
                    if (instance.options.plugins && instance.options.plugins.legend) {
                        instance.options.plugins.legend.labels.color = '#666';
                    }
                }
                instance.update();
            });
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        const isDarkMode = !body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
        
        updateToggleButtonText(isDarkMode);
        applyDarkModeToModals(isDarkMode);
        updateChartColors(isDarkMode);
        
        // Apply dark mode to month detail modal if it exists
        const monthDetailModal = document.getElementById('monthDetailModal');
        if (monthDetailModal) {
            if (isDarkMode) {
                monthDetailModal.classList.add('dark-mode-modal');
            } else {
                monthDetailModal.classList.remove('dark-mode-modal');
            }
        }
    }

    // Add event listener to the dark mode toggle button
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function(event) {
            event.preventDefault();
            toggleDarkMode();
        });
    }
    
    // Add event listener to the mobile dark mode toggle button
    if (mobileDarkModeToggle) {
        mobileDarkModeToggle.addEventListener('click', function(event) {
            event.preventDefault();
            toggleDarkMode();
        });
    }
    
    // Set up a MutationObserver to detect new modals being added to the DOM
    const bodyObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('modal')) {
                        // Found a new modal, apply dark mode if needed
                        const modalContent = node.querySelector('.modal-content');
                        if (modalContent && body.classList.contains('dark-mode')) {
                            modalContent.classList.add('dark-mode-modal');
                        }
                    }
                }
            }
        });
    });
    
    // Start observing the body for added modals
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // Load the saved preference when the page loads
    loadDarkModePreference();
    
    // Sound test functionality
    const soundTestBtn = document.getElementById('soundTestBtn');
    if (soundTestBtn) {
        soundTestBtn.addEventListener('click', function() {
            const audio = new Audio('/static/sounds/notification.mp3');
            audio.volume = 1.0;
            audio.play();
        });
    }
    
    // Chart animation
    function animateCharts() {
        // Animate category bars
        const categoryBars = document.querySelectorAll('.category-bar');
        categoryBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            setTimeout(() => {
                bar.style.width = width + '%';
            }, 100);
        });
        
        // Animate monthly trend bars
        const monthlyBars = document.querySelectorAll('.chart-bar');
        monthlyBars.forEach(bar => {
            const height = bar.getAttribute('data-height');
            setTimeout(() => {
                bar.style.height = height + '%';
            }, 100);
        });
    }
    
    // Run animations when page loads
    animateCharts();
    
    // Format the current time for message timestamps
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Add suggestion buttons
    function addSuggestionButtons(suggestions) {
        const suggestionContainer = document.createElement('div');
        suggestionContainer.className = 'bot-message';
        suggestionContainer.style.padding = '10px 15px';
        
        const btnsWrapper = document.createElement('div');
        btnsWrapper.className = 'd-flex flex-wrap gap-2 mt-2';
        
        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-outline-primary';
            btn.textContent = suggestion.text;
            btn.addEventListener('click', () => {
                // Add user message with the suggestion text
                addUserMessage(suggestion.text);
                
                // Handle the specific action
                handleSuggestionAction(suggestion.action);
            });
            
            btnsWrapper.appendChild(btn);
        });
        
        suggestionContainer.appendChild(document.createTextNode('Here are some things I can help you with:'));
        suggestionContainer.appendChild(btnsWrapper);
        
        chatBox.appendChild(suggestionContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Handle suggestion button actions
    function handleSuggestionAction(action) {
        switch (action) {
            case 'add_expense':
                // Send directly to finmate to start expense addition flow
                sendToFinmate("Add an expense");
                break;
            case 'view_expenses':
                fetchAndDisplayExpenses();
                break;
            case 'analyze_expenses':
                analyzeExpenses();
                break;
            case 'budget_tips':
                getBudgetTips();
                break;
            default:
                sendToFinmate(action);
        }
    }
    
    // Fetch and display recent expenses
    function fetchAndDisplayExpenses() {
        showTypingIndicator();
        
        // Fetch real expense data from the API
        fetch('/api/expenses?limit=5')
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                
                if (!data.success || !data.data || data.data.length === 0) {
                    addBotMessage("You don't have any expenses yet. Would you like to add one?");
                    return;
                }
                
                // Display recent expenses
                const expenseMessage = document.createElement('div');
                expenseMessage.className = 'message bot-message';
                expenseMessage.setAttribute('data-time', getCurrentTime());
                
                // Message content
                const messageContent = document.createElement('div');
                messageContent.innerHTML = `<strong>Here are your recent expenses:</strong>`;
                expenseMessage.appendChild(messageContent);
                
                // Add expense data
                const expenseData = document.createElement('div');
                expenseData.className = 'expense-data';
                
                // Add header
                let expenseHtml = `<div class="expense-data-header">Recent Expenses</div>`;
                
                // Add real expense data
                data.data.forEach(expense => {
                    expenseHtml += `
                        <div class="expense-data-item">
                            <span class="expense-data-label">${expense.category}</span>
                            <span class="expense-data-value">₹${parseFloat(expense.amount).toFixed(2)}</span>
                        </div>
                    `;
                });
                
                expenseData.innerHTML = expenseHtml;
                expenseMessage.appendChild(expenseData);
                
                // Add action buttons
                const actionButtons = document.createElement('div');
                actionButtons.className = 'message-actions';
                actionButtons.innerHTML = `
                    <button class="message-action-btn action-view"><i class="fas fa-search"></i> View All</button>
                    <button class="message-action-btn action-edit"><i class="fas fa-edit"></i> Edit Recent</button>
                    <button class="message-action-btn action-delete"><i class="fas fa-trash"></i> Delete</button>
                `;
                
                // Add event listeners to buttons
                actionButtons.querySelector('.action-view').addEventListener('click', () => {
                    window.location.href = '/view_expenses';
                });
                
                actionButtons.querySelector('.action-edit').addEventListener('click', () => {
                    handleExpenseEdit(data.data);
                });
                
                actionButtons.querySelector('.action-delete').addEventListener('click', () => {
                    handleExpenseDelete(data.data);
                });
                
                expenseMessage.appendChild(actionButtons);
                
                // Add to chat
                chatBox.appendChild(expenseMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
                
                // Play notification sound
                playNotificationSound();
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, I couldn't retrieve your recent expenses. Please try again later.");
                console.error('Error fetching expenses:', error);
            });
    }
    
    // Analyze expenses and provide insights
    function analyzeExpenses() {
        showTypingIndicator();
        
        // Fetch real expense analysis data from the API
        fetch('/api/expenses/analyze')
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                
                if (!data.success) {
                    addBotMessage("Sorry, I couldn't analyze your expenses at the moment. Please try again later.");
                    return;
                }
                
                const analysisData = data.data;
                const analysisMessage = createBotMessageElement();
                
                // Check if there are any expenses to analyze
                const hasCurrentMonthExpenses = analysisData.current_month_total > 0;
                const hasLastMonthExpenses = analysisData.last_month_total > 1; // > 1 because API sets to 1 to avoid division by zero
                const hasCategories = Object.keys(analysisData.categories || {}).length > 0;
                
                if (!hasCurrentMonthExpenses && !hasLastMonthExpenses) {
                    // No expenses at all
                    analysisMessage.innerHTML = `
                        <div><strong>Expense Analysis</strong></div>
                        <p>I don't see any expense records for this month or last month. Add some expenses to get insights about your spending patterns.</p>
                        <p>Would you like to add an expense now?</p>
                        <button class="btn btn-sm btn-primary mt-2 add-expense-btn">
                            <i class="fas fa-plus me-1"></i> Add Expense
                        </button>
                    `;
                    
                    chatBox.appendChild(analysisMessage);
                    chatBox.scrollTop = chatBox.scrollHeight;
                    
                    // Add event listener for the add expense button
                    const addExpenseBtn = analysisMessage.querySelector('.add-expense-btn');
                    if (addExpenseBtn) {
                        addExpenseBtn.addEventListener('click', () => {
                            addUserMessage('Add an expense');
                            sendToFinmate('Add an expense');
                        });
                    }
                    
                    playNotificationSound();
                    return;
                }
                
                // Format percentage change text and style
                let percentChangeText;
                let percentChangeClass;
                
                if (!hasLastMonthExpenses) {
                    // No expenses last month but we have some this month
                    percentChangeText = "You had no expenses last month";
                    percentChangeClass = "text-primary";
                } else if (!hasCurrentMonthExpenses) {
                    // No expenses this month but had some last month
                    percentChangeText = "100% lower (no expenses this month)";
                    percentChangeClass = "text-success";
                } else {
                    // Both months have expenses
                    if (analysisData.percent_change >= 0) {
                        percentChangeText = `${analysisData.percent_change}% higher`;
                        percentChangeClass = "text-danger";
                    } else {
                        percentChangeText = `${Math.abs(analysisData.percent_change)}% lower`;
                        percentChangeClass = "text-success";
                    }
                }
                
                // Get highest category with proper checks
                const highestCategory = hasCategories ? 
                    `${analysisData.highest_category.name} (${analysisData.highest_category.percentage}% of total)` : 
                    "None (no expenses this month)";
                    
                // Get most frequent category with proper checks
                const mostFrequent = hasCategories ? 
                    `${analysisData.most_frequent.name} (${analysisData.most_frequent.count} transactions)` : 
                    "None (no expenses this month)";
                
                // Generate a recommendation based on real data
                let recommendation;
                if (!hasCurrentMonthExpenses) {
                    recommendation = "You have no expenses this month. If this is intentional, great job saving money!";
                } else if (analysisData.percent_change > 20) {
                    recommendation = `Your spending increased significantly. Consider reducing ${analysisData.highest_category.name} expenses to stay within budget.`;
                } else if (analysisData.percent_change > 10) {
                    recommendation = `Watch your ${analysisData.highest_category.name} spending as it's higher than last month.`;
                } else if (analysisData.percent_change >= 0) {
                    recommendation = "Your spending is relatively stable compared to last month.";
                } else {
                    recommendation = "You're spending less than last month. Keep up the good work!";
                }
                
                // Format the analysis with real data and checks
                analysisMessage.innerHTML = `
                    <div><strong>Expense Analysis</strong></div>
                    <p>Based on your spending patterns:</p>
                    <ul>
                        <li><strong>Highest spending category:</strong> ${highestCategory}</li>
                        <li><strong>Most frequent category:</strong> ${mostFrequent}</li>
                        <li><strong>Month-to-month change:</strong> <span class="${percentChangeClass}">${percentChangeText}</span> than last month</li>
                    </ul>
                    <p>💡 <strong>Recommendation:</strong> ${recommendation}</p>
                `;
                
                // If there are categories, add a spending breakdown section
                if (hasCategories) {
                    const categoriesSection = document.createElement('div');
                    categoriesSection.className = 'mt-3';
                    categoriesSection.innerHTML = '<div><strong>Spending Breakdown:</strong></div>';
                    
                    const categoriesList = document.createElement('div');
                    categoriesList.className = 'expense-categories-list';
                    
                    // Sort categories by amount (highest first)
                    const sortedCategories = Object.entries(analysisData.categories)
                        .sort((a, b) => b[1] - a[1]);
                    
                    sortedCategories.forEach(([category, amount]) => {
                        const percentage = ((amount / analysisData.current_month_total) * 100).toFixed(1);
                        const categoryItem = document.createElement('div');
                        categoryItem.className = 'category-item';
                        categoryItem.innerHTML = `
                            <div class="category-name">${category}</div>
                            <div class="category-bar-container">
                                <div class="category-bar" style="width: ${percentage}%"></div>
                                <div class="category-amount">₹${amount.toFixed(2)} (${percentage}%)</div>
                            </div>
                        `;
                        categoriesList.appendChild(categoryItem);
                    });
                    
                    categoriesSection.appendChild(categoriesList);
                    analysisMessage.appendChild(categoriesSection);
                }
                
                // If there is monthly trend data, add a chart
                if (analysisData.monthly_trend && analysisData.monthly_trend.length > 0) {
                    const trendSection = document.createElement('div');
                    trendSection.className = 'mt-4';
                    trendSection.innerHTML = '<div><strong>Monthly Spending Trend:</strong></div>';
                    
                    // Create the chart container
                    const chartContainer = document.createElement('div');
                    chartContainer.className = 'monthly-trend-chart';
                    
                    // Get the data
                    const months = analysisData.monthly_trend.map(item => item.month);
                    const amounts = analysisData.monthly_trend.map(item => item.total);
                    
                    // Calculate the max amount for scaling
                    const maxAmount = Math.max(...amounts, 1);
                    
                    // Create bar chart HTML
                    let chartHtml = '<div class="chart-bars">';
                    
                    // Add bars for each month
                    months.forEach((month, index) => {
                        const amount = amounts[index];
                        const percentage = (amount / maxAmount) * 100;
                        
                        // Determine bar color based on current month
                        const isCurrentMonth = index === months.length - 1;
                        const barColor = isCurrentMonth ? 'current-month-bar' : 'month-bar';
                        
                        chartHtml += `
                            <div class="chart-bar-column">
                                <div class="chart-bar-value">₹${amount.toFixed(0)}</div>
                                <div class="chart-bar-container">
                                    <div class="chart-bar ${barColor}" style="height: ${percentage}%"></div>
                                </div>
                                <div class="chart-bar-label">${month}</div>
                            </div>
                        `;
                    });
                    
                    chartHtml += '</div>';
                    chartContainer.innerHTML = chartHtml;
                    
                    trendSection.appendChild(chartContainer);
                    analysisMessage.appendChild(trendSection);
                    
                    // Add period information
                    if (analysisData.period) {
                        const periodInfo = document.createElement('div');
                        periodInfo.className = 'period-info mt-2 small text-muted';
                        periodInfo.innerHTML = `
                            <div>Analysis compares ${analysisData.period.current_month.name} to ${analysisData.period.last_month.name}</div>
                        `;
                        trendSection.appendChild(periodInfo);
                    }
                }
                
                // Add to chat
                chatBox.appendChild(analysisMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
                
                // Play notification sound
                playNotificationSound();
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, there was an error analyzing your expenses. Please try again later.");
                console.error('Error analyzing expenses:', error);
            });
    }
    
    // Get budget tips
    function getBudgetTips() {
        showTypingIndicator();
        
        // Default to non-AI tips to save costs
        const useAI = false; // Set to false by default to minimize OpenAI API usage
        
        // Fetch budget tips from our cost-optimized API
        fetch(`/api/budget/tips?use_ai=${useAI}`)
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                
                if (data.success) {
                    const tipsData = data.data;
                    const tipsMessage = createBotMessageElement();
                    
                    if (tipsData.is_ai_generated && tipsData.ai_tip) {
                        // Display AI-generated tip when available
                        tipsMessage.innerHTML = `
                            <div><strong>Personalized Budget Tip</strong></div>
                            <p>${tipsData.ai_tip}</p>
                            <p class="text-muted"><small><i class="fas fa-robot me-1"></i>AI-generated advice based on your spending patterns</small></p>
                        `;
                    } else {
                        // Display pre-defined tips when not using AI (saves costs)
                        tipsMessage.innerHTML = `
                            <div><strong>Budget Tips</strong></div>
                            <p>Here are some helpful tips to save money:</p>
                            <ol>
                                ${tipsData.general_tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ol>
                            <p>Would you like more specific advice for any category?</p>
                        `;
                        
                        // Add suggestion buttons for budget categories
                        const budgetCategories = [
                            { text: "Food", action: "food_tips" },
                            { text: "Transportation", action: "transport_tips" },
                            { text: "Entertainment", action: "entertainment_tips" }
                        ];
                        
                        const btnsWrapper = document.createElement('div');
                        btnsWrapper.className = 'd-flex flex-wrap gap-2 mt-2';
                        
                        budgetCategories.forEach(category => {
                            const btn = document.createElement('button');
                            btn.className = 'btn btn-sm btn-outline-primary';
                            btn.textContent = category.text;
                            btn.addEventListener('click', () => {
                                addUserMessage(`Tips for ${category.text}`);
                                getSpecificBudgetTips(category.text.toLowerCase());
                            });
                            
                            btnsWrapper.appendChild(btn);
                        });
                        
                        tipsMessage.appendChild(btnsWrapper);
                    }
                    
                    // Add to chat
                    chatBox.appendChild(tipsMessage);
                    chatBox.scrollTop = chatBox.scrollHeight;
                    
                    // Play notification sound
                    playNotificationSound();
                } else {
                    addBotMessage("Sorry, I couldn't retrieve budget tips at the moment. Please try again later.");
                }
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, there was an error retrieving budget tips. Please try again later.");
                console.error('Error fetching budget tips:', error);
            });
    }
    
    // Get specific budget tips for a category
    function getSpecificBudgetTips(category) {
        showTypingIndicator();
        
        // Default to non-AI tips to save costs
        const useAI = false; // Set to false by default to minimize OpenAI API usage
        
        fetch(`/api/budget/tips?category=${category}&use_ai=${useAI}`)
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                
                if (data.success) {
                    const tipsData = data.data;
                    const tipsMessage = createBotMessageElement();
                    
                    if (tipsData.is_ai_generated && tipsData.ai_tip) {
                        // Display AI-generated tip when available
                        tipsMessage.innerHTML = `
                            <div><strong>Personalized Tip for ${tipsData.category.charAt(0).toUpperCase() + tipsData.category.slice(1)}</strong></div>
                            <p>${tipsData.ai_tip}</p>
                            <p class="text-muted"><small><i class="fas fa-robot me-1"></i>AI-generated advice based on your spending patterns</small></p>
                        `;
                    } else {
                        // Display pre-defined tips (saves costs)
                        // Format the tips as a list
                        let tipsHTML = `<div><strong>Tips for ${category.charAt(0).toUpperCase() + category.slice(1)}</strong></div><ul>`;
                        tipsData.tips.forEach(tip => {
                            tipsHTML += `<li>${tip}</li>`;
                        });
                        tipsHTML += '</ul><p>Would you like to see tips for another category?</p>';
                        
                        tipsMessage.innerHTML = tipsHTML;
                    }
                    
                    // Add to chat
                    chatBox.appendChild(tipsMessage);
                    chatBox.scrollTop = chatBox.scrollHeight;
                    
                    // Play notification sound
                    playNotificationSound();
                } else {
                    addBotMessage("Sorry, I couldn't retrieve tips for that category. Please try again later.");
                }
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, there was an error retrieving tips. Please try again later.");
                console.error('Error fetching specific budget tips:', error);
            });
    }
    
    // Create bot message element
    function createBotMessageElement() {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.setAttribute('data-time', getCurrentTime());
        return messageElement;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing';
        typingIndicator.id = 'typing-indicator';
        typingIndicator.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Play notification sound
    function playNotificationSound() {
        try {
            // Create new Audio instance for each play
            const sound = new Audio('/static/sounds/notification.mp3');
            sound.volume = 1.0; // Maximum volume
            sound.preload = 'auto'; // Ensure preloading
            
            // Set oncanplaythrough to ensure it plays when ready
            sound.oncanplaythrough = function() {
                const playPromise = sound.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('Notification sound played successfully');
                    }).catch(e => {
                        console.warn('Sound play prevented by browser:', e.message);
                        
                        // Enable sound on next user interaction
                        const enableSound = function() {
                            sound.play().catch(err => console.error('Still could not play sound', err));
                            document.removeEventListener('click', enableSound);
                            document.removeEventListener('keydown', enableSound);
                        };
                        
                        document.addEventListener('click', enableSound, { once: true });
                        document.addEventListener('keydown', enableSound, { once: true });
                    });
                }
            };
            
            // Fallback if oncanplaythrough doesn't trigger
            setTimeout(() => {
                if (sound.readyState < 4) { // If not ready to play
                    sound.play().catch(e => console.warn('Fallback play failed:', e.message));
                }
            }, 500);
        } catch (e) {
            console.error('Error playing notification sound', e);
        }
    }
    
    // Send message to finmate endpoint
    function sendToFinmate(message) {
        showTypingIndicator();
        
        // Store the request start time
        const requestStartTime = new Date().getTime();
        
        // Set up request timeout
        const timeout = 15000; // 15 seconds
        
        // Create an AbortController for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Always send messages directly to the finmate endpoint for actual expense handling
        // This ensures expense addition works properly
        fetch('/finmate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: message }),
            signal: controller.signal
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Calculate response time
            const responseTime = new Date().getTime() - requestStartTime;
            console.log(`Response received in ${responseTime}ms`);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response with slight delay for natural feel
            setTimeout(() => {
                // Check if the response is valid
                if (!data || !data.response) {
                    throw new Error('Invalid response format from server');
                }
                
                addBotMessage(data.response);
                
                // Double play the notification for more emphasis
                playNotificationSound();
                setTimeout(() => {
                    playNotificationSound(); 
                }, 300); // Play second sound after 300ms for emphasis
            }, 200);
        })
        .catch((error) => {
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Handle different types of errors
            if (error.name === 'AbortError') {
                addBotMessage("Sorry, the request took too long to complete. Please try again.");
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                addBotMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
            } else {
                addBotMessage("Sorry, something went wrong. Please try again later.");
            }
            
            console.error('Error communicating with server:', error);
            
            // Add a retry button for convenience
            setTimeout(() => {
                const retryButton = document.createElement('button');
                retryButton.className = 'btn btn-sm btn-primary mt-2';
                retryButton.innerHTML = '<i class="fas fa-redo me-1"></i> Try Again';
                retryButton.addEventListener('click', () => {
                    addUserMessage('Try again: ' + message);
                    sendToFinmate(message);
                });
                
                // Add button to the last message
                const messages = document.querySelectorAll('.bot-message');
                const lastMessage = messages[messages.length - 1];
                lastMessage.appendChild(retryButton);
            }, 500);
        });
    }
    
    // Handle financial knowledge questions
    function handleKnowledgeQuestion(message) {
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            
            // Normalize the message for matching
            const normalizedMessage = message.toLowerCase().trim();
            
            // Check if we have a direct match in our knowledge base
            let answered = false;
            for (const [question, answer] of Object.entries(financialKnowledge)) {
                if (normalizedMessage.includes(question)) {
                    addBotMessage(answer);
                    answered = true;
                    break;
                }
            }
            
            // If no direct match, see if it's asking about a topic we can discuss
            if (!answered) {
                if (normalizedMessage.includes("what") && normalizedMessage.includes("talk about")) {
                    suggestConversationTopics();
                } else {
                    // No match found, give a general response
                    addBotMessage("I'd be happy to discuss financial topics like budgeting, saving, investing, or debt management. What aspect of personal finance are you interested in?");
                }
            }
            
            playNotificationSound();
        }, 800);
    }
    
    // Suggest conversation topics
    function suggestConversationTopics() {
        const topicsMessage = createBotMessageElement();
        
        const content = document.createElement('div');
        content.innerHTML = "<p>I can talk about various financial topics. What interests you?</p>";
        
        // Create topic buttons
        const topicsDiv = document.createElement('div');
        topicsDiv.className = 'd-flex flex-wrap gap-2 mt-2';
        
        conversationTopics.forEach(topic => {
            const topicBtn = document.createElement('button');
            topicBtn.className = 'btn btn-sm btn-outline-primary';
            topicBtn.textContent = topic.topic;
            topicBtn.addEventListener('click', () => {
                addUserMessage(topic.topic);
                respondToTopic(topic.topic);
            });
            
            topicsDiv.appendChild(topicBtn);
        });
        
        content.appendChild(topicsDiv);
        topicsMessage.appendChild(content);
        
        chatBox.appendChild(topicsMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        playNotificationSound();
    }
    
    // Respond to selected topic
    function respondToTopic(topic) {
        showTypingIndicator();
        
        // Prepare responses for different topics
        const topicResponses = {
            "Saving strategies": `
                <p><strong>Saving Strategies:</strong></p>
                <ol>
                    <li><strong>50/30/20 Rule</strong> - Allocate 50% of income to needs, 30% to wants, and 20% to savings.</li>
                    <li><strong>Automate Savings</strong> - Set up automatic transfers to savings accounts.</li>
                    <li><strong>Cut Unnecessary Expenses</strong> - Review subscriptions and eliminate those you don't use.</li>
                    <li><strong>Use Cashback Apps/Cards</strong> - Earn money back on purchases you'd make anyway.</li>
                    <li><strong>Wait 24 Hours</strong> - Before making non-essential purchases, wait a day to avoid impulse buying.</li>
                </ol>
                <p>Would you like me to elaborate on any of these strategies?</p>
            `,
            "Debt management": `
                <p><strong>Debt Management Strategies:</strong></p>
                <ol>
                    <li><strong>Debt Snowball</strong> - Pay off smallest debts first to build momentum.</li>
                    <li><strong>Debt Avalanche</strong> - Focus on highest interest rates first to minimize interest paid.</li>
                    <li><strong>Debt Consolidation</strong> - Combine multiple debts into a single payment with a lower interest rate.</li>
                    <li><strong>Balance Transfers</strong> - Move high-interest debt to 0% intro APR cards.</li>
                    <li><strong>Increase Income</strong> - Consider side hustles or asking for a raise to pay off debt faster.</li>
                </ol>
                <p>Which approach interests you most?</p>
            `,
            "Investment basics": `
                <p><strong>Investment Basics:</strong></p>
                <ol>
                    <li><strong>Stocks</strong> - Ownership shares in companies that can pay dividends and increase in value.</li>
                    <li><strong>Bonds</strong> - Loans to companies or governments that pay regular interest.</li>
                    <li><strong>Mutual Funds</strong> - Collections of stocks, bonds, or other securities managed professionally.</li>
                    <li><strong>ETFs</strong> - Similar to mutual funds but traded like stocks throughout the day.</li>
                    <li><strong>Real Estate</strong> - Property investments that can generate rental income and appreciate in value.</li>
                </ol>
                <p>Remember: Start early, diversify, and consider your risk tolerance and time horizon.</p>
            `,
            "Retirement planning": `
                <p><strong>Retirement Planning Essentials:</strong></p>
                <ol>
                    <li><strong>Start Early</strong> - The power of compound interest works best over decades.</li>
                    <li><strong>Employer Plans</strong> - Maximize matches in 401(k)s or similar plans—it's free money!</li>
                    <li><strong>IRAs</strong> - Consider Traditional or Roth IRAs for tax advantages.</li>
                    <li><strong>Diversification</strong> - Spread investments across different asset classes to reduce risk.</li>
                    <li><strong>Regular Rebalancing</strong> - Adjust your portfolio periodically to maintain your desired allocation.</li>
                </ol>
                <p>The earlier you start, the less you need to save each month to reach your goals.</p>
            `,
            "Emergency funds": `
                <p><strong>Emergency Fund Basics:</strong></p>
                <ol>
                    <li><strong>Target Amount</strong> - Aim for 3-6 months of essential expenses.</li>
                    <li><strong>Where to Keep It</strong> - High-yield savings accounts offer accessibility and some interest.</li>
                    <li><strong>Building Gradually</strong> - Start with a ₹1,000 mini-emergency fund, then build up.</li>
                    <li><strong>What Counts as Emergency</strong> - Job loss, medical issues, urgent home/car repairs.</li>
                    <li><strong>Replenish After Use</strong> - Make it a priority to rebuild after using your fund.</li>
                </ol>
                <p>An emergency fund is your financial buffer against life's unexpected events!</p>
            `
        };
        
        setTimeout(() => {
            removeTypingIndicator();
            
            const responseMessage = createBotMessageElement();
            
            if (topicResponses[topic]) {
                responseMessage.innerHTML = topicResponses[topic];
            } else {
                responseMessage.textContent = "I don't have specific information about that topic yet, but I'd be happy to discuss other financial subjects.";
            }
            
            chatBox.appendChild(responseMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
            
            playNotificationSound();
        }, 1500);
    }
    
    // Track active operations
    let isEditOperationActive = false;
    let isDeleteOperationActive = false;
    let activeExpenses = null;
    let activeOperation = null;

    // Send message function
    function sendMessage() {
        const message = userInput.value.trim();
        if (message.length === 0) return;
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input
        userInput.value = '';
        
        // If we're in edit or delete mode, handle number inputs specially
        if (isEditOperationActive || isDeleteOperationActive) {
            const numMatch = message.match(/^[1-9][0-9]*$/);
            
            if (numMatch) {
                const index = parseInt(message) - 1;
                if (activeExpenses && index >= 0 && index < activeExpenses.length) {
                    // Handle the selection
                    if (isEditOperationActive) {
                        isEditOperationActive = false;
                        showExpenseEditForm(activeExpenses[index]);
                    } else if (isDeleteOperationActive) {
                        isDeleteOperationActive = false;
                        confirmExpenseDelete(activeExpenses[index]);
                    }
                    
                    // Reset the active state
                    activeOperation = null;
                    activeExpenses = null;
                    return;
                }
            }
            
            // If we reach here, it wasn't a valid selection
            // Reset the operation flags and let regular message handling continue
            isEditOperationActive = false;
            isDeleteOperationActive = false;
        }
        
        // First check: Is this a direct expense-related command?
        if (isExpenseAdditionCommand(message)) {
            // Direct expense-related queries to the finmate endpoint
            sendToFinmate(message);
            return;
        }
        
        // Second check: Is this a known query type we can handle directly?
        if (handleKnownQueryTypes(message)) {
            return; // Handled by the function
        }
        
        // If we reach here, we don't have a specific handler
        // Send it to finmate as a fallback
        sendToFinmate(message);
    }
    
    // Check if a message is related to expense addition
    function isExpenseAdditionCommand(message) {
        // If we're in an active edit or delete operation, don't treat as expense command
        if (isEditOperationActive || isDeleteOperationActive) {
            return false;
        }
        
        const lowercaseMsg = message.toLowerCase();
        
        // Direct expense addition commands
        if (lowercaseMsg.includes('add expense') || 
            lowercaseMsg.includes('add an expense') ||
            lowercaseMsg.includes('new expense') ||
            lowercaseMsg.includes('record expense') ||
            lowercaseMsg.includes('log expense')) {
            return true;
        }
        
        // Spending statements
        if (/spent|paid|bought|purchased|cost|price/i.test(lowercaseMsg)) {
            return true;
        }
        
        // Check if there are any active expense edit/delete operations in the DOM
        // This is a fallback check in case our flags get out of sync
        const hasActiveEditOperation = document.querySelector('.expense-edit-list') !== null;
        const hasActiveDeleteOperation = document.querySelector('.expense-delete-list') !== null;
        
        if (hasActiveEditOperation || hasActiveDeleteOperation) {
            // Update our flags to match the DOM state
            isEditOperationActive = hasActiveEditOperation;
            isDeleteOperationActive = hasActiveDeleteOperation;
            return false;
        }
        
        // Catch just numbers which might be amounts
        if (/^\d+(\.\d+)?$/.test(message)) {
            return true;
        }
        
        // Amount-like patterns (₹500 for food)
        if (/₹\s*\d+/i.test(lowercaseMsg) || 
            /\d+\s*₹/i.test(lowercaseMsg) ||
            /rupees\s*\d+/i.test(lowercaseMsg)) {
            return true;
        }
        
        return false;
    }
    
    // Handle common types of queries with appropriate responses
    function handleKnownQueryTypes(message) {
        const lowercaseMsg = message.toLowerCase();
        
        // Greetings
        if (/^(hi|hello|hey|greetings|howdy|hola|namaste)/i.test(lowercaseMsg)) {
            addBotMessage("Hello! I'm your finance assistant. I can help you add expenses, view spending, or give budget tips. What would you like to do?");
            playNotificationSound();
            return true;
        }
        
        // Help requests
        if (/help|assist|support|guide|how to use/i.test(lowercaseMsg)) {
            addBotMessage("I can help you with the following:\n• Add an expense (just say 'add expense')\n• View my expenses\n• Analyze my spending\n• Get budget tips\nWhat would you like to do?");
            playNotificationSound();
            return true;
        }
        
        // View expenses
        if (/view|show|display|list|see|my expenses|all expenses/i.test(lowercaseMsg)) {
            fetchAndDisplayExpenses();
            return true;
        }
        
        // Analysis
        if (/analy[sz]e|insight|report|breakdown|statistic|chart|graph/i.test(lowercaseMsg)) {
            analyzeExpenses();
            return true;
        }
        
        // Budgeting
        if (/budget|tip|advice|suggestion|recommend|save money|saving|financial|finance/i.test(lowercaseMsg)) {
            getBudgetTips();
            return true;
        }
        
        // Identity questions
        if (/(who|what) are you|tell me about yourself|your name|who made you/i.test(lowercaseMsg)) {
            addBotMessage("I'm FinMate, your AI finance assistant. I help you track expenses, analyze spending, and provide financial advice for your personal budget management.");
            playNotificationSound();
            return true;
        }
        
        // Gratitude
        if (/thank|thanks|appreciate|grateful|good job|well done/i.test(lowercaseMsg)) {
            addBotMessage("You're welcome! I'm here anytime you need assistance with your finances. Is there anything else I can help with?");
            playNotificationSound();
            return true;
        }
        
        // Edit requests
        if (/edit|modify|change|update|correct/i.test(lowercaseMsg) && 
            /expense|entry|record|transaction/i.test(lowercaseMsg)) {
            // Fetch expenses and show edit interface instead of just showing a message
            showTypingIndicator();
            fetch('/api/expenses?limit=5')
                .then(response => response.json())
                .then(data => {
                    removeTypingIndicator();
                    if (data.success && data.data && data.data.length > 0) {
                        handleExpenseEdit(data.data);
                    } else {
                        addBotMessage("You don't have any recent expenses to edit. Would you like to add a new expense?");
                    }
                })
                .catch(error => {
                    removeTypingIndicator();
                    addBotMessage("Sorry, I couldn't retrieve your expenses for editing. Please try again later.");
                    console.error('Error fetching expenses for editing:', error);
                });
            return true;
        }
        
        // Delete requests
        if (/delete|remove|erase/i.test(lowercaseMsg) && 
            /expense|entry|record|transaction/i.test(lowercaseMsg)) {
            // Fetch expenses and show delete interface
            showTypingIndicator();
            fetch('/api/expenses?limit=5')
                .then(response => response.json())
                .then(data => {
                    removeTypingIndicator();
                    if (data.success && data.data && data.data.length > 0) {
                        handleExpenseDelete(data.data);
                    } else {
                        addBotMessage("You don't have any recent expenses to delete.");
                    }
                })
                .catch(error => {
                    removeTypingIndicator();
                    addBotMessage("Sorry, I couldn't retrieve your expenses for deletion. Please try again later.");
                    console.error('Error fetching expenses for deletion:', error);
                });
            return true;
        }
        
        // Financial questions (use our knowledge base)
        if (isFinancialQuestion(lowercaseMsg)) {
            handleFinancialQuestion(message);
            return true;
        }
        
        // Not recognized as any of our known patterns
        return false;
    }
    
    // Check if message is a financial question
    function isFinancialQuestion(lowercaseMsg) {
        // Check for question indicators
        const hasQuestionIndicator = /what|how|why|when|where|which|can you|could you|should i|explain|tell me about/i.test(lowercaseMsg);
        
        // Check for financial terms
        const hasFinancialTerm = /budget|saving|money|expense|finance|invest|spend|cost|debt|credit|loan|interest|income|salary/i.test(lowercaseMsg);
        
        return hasQuestionIndicator && hasFinancialTerm;
    }
    
    // Handle financial questions from the knowledge base
    function handleFinancialQuestion(message) {
        const lowercaseMsg = message.toLowerCase();
        
        // First check for direct matches in our knowledge base
        for (const [question, answer] of Object.entries(financialKnowledge)) {
            if (lowercaseMsg.includes(question.toLowerCase())) {
                addBotMessage(answer);
                playNotificationSound();
                return true;
            }
        }
        
        // If no direct match but it's still recognized as a financial question
        // Use a more generic response
        addBotMessage("That's a good financial question! I can help with expense tracking, budgeting, and basic financial advice. For more detailed guidance on this specific topic, consider consulting a financial advisor.");
        playNotificationSound();
        return true;
    }
    
    // Try to parse natural language expense statements
    function parseExpenseStatement(message) {
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            
            // Try to extract amount using regex
            const amountMatch = message.match(/\$?(\d+(?:\.\d{1,2})?)/);
            // Try to extract category
            const categories = ['food', 'transport', 'transportation', 'entertainment', 'bills', 'groceries', 'shopping', 'health', 'others'];
            const categoryMatch = categories.find(cat => message.toLowerCase().includes(cat));
            
            if (amountMatch && categoryMatch) {
                const amount = amountMatch[1];
                let category = categoryMatch;
                
                // Normalize category names
                if (category === 'transportation') category = 'transport';
                if (category === 'groceries') category = 'food';
                
                // Format the category name properly
                const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
                
                addBotMessage(`I understood that you spent ₹${amount} on ${formattedCategory}. Would you like me to add this expense?`);
                
                // Add Yes/No buttons
                const btnsWrapper = document.createElement('div');
                btnsWrapper.className = 'd-flex flex-wrap gap-2 mt-2';
                
                const yesBtn = document.createElement('button');
                yesBtn.className = 'btn btn-sm btn-outline-success';
                yesBtn.innerHTML = '<i class="fas fa-check me-1"></i> Yes, add it';
                yesBtn.addEventListener('click', () => {
                    // Add a simplified expense
                    addSimplifiedExpense(amount, formattedCategory);
                });
                
                const noBtn = document.createElement('button');
                noBtn.className = 'btn btn-sm btn-outline-danger';
                noBtn.innerHTML = '<i class="fas fa-times me-1"></i> No, don\'t add';
                noBtn.addEventListener('click', () => {
                    addBotMessage("No problem. Let me know if you need anything else.");
                });
                
                btnsWrapper.appendChild(yesBtn);
                btnsWrapper.appendChild(noBtn);
                
                // Append to the last bot message
                const messages = document.querySelectorAll('.bot-message');
                const lastMessage = messages[messages.length - 1];
                lastMessage.appendChild(btnsWrapper);
            } else {
                addBotMessage("I'm not sure I understood the expense details. Could you provide more information like amount and category?");
            }
            
            playNotificationSound();
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    }
    
    // Add a simplified expense using the API
    function addSimplifiedExpense(amount, category) {
        showTypingIndicator();
        
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const date = `${day}-${month}-${year}`;
        
        // Only need to send amount, category and date - notes will be auto-generated
        fetch('/finmate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: amount }),
        })
        .then(response => response.json())
        .then(() => {
            return fetch('/finmate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: category }),
            });
        })
        .then(response => response.json())
        .then(() => {
            return fetch('/finmate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: date }),
            });
        })
        .then(response => response.json())
        .then(data => {
            removeTypingIndicator();
            addBotMessage(data.response);
            playNotificationSound();
        })
        .catch((error) => {
            removeTypingIndicator();
            addBotMessage("Sorry, I couldn't add the expense. Please try again.");
            console.error('Error:', error);
        });
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        const currentTime = getCurrentTime();
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.setAttribute('data-time', currentTime);
        messageElement.textContent = message;
        
        // Add with animation
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        chatBox.appendChild(messageElement);
        
        // Force reflow to enable animation
        messageElement.offsetHeight;
        
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
        
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Add bot message to chat
    function addBotMessage(message) {
        const currentTime = getCurrentTime();
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.setAttribute('data-time', currentTime);
        
        // Format message for better readability
        if (message.includes('Expense added successfully')) {
            message = formatSuccessMessage(message);
            
            // Add view all expenses button
            setTimeout(() => {
                const viewButton = document.createElement('button');
                viewButton.className = 'btn btn-sm btn-outline-primary mt-2';
                viewButton.innerHTML = '<i class="fas fa-list"></i> View All Expenses';
                viewButton.addEventListener('click', () => {
                    fetchAndDisplayExpenses();
                });
                
                messageElement.appendChild(viewButton);
                chatBox.scrollTop = chatBox.scrollHeight;
            }, 500);
        }
        
        // Handle HTML in messages
        if (message.includes('<') && message.includes('>')) {
            messageElement.innerHTML = message;
        } else {
            messageElement.textContent = message;
        }
        
        // Add with animation
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        chatBox.appendChild(messageElement);
        
        // Force reflow to enable animation
        messageElement.offsetHeight;
        
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
        
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Play notification sound
        playNotificationSound();
    }
    
    // Format success message with better structure
    function formatSuccessMessage(message) {
        if (message.includes('Expense added successfully')) {
            // Extract details from the success message
            const details = message.split('!')[1].trim();
            return `✅ Expense added successfully!\n${details}`;
        }
        return message;
    }
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Focus input field when page loads
    userInput.focus();

    // Handle expense edit in AI assistant
    function handleExpenseEdit(data) {
        // Store the expense data 
        const expenses = data;
        
        // Set global tracking variables
        isEditOperationActive = true;
        isDeleteOperationActive = false;
        activeExpenses = expenses;
        activeOperation = 'edit';
        
        // Add edit message with expense options
        const editMessage = createBotMessageElement();
        
        let editHtml = `<div><strong>Select an expense to edit:</strong></div><div class="expense-edit-list">`;
        expenses.forEach((expense, index) => {
            editHtml += `
                <div class="expense-edit-item" data-expense-id="${expense.id}">
                    <span class="expense-number">${index + 1}.</span>
                    <span class="expense-details">₹${parseFloat(expense.amount).toFixed(2)} for ${expense.category} on ${expense.date}</span>
                </div>
            `;
        });
        editHtml += `</div><p>Click on an expense to edit it, or type the number.</p>`;
        
        editMessage.innerHTML = editHtml;
        chatBox.appendChild(editMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Add click event listeners to the expense items
        const expenseItems = editMessage.querySelectorAll('.expense-edit-item');
        expenseItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Reset tracking when clicked
                isEditOperationActive = false;
                activeExpenses = null;
                activeOperation = null;
                
                showExpenseEditForm(expenses[index]);
            });
        });
        
        // Play notification sound
        playNotificationSound();
    }

    // Handle expense deletion
    function handleExpenseDelete(data) {
        // Store the expense data 
        const expenses = data;
        
        // Set global tracking variables
        isDeleteOperationActive = true;
        isEditOperationActive = false;
        activeExpenses = expenses;
        activeOperation = 'delete';
        
        // Add delete message with expense options
        const deleteMessage = createBotMessageElement();
        
        let deleteHtml = `<div><strong>Select an expense to delete:</strong></div><div class="expense-delete-list">`;
        expenses.forEach((expense, index) => {
            deleteHtml += `
                <div class="expense-delete-item" data-expense-id="${expense.id}">
                    <span class="expense-number">${index + 1}.</span>
                    <span class="expense-details">₹${parseFloat(expense.amount).toFixed(2)} for ${expense.category} on ${expense.date}</span>
                </div>
            `;
        });
        deleteHtml += `</div><p>Click on an expense to delete it, or type the number.</p>`;
        
        deleteMessage.innerHTML = deleteHtml;
        chatBox.appendChild(deleteMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Add click event listeners to the expense items
        const expenseItems = deleteMessage.querySelectorAll('.expense-delete-item');
        expenseItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Reset tracking when clicked
                isDeleteOperationActive = false;
                activeExpenses = null;
                activeOperation = null;
                
                confirmExpenseDelete(expenses[index]);
            });
        });
        
        // Play notification sound
        playNotificationSound();
    }

    // Confirm expense deletion
    function confirmExpenseDelete(expense) {
        // Reset all tracking variables completely
        isEditOperationActive = false;
        isDeleteOperationActive = false;
        activeExpenses = null;
        activeOperation = null;
        
        const confirmMessage = createBotMessageElement();
        
        // Format the amount for display
        const formattedAmount = parseFloat(expense.amount).toFixed(2);
        
        confirmMessage.innerHTML = `
            <div class="expense-confirm-delete" data-expense-id="${expense.id}">
                <div class="mb-3"><strong><i class="fas fa-exclamation-triangle text-danger me-2"></i>Confirm Deletion</strong></div>
                <p class="text-danger">Are you sure you want to permanently delete this expense?</p>
                <div class="expense-detail-card">
                    <div class="expense-detail-item">
                        <span class="expense-detail-label">Amount:</span>
                        <span class="expense-detail-value">₹${formattedAmount}</span>
                    </div>
                    <div class="expense-detail-item">
                        <span class="expense-detail-label">Category:</span>
                        <span class="expense-detail-value">${expense.category}</span>
                    </div>
                    <div class="expense-detail-item">
                        <span class="expense-detail-label">Date:</span>
                        <span class="expense-detail-value">${expense.date}</span>
                    </div>
                    ${expense.notes ? `
                    <div class="expense-detail-item">
                        <span class="expense-detail-label">Notes:</span>
                        <span class="expense-detail-value text-muted">${expense.notes}</span>
                    </div>` : ''}
                </div>
                <p class="text-muted mt-2 small">This action cannot be undone.</p>
                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-sm btn-danger confirm-delete">
                        <i class="fas fa-trash me-1"></i> Yes, Delete It
                    </button>
                    <button class="btn btn-sm btn-secondary cancel-delete">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        chatBox.appendChild(confirmMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Add event listeners to buttons
        const confirmBtn = confirmMessage.querySelector('.confirm-delete');
        const cancelBtn = confirmMessage.querySelector('.cancel-delete');
        
        confirmBtn.addEventListener('click', () => {
            // Disable buttons to prevent double submission
            confirmBtn.disabled = true;
            cancelBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Deleting...';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Send delete request to API
            fetch(`/api/expenses/${expense.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                removeTypingIndicator();
                
                if (data.success) {
                    addBotMessage("✅ Expense deleted successfully!");
                    // Offer to show updated expenses
                    setTimeout(() => {
                        const viewUpdatedButton = document.createElement('button');
                        viewUpdatedButton.className = 'btn btn-sm btn-primary mt-2';
                        viewUpdatedButton.innerHTML = '<i class="fas fa-sync-alt me-1"></i> View Updated Expenses';
                        viewUpdatedButton.addEventListener('click', () => {
                            fetchAndDisplayExpenses();
                        });
                        
                        // Add button to the last message
                        const messages = document.querySelectorAll('.bot-message');
                        const lastMessage = messages[messages.length - 1];
                        lastMessage.appendChild(viewUpdatedButton);
                    }, 500);
                } else {
                    addBotMessage(`❌ Failed to delete expense: ${data.error || 'Unknown error'}`);
                }
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, there was an error deleting the expense. Please try again later.");
                console.error('Error deleting expense:', error);
                
                // Re-enable buttons if there was an error
                confirmBtn.disabled = false;
                cancelBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-trash me-1"></i> Yes, Delete It';
            });
        });
        
        cancelBtn.addEventListener('click', () => {
            addBotMessage("Deletion cancelled. Is there anything else you'd like to do?");
        });
        
        // Play notification sound
        playNotificationSound();
    }

    // Show expense edit form
    function showExpenseEditForm(expense) {
        // Reset all tracking variables completely
        isEditOperationActive = false;
        isDeleteOperationActive = false;
        activeExpenses = null;
        activeOperation = null;
        
        const editFormMessage = createBotMessageElement();
        
        // Format the amount for display
        const formattedAmount = parseFloat(expense.amount).toFixed(2);
        
        // Create edit form UI
        editFormMessage.innerHTML = `
            <div class="expense-edit-form" data-expense-id="${expense.id}">
                <div class="mb-3"><strong><i class="fas fa-edit text-primary me-2"></i>Edit Expense</strong></div>
                <div class="expense-edit-card">
                    <div class="mb-3">
                        <label class="form-label">Amount (₹)</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-rupee-sign"></i></span>
                            <input type="number" class="form-control edit-amount" value="${formattedAmount}" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Category</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-tag"></i></span>
                            <input type="text" class="form-control edit-category" value="${expense.category}">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-calendar"></i></span>
                            <input type="text" class="form-control edit-date" value="${expense.date}" placeholder="DD-MM-YYYY">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notes</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-sticky-note"></i></span>
                            <input type="text" class="form-control edit-notes" value="${expense.notes || ''}">
                        </div>
                    </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-sm btn-primary save-edit">
                        <i class="fas fa-save me-1"></i> Save Changes
                    </button>
                    <button class="btn btn-sm btn-secondary cancel-edit">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        chatBox.appendChild(editFormMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Add event listeners to buttons
        const saveBtn = editFormMessage.querySelector('.save-edit');
        const cancelBtn = editFormMessage.querySelector('.cancel-edit');
        
        saveBtn.addEventListener('click', () => {
            // Disable buttons to prevent double submission
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
            
            // Get updated values
            const updatedExpense = {
                amount: parseFloat(editFormMessage.querySelector('.edit-amount').value),
                category: editFormMessage.querySelector('.edit-category').value.trim(),
                date: editFormMessage.querySelector('.edit-date').value.trim(),
                notes: editFormMessage.querySelector('.edit-notes').value.trim()
            };
            
            // Validate inputs
            if (isNaN(updatedExpense.amount) || updatedExpense.amount <= 0) {
                saveBtn.disabled = false;
                cancelBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
                addBotMessage("Please enter a valid amount greater than zero.");
                return;
            }
            
            if (!updatedExpense.category) {
                saveBtn.disabled = false;
                cancelBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
                addBotMessage("Please enter a category.");
                return;
            }
            
            // Validate date format (DD-MM-YYYY)
            if (!/^\d{2}-\d{2}-\d{4}$/.test(updatedExpense.date)) {
                saveBtn.disabled = false;
                cancelBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
                addBotMessage("Please enter a valid date in DD-MM-YYYY format.");
                return;
            }
            
            // Show typing indicator
            showTypingIndicator();
            
            // Send update request to API
            fetch(`/api/expenses/${expense.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedExpense)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                removeTypingIndicator();
                
                if (data.success) {
                    addBotMessage("✅ Expense updated successfully!");
                    // Offer to show updated expenses
                    setTimeout(() => {
                        const viewUpdatedButton = document.createElement('button');
                        viewUpdatedButton.className = 'btn btn-sm btn-primary mt-2';
                        viewUpdatedButton.innerHTML = '<i class="fas fa-sync-alt me-1"></i> View Updated Expenses';
                        viewUpdatedButton.addEventListener('click', () => {
                            fetchAndDisplayExpenses();
                        });
                        
                        // Add button to the last message
                        const messages = document.querySelectorAll('.bot-message');
                        const lastMessage = messages[messages.length - 1];
                        lastMessage.appendChild(viewUpdatedButton);
                    }, 500);
                } else {
                    addBotMessage(`❌ Failed to update expense: ${data.error || 'Unknown error'}`);
                    
                    // Re-enable buttons
                    saveBtn.disabled = false;
                    cancelBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
                }
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, there was an error updating the expense. Please try again later.");
                console.error('Error updating expense:', error);
                
                // Re-enable buttons if there was an error
                saveBtn.disabled = false;
                cancelBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
            });
        });
        
        cancelBtn.addEventListener('click', () => {
            addBotMessage("Edit cancelled. Is there anything else you'd like to do?");
        });
        
        // Focus the amount field
        setTimeout(() => {
            editFormMessage.querySelector('.edit-amount').focus();
        }, 100);
        
        // Play notification sound
        playNotificationSound();
    }

    // Add a sound test button to the page
    function addSoundTestButton() {
        const soundButton = document.createElement('button');
        soundButton.className = 'sound-test-btn';
        soundButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundButton.title = 'Test Notification Sound';
        
        soundButton.addEventListener('click', () => {
            playNotificationSound();
        });
        
        document.body.appendChild(soundButton);
    }

    // Add service worker registration for offline capabilities
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
    
    // Error tracking and reporting
    window.addEventListener('error', function(e) {
        console.error('Global error caught:', e.error.message);
        // In production, you would send this to your error tracking service
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        // In production, you would send this to your error tracking service
    });
}); 