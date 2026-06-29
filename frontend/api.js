const BACKEND_URL = "http://127.0.0.1:8000";

class InflationAPI {
    /**
     * Pings the FastAPI health check endpoint.
     * @returns {Promise<boolean>} True if online, false if offline
     */
    static async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
            
            const response = await fetch(`${BACKEND_URL}/health`, { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                return data.status === "healthy";
            }
            return false;
        } catch (error) {
            console.warn("Backend server is offline. Falling back to local simulation.", error);
            return false;
        }
    }

    /**
     * Posts user features to the FastAPI server. If offline, runs a local simulation.
     * @param {Object} data User inputs
     * @returns {Promise<Object>} The prediction results matching InflationPredictionResponse schema
     */
    static async predict(data) {
        try {
            const response = await fetch(`${BACKEND_URL}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.warn("Failed to communicate with FastAPI backend. Executing client-side prediction heuristic.", error);
            // Simulate API processing delay for aesthetics
            await new Promise(resolve => setTimeout(resolve, 800));
            return this.calculateLocalPrediction(data);
        }
    }

    /**
     * Replicates the backend calculation locally when the server is unavailable.
     * Keeps the app 100% interactive and reliable.
     */
    static calculateLocalPrediction(req) {
        const SECTOR_INFLATION = {
            Rent: 0.060,
            Loan_Repayment: 0.025,
            Insurance: 0.030,
            Groceries: 0.072,
            Transport: 0.054,
            Eating_Out: 0.048,
            Entertainment: 0.045,
            Utilities: 0.065,
            Healthcare: 0.078,
            Education: 0.082
        };
        
        const expenses = {
            Rent: Number(req.Rent) || 0,
            Loan_Repayment: Number(req.Loan_Repayment) || 0,
            Insurance: Number(req.Insurance) || 0,
            Groceries: Number(req.Groceries) || 0,
            Transport: Number(req.Transport) || 0,
            Eating_Out: Number(req.Eating_Out) || 0,
            Entertainment: Number(req.Entertainment) || 0,
            Utilities: Number(req.Utilities) || 0,
            Healthcare: Number(req.Healthcare) || 0,
            Education: Number(req.Education) || 0
        };
        
        const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
        const activeTotal = totalExpenses === 0 ? 1 : totalExpenses;
        
        // Calculate percentage spending breakdown
        const spendingBreakdown = {};
        for (const [k, v] of Object.entries(expenses)) {
            spendingBreakdown[k] = Number(((v / activeTotal) * 100).toFixed(2));
        }
        
        // Calculate weighted inflation sum
        let weightedInflationSum = 0;
        for (const [category, amount] of Object.entries(expenses)) {
            const rate = SECTOR_INFLATION[category] || 0.05;
            weightedInflationSum += amount * rate;
        }
        
        let personalInflation = weightedInflationSum / activeTotal;
        
        // City Tier adjustments
        let cityAdj = 0;
        if (req.City_Tier === "Tier_1") {
            cityAdj = 0.008;
        } else if (req.City_Tier === "Tier_2") {
            cityAdj = 0.003;
        } else {
            cityAdj = -0.002;
        }
        personalInflation += cityAdj;
        
        // Age adjustments
        let ageAdj = 0;
        const age = Number(req.Age) || 30;
        if (age > 60) {
            ageAdj = 0.002;
        } else if (age < 25) {
            ageAdj = 0.001;
        }
        personalInflation += ageAdj;
        
        const personalInflationPct = personalInflation * 100;
        
        // Calculate potential savings
        const potentialSavings = {
            Groceries: Math.min(Number(req.Potential_Savings_Groceries) || 0, expenses.Groceries),
            Transport: Math.min(Number(req.Potential_Savings_Transport) || 0, expenses.Transport),
            Eating_Out: Math.min(Number(req.Potential_Savings_Eating_Out) || 0, expenses.Eating_Out),
            Entertainment: Math.min(Number(req.Potential_Savings_Entertainment) || 0, expenses.Entertainment),
            Healthcare: Math.min(Number(req.Potential_Savings_Healthcare) || 0, expenses.Healthcare),
            Education: Math.min(Number(req.Potential_Savings_Education) || 0, expenses.Education)
        };
        
        const totalPotentialSavings = Object.values(potentialSavings).reduce((sum, val) => sum + val, 0);
        
        // Calculate new adjusted expenses
        const adjustedExpenses = { ...expenses };
        for (const [cat, val] of Object.entries(potentialSavings)) {
            adjustedExpenses[cat] = Math.max(0, expenses[cat] - val);
        }
        
        let adjustedWeightedSum = 0;
        for (const [category, amount] of Object.entries(adjustedExpenses)) {
            const rate = SECTOR_INFLATION[category] || 0.05;
            adjustedWeightedSum += amount * rate;
        }
        const adjustedInflation = (adjustedWeightedSum / totalExpenses) + cityAdj + ageAdj;
        const adjustedInflationPct = adjustedInflation * 100;
        
        const savingsImpact = Math.max(0, personalInflationPct - adjustedInflationPct);
        const income = Number(req.Income) || 0;
        const desiredSavings = Number(req.Desired_Savings_Percentage) || 0;
        
        // Create recommendations
        const recs = [];
        let savingRate = 0;
        if (income > 0) {
            savingRate = ((income - totalExpenses) / income) * 100;
        }
        
        if (savingRate < desiredSavings) {
            recs.append?.(
                `Your current savings rate is ${savingRate.toFixed(1)}%, which is below your target of ${desiredSavings}%. Reducing expenses is crucial to meeting your financial goals.`
            ) || recs.push(
                `Your current savings rate is ${savingRate.toFixed(1)}%, which is below your target of ${desiredSavings}%. Reducing expenses is crucial to meeting your financial goals.`
            );
        } else {
            recs.push(`Excellent! Your current savings rate is ${savingRate.toFixed(1)}%, which exceeds your target of ${desiredSavings}%.`);
        }
        
        if (spendingBreakdown.Groceries > 20) {
            recs.push("Groceries account for over 20% of your expenses. Because food inflation is high (7.2%), this strongly drives up your personal inflation rate. Consider bulk-buying or generic brands.");
        }
        if (spendingBreakdown.Rent > 35) {
            recs.push("Housing/Rent is consuming more than 35% of your budget. High rental inflation (6.0%) makes your long-term cost of living vulnerable. Exploring a lease extension or flat-sharing could stabilize this.");
        }
        if (expenses.Eating_Out > 0 && potentialSavings.Eating_Out > 0) {
            const pctEatingOutSaved = (potentialSavings.Eating_Out / expenses.Eating_Out) * 100;
            if (pctEatingOutSaved > 20) {
                recs.push(`You identified a potential ${pctEatingOutSaved.toFixed(0)}% saving in Eating Out. Cutting down on restaurant deliveries would directly shave off $${potentialSavings.Eating_Out}/month with minimal lifestyle impact.`);
            }
        }
        if (totalPotentialSavings > 0) {
            recs.push(`By executing your savings plan, you save $${totalPotentialSavings}/month, which lowers your exposure to high-inflation categories and reduces your Personal Inflation Rate by ${savingsImpact.toFixed(2)} percentage points.`);
        } else {
            recs.push("Review your expenses and try setting positive potential savings. Adjusting small discretionary outlays shelters you from inflation risk.");
        }
        
        return {
            predicted_inflation_rate: Number(personalInflationPct.toFixed(2)),
            adjusted_inflation_rate: Number(adjustedInflationPct.toFixed(2)),
            base_national_inflation: 5.5,
            savings_impact: Number(savingsImpact.toFixed(2)),
            monthly_savings_amount: Number(totalPotentialSavings.toFixed(2)),
            total_expenses: Number(totalExpenses.toFixed(2)),
            spending_breakdown: spendingBreakdown,
            recommendations: recs,
            is_mock_model: true
        };
    }
}
