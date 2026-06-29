# Personal Inflation Pressure Pridictor

An end-to-end Machine Learning web application that predicts a user's personalized inflation exposure index based on demographic and lifestyle spending profiles. The system leverages an optimized XGBoost Regressor coupled with SHAP (SHapley Additive exPlanations) to dynamically isolate and map individual risk-vulnerability segments back to a responsive frontend visualization dashboard.

---
## Live Demo 

https://personal-inflation-pressure-predictor.onrender.com/ui/
 ---
## 🚀 Key Engineering Architectural Highlights
* **Feature Proportion Engineering:** Mitigated system-wide data leakage by refactoring raw fiscal currency inputs into Income-Proportion Ratios, improving true model generalization.
* **Explainable AI Pipeline:** Integrated a tree-based SHAP explainability kernel directly inside a FastAPI production serving script to provide deterministic, real-time feature attribution scores.
* **Counterfactual Risk Evaluation:** Built an isolated backend state engine to calculate instant comparative "Optimized Savings" models on single API request passes.

---

## 🛠️ Tech Stack & System Components

* **Backend Engine:** FastAPI (Python), Uvicorn ASG Server
* **Machine Learning Pipeline:** Scikit-Learn (ColumnTransformers, StandardScaler, OneHotEncoder), XGBoost Regressor
* **Explainability Kernel:** SHAP Framework
* **Frontend UI Matrix:** HTML5, CSS3, JavaScript (Chart.js for responsive doughnut charts)

---

## 📊 Core Data Architecture & Pipeline Design

To evaluate personal financial vulnerability without leaking deterministic target formulas, raw currency values are transformed into normalized income footprints before being processed by the gradient-boosted decision trees.

### Data Request Flow
1. **Payload Ingestion:** The FastAPI endpoint consumes raw JSON spending metrics in Rupees.
2. **Feature Engineering Wrapper:** Normalizes expenditures into percentage baselines using the formula:
   $$\text{Category Ratio} = \frac{\text{Category Expenditure}}{\text{Income}}$$
3. **Pipeline Transformation:** Sequentially scales continuous numerical variants and multi-class categorical labels (`City_Tier`, `Occupation`).
4. **XGBoost Regressor Inference:** Generates the predictive base inflation tracking rate.
5. **SHAP Tree Extraction:** Deconstructs the local prediction vector into absolute marginal contribution scores to feed frontend visualizations.

---

## 📈 Model Performance Verification
The model was evaluated against an un-aggregated cross-validation dataset of 20,000 synthetic consumer entries:

* **Mean Absolute Error (MAE):** 0.0033
* **R² Score:** 0.9978 (Highly optimized tracking fit across engineered ratio distributions)

---

## 💻 Quickstart: Local Setup & Deployment

Follow these steps to spin up the local development server and backend API environment.

### 1. Clone the Repository
```bash
git clone [https://github.com/][https://github.com/tx-zendr/Personal-Inflation-Pressure-Predictor-PIPP-.git]
cd inflation-optimization-engine
