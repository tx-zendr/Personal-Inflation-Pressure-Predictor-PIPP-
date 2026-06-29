document.addEventListener("DOMContentLoaded", () => {
    // --- STATE MANAGEMENT ---
    let currentStep = 1;
    let currentBackendOnline = false;
    let budgetChartInstance = null;
    let erosionChartInstance = null;

    // --- DOM ELEMENT REFERENCES ---
    const form = document.getElementById("inflation-form");
    const prevBtn = document.getElementById("btn-prev");
    const nextBtn = document.getElementById("btn-next");
    const submitBtn = document.getElementById("btn-submit");
    const recalculateBtn = document.getElementById("btn-recalculate");
    
    const wizardSection = document.getElementById("wizard-section");
    const dashboardSection = document.getElementById("dashboard-section");
    const loadingOverlay = document.getElementById("loading-overlay");
    const backendStatus = document.getElementById("backend-status");

    // Sliders & Values
    const desiredSavingsSlider = document.getElementById("input-desired-savings");
    const desiredSavingsVal = document.getElementById("val-desired-savings");

    // Dynamic lifestyle connections
    const categories = [
        { name: "groceries", inputId: "input-groceries", sliderId: "slider-savings-groceries", valId: "val-savings-groceries" },
        { name: "transport", inputId: "input-transport", sliderId: "slider-savings-transport", valId: "val-savings-transport" },
        { name: "eating-out", inputId: "input-eating-out", sliderId: "slider-savings-eating-out", valId: "val-savings-eating-out" },
        { name: "entertainment", inputId: "input-entertainment", sliderId: "slider-savings-entertainment", valId: "val-savings-entertainment" },
        { name: "healthcare", inputId: "input-healthcare", sliderId: "slider-savings-healthcare", valId: "val-savings-healthcare" },
        { name: "education", inputId: "input-education", sliderId: "slider-savings-education", valId: "val-savings-education" }
    ];

    // --- INITIALIZATION ---
    initSliders();
    checkApiConnection();
    // Poll API connection status every 10 seconds
    setInterval(checkApiConnection, 10000);

    // --- STEP NAVIGATION LOGIC ---
    nextBtn.addEventListener("click", () => {
        if (validateStep(currentStep)) {
            goToStep(currentStep + 1);
        }
    });

    prevBtn.addEventListener("click", () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });

    recalculateBtn.addEventListener("click", () => {
        dashboardSection.classList.add("hide");
        wizardSection.classList.remove("hide");
        // Reset to step 3 so the user can easily adjust savings or values
        goToStep(3);
    });

    function goToStep(step) {
        // Hide previous active step
        document.getElementById(`form-step-${currentStep}`).classList.remove("active");
        document.getElementById(`indicator-step-${currentStep}`).classList.remove("active");
        
        // Mark previous steps as completed
        if (step > currentStep) {
            document.getElementById(`indicator-step-${currentStep}`).classList.add("completed");
            // Mark the visual line filled
            const stepLine = document.querySelector(`#indicator-step-${currentStep} + .step-line`);
            if (stepLine) stepLine.classList.add("filled");
        } else {
            // Going backwards
            document.getElementById(`indicator-step-${step}`).classList.remove("completed");
            const stepLine = document.querySelector(`#indicator-step-${step} + .step-line`);
            if (stepLine) stepLine.classList.remove("filled");
        }

        currentStep = step;
        
        // Show current step
        document.getElementById(`form-step-${currentStep}`).classList.add("active");
        document.getElementById(`indicator-step-${currentStep}`).classList.add("active");

        // Button state handling
        if (currentStep === 1) {
            prevBtn.classList.add("disabled");
            prevBtn.disabled = true;
            nextBtn.classList.remove("hide");
            submitBtn.classList.add("hide");
        } else if (currentStep === 2) {
            prevBtn.classList.remove("disabled");
            prevBtn.disabled = false;
            nextBtn.classList.remove("hide");
            submitBtn.classList.add("hide");
        } else if (currentStep === 3) {
            prevBtn.classList.remove("disabled");
            prevBtn.disabled = false;
            nextBtn.classList.add("hide");
            submitBtn.classList.remove("hide");
        }
    }

    // --- FORM VALIDATION ---
    function validateStep(step) {
        let isValid = true;

        if (step === 1) {
            const income = document.getElementById("input-income");
            const age = document.getElementById("input-age");
            const dependents = document.getElementById("input-dependents");
            const occupation = document.getElementById("input-occupation");
            const cityTier = document.getElementById("input-city-tier");

            if (!income.value || Number(income.value) < 0) {
                showError("income");
                isValid = false;
            } else {
                clearError("income");
            }

            if (!age.value || Number(age.value) < 18 || Number(age.value) > 120) {
                showError("age");
                isValid = false;
            } else {
                clearError("age");
            }

            if (dependents.value === "" || Number(dependents.value) < 0) {
                showError("dependents");
                isValid = false;
            } else {
                clearError("dependents");
            }

            if (!occupation.value) {
                showError("occupation");
                isValid = false;
            } else {
                clearError("occupation");
            }

            if (!cityTier.value) {
                showError("city-tier");
                isValid = false;
            } else {
                clearError("city-tier");
            }
        } 
        else if (step === 2) {
            const rent = document.getElementById("input-rent");
            const loan = document.getElementById("input-loan");
            const insurance = document.getElementById("input-insurance");
            const utilities = document.getElementById("input-utilities");

            if (rent.value === "" || Number(rent.value) < 0) {
                showError("rent");
                isValid = false;
            } else {
                clearError("rent");
            }

            if (loan.value === "" || Number(loan.value) < 0) {
                showError("loan");
                isValid = false;
            } else {
                clearError("loan");
            }

            if (insurance.value === "" || Number(insurance.value) < 0) {
                showError("insurance");
                isValid = false;
            } else {
                clearError("insurance");
            }

            if (utilities.value === "" || Number(utilities.value) < 0) {
                showError("utilities");
                isValid = false;
            } else {
                clearError("utilities");
            }
        }
        else if (step === 3) {
            // Lifestyle values are positive numbers
            categories.forEach(cat => {
                const el = document.getElementById(cat.inputId);
                if (el.value === "" || Number(el.value) < 0) {
                    el.closest(".lifestyle-card").style.borderColor = "var(--accent-danger)";
                    isValid = false;
                } else {
                    el.closest(".lifestyle-card").style.borderColor = "";
                }
            });
        }

        return isValid;
    }

    function showError(fieldId) {
        const group = document.getElementById(`input-${fieldId}`).closest(".form-group");
        if (group) group.classList.add("has-error");
    }

    function clearError(fieldId) {
        const group = document.getElementById(`input-${fieldId}`).closest(".form-group");
        if (group) group.classList.remove("has-error");
    }

    // --- SLIDER VALUE CONTROLS ---
    function initSliders() {
        // Desired savings slider listener
        desiredSavingsSlider.addEventListener("input", (e) => {
            desiredSavingsVal.textContent = `${e.target.value}%`;
        });

        // Wire up lifestyle elements
        categories.forEach(cat => {
            const numInput = document.getElementById(cat.inputId);
            const slider = document.getElementById(cat.sliderId);
            const display = document.getElementById(cat.valId);

            // Handle current expense input changing -> set slider max limit
            numInput.addEventListener("input", () => {
                const val = Math.max(0, Number(numInput.value) || 0);
                slider.max = val;
                
                // Keep the current slider value in range
                if (Number(slider.value) > val) {
                    slider.value = val;
                    display.textContent = `$${val}`;
                }
            });

            // Handle slider dragging -> update display text
            slider.addEventListener("input", (e) => {
                display.textContent = `$${e.target.value}`;
            });
        });
    }

    // --- FORM SUBMIT & PREDICT ENGINE ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validateStep(3)) return;

        // Show loader overlay
        loadingOverlay.classList.remove("hide");

        // Construct Request Payload
        const formData = new FormData(form);
        const payload = {
            Income: Number(formData.get("Income")),
            Age: parseInt(formData.get("Age")),
            Dependents: parseInt(formData.get("Dependents")),
            Desired_Savings_Percentage: Number(formData.get("Desired_Savings_Percentage")),
            
            Rent: Number(formData.get("Rent")) || 0,
            Loan_Repayment: Number(formData.get("Loan_Repayment")) || 0,
            Insurance: Number(formData.get("Insurance")) || 0,
            Utilities: Number(formData.get("Utilities")) || 0,
            
            Groceries: Number(formData.get("Groceries")) || 0,
            Transport: Number(formData.get("Transport")) || 0,
            Eating_Out: Number(formData.get("Eating_Out")) || 0,
            Entertainment: Number(formData.get("Entertainment")) || 0,
            Healthcare: Number(formData.get("Healthcare")) || 0,
            Education: Number(formData.get("Education")) || 0,

            // Savings inputs are read dynamically via slider values
            Potential_Savings_Groceries: Number(document.getElementById("slider-savings-groceries").value) || 0,
            Potential_Savings_Transport: Number(document.getElementById("slider-savings-transport").value) || 0,
            Potential_Savings_Eating_Out: Number(document.getElementById("slider-savings-eating-out").value) || 0,
            Potential_Savings_Entertainment: Number(document.getElementById("slider-savings-entertainment").value) || 0,
            Potential_Savings_Healthcare: Number(document.getElementById("slider-savings-healthcare").value) || 0,
            Potential_Savings_Education: Number(document.getElementById("slider-savings-education").value) || 0,

            Occupation: formData.get("Occupation"),
            City_Tier: formData.get("City_Tier")
        };

        // Query the Predictor API
        const result = await InflationAPI.predict(payload);

        // Hide loading
        loadingOverlay.classList.add("hide");

        // Draw Dashboard Results
        renderDashboard(result, payload);
    });

    // --- HEALTH CHECKS ---
    async function checkApiConnection() {
        const isOnline = await InflationAPI.checkHealth();
        currentBackendOnline = isOnline;

        backendStatus.className = "status-badge " + (isOnline ? "status-online" : "status-offline");
        
        const textEl = backendStatus.querySelector(".status-text");
        if (isOnline) {
            textEl.innerHTML = '<i class="fa-solid fa-server-network"></i> Live API Connected';
        } else {
            textEl.innerHTML = '<i class="fa-solid fa-cloud-slash"></i> Offline (Local Mock Mode)';
        }
    }

    // --- RENDER RESULTS ON DASHBOARD ---
    function renderDashboard(data, inputs) {
        // Toggle sections
        wizardSection.classList.add("hide");
        dashboardSection.classList.remove("hide");

        // Set Text Stats
        document.getElementById("gauge-value").textContent = `${data.predicted_inflation_rate}%`;
        document.getElementById("val-national-inflation").textContent = `${data.base_national_inflation}%`;
        document.getElementById("val-adjusted-inflation").textContent = `${data.adjusted_inflation_rate}%`;
        document.getElementById("val-deflation-savings").textContent = `$${data.monthly_savings_amount}`;

        // Compute angle for Conic Gauge (assuming 0-15% is the scale of gauge)
        const maxExpectedRate = 15;
        const boundedRate = Math.min(maxExpectedRate, Math.max(0, data.predicted_inflation_rate));
        const fillDegree = (boundedRate / maxExpectedRate) * 180; // 180 degrees scale semi-circle or full conic
        
        // CSS custom gradients update
        const gaugeFill = document.getElementById("gauge-fill-deg");
        gaugeFill.style.background = `conic-gradient(from 180deg, var(--accent-cyan) 0deg, var(--accent-purple) ${fillDegree * 2}deg, #1F2937 ${fillDegree * 2}deg)`;

        // Recommendations rendering
        const recsContainer = document.getElementById("recommendations-container");
        recsContainer.innerHTML = "";
        
        data.recommendations.forEach((rec, idx) => {
            const item = document.createElement("div");
            item.className = "rec-item";
            
            // Give recommendations themed icons based on text details
            let iconClass = "fa-solid fa-info-circle icon-cyan";
            if (rec.includes("savings rate") || rec.includes("Excellent")) {
                iconClass = "fa-solid fa-piggy-bank icon-green";
            } else if (rec.includes("Groceries")) {
                iconClass = "fa-solid fa-basket-shopping icon-purple";
            } else if (rec.includes("Housing") || rec.includes("Rent")) {
                iconClass = "fa-solid fa-house-chimney icon-gold";
            } else if (rec.includes("savings plan")) {
                iconClass = "fa-solid fa-bolt-lightning icon-green";
            }
            
            item.innerHTML = `
                <i class="${iconClass}"></i>
                <p class="rec-text">${rec}</p>
            `;
            recsContainer.appendChild(item);
        });

        // Initialize Charts
        renderBudgetChart(data.spending_breakdown, inputs);
        renderTimelineChart(data.predicted_inflation_rate, data.adjusted_inflation_rate, data.base_national_inflation);
    }

    // --- CHART.JS CONFIGURATIONS ---
    function renderBudgetChart(breakdown, inputs) {
        if (budgetChartInstance) {
            budgetChartInstance.destroy();
        }

        const ctx = document.getElementById("budgetBreakdownChart").getContext("2d");
        
        // Clean display labels matching incoming keys
        const labels = Object.keys(breakdown).map(k => k.replace("_", " "));
        const dataValues = Object.values(breakdown);

        budgetChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: [
                        'rgba(124, 58, 237, 0.7)',  // Rent
                        'rgba(79, 70, 229, 0.7)',   // Loans
                        'rgba(59, 130, 246, 0.7)',  // Insurance
                        'rgba(6, 182, 212, 0.7)',   // Utilities
                        'rgba(16, 185, 129, 0.7)',  // Groceries
                        'rgba(245, 158, 11, 0.7)',  // Transport
                        'rgba(239, 68, 68, 0.7)',   // Eating Out
                        'rgba(236, 72, 153, 0.7)',  // Entertainment
                        'rgba(139, 92, 246, 0.7)',  // Healthcare
                        'rgba(107, 114, 128, 0.7)'  // Education
                    ],
                    borderColor: 'rgba(13, 19, 31, 0.9)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#D1D5DB',
                            font: {
                                family: 'Inter',
                                size: 10
                            },
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderTimelineChart(personal, optimized, national) {
        if (erosionChartInstance) {
            erosionChartInstance.destroy();
        }

        const ctx = document.getElementById("purchasingPowerChart").getContext("2d");
        
        // Calculate compounding decay over 10 years for $10,000 baseline
        const initialCapital = 10000;
        const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        const personalCurve = years.map(y => Math.round(initialCapital * Math.pow(1 - (personal / 100), y)));
        const optimizedCurve = years.map(y => Math.round(initialCapital * Math.pow(1 - (optimized / 100), y)));
        const nationalCurve = years.map(y => Math.round(initialCapital * Math.pow(1 - (national / 100), y)));

        erosionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => `Yr ${y}`),
                datasets: [
                    {
                        label: 'Personal Inflation',
                        data: personalCurve,
                        borderColor: '#7C3AED',
                        backgroundColor: 'rgba(124, 58, 237, 0.05)',
                        borderWidth: 3,
                        pointBackgroundColor: '#7C3AED',
                        tension: 0.25,
                        fill: true
                    },
                    {
                        label: 'Optimized Plan',
                        data: optimizedCurve,
                        borderColor: '#10B981',
                        backgroundColor: 'transparent',
                        borderWidth: 2.5,
                        borderDash: [5, 5],
                        pointBackgroundColor: '#10B981',
                        tension: 0.25
                    },
                    {
                        label: 'National Baseline',
                        data: nationalCurve,
                        borderColor: '#06B6D4',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: '#06B6D4',
                        tension: 0.25
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#D1D5DB',
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)'
                        },
                        ticks: {
                            color: '#9CA3AF'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)'
                        },
                        ticks: {
                            color: '#9CA3AF',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
});
