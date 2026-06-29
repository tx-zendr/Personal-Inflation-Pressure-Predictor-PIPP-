import os
import joblib
import pandas as pd
import numpy as np

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel, Field

import shap

# ---------------------------
# APP SETUP
# ---------------------------
app = FastAPI(title="Inflation Predictor API")
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# LOAD MODEL
# ---------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
pipeline = joblib.load(MODEL_PATH)

preprocessor = pipeline.named_steps["preprocess"]
model = pipeline.named_steps["model"]

explainer = shap.TreeExplainer(model)

# ---------------------------
# INPUT SCHEMA
# ---------------------------
class InflationPredictionRequest(BaseModel):
    Income: float = Field(..., ge=0)
    Age: int = Field(..., ge=18, le=120)
    Dependents: int = Field(..., ge=0)
    Desired_Savings_Percentage: float = Field(..., ge=0, le=100)

    Rent: float = Field(..., ge=0)
    Loan_Repayment: float = Field(..., ge=0)
    Insurance: float = Field(..., ge=0)
    Groceries: float = Field(..., ge=0)
    Transport: float = Field(..., ge=0)
    Eating_Out: float = Field(..., ge=0)
    Entertainment: float = Field(..., ge=0)
    Utilities: float = Field(..., ge=0)
    Healthcare: float = Field(..., ge=0)
    Education: float = Field(..., ge=0)

    Potential_Savings_Groceries: float = Field(..., ge=0)
    Potential_Savings_Transport: float = Field(..., ge=0)
    Potential_Savings_Eating_Out: float = Field(..., ge=0)
    Potential_Savings_Entertainment: float = Field(..., ge=0)
    Potential_Savings_Healthcare: float = Field(..., ge=0)
    Potential_Savings_Education: float = Field(..., ge=0)

    Occupation: str
    City_Tier: str


# ---------------------------
# HELPER
# ---------------------------
def safe_sum(d, keys):
    return sum(d.get(k, 0) for k in keys)


# ---------------------------
# PREDICT ENDPOINT
# ---------------------------
@app.get("/")
def home():
    return {"status": "API is running"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True
    }


@app.post("/predict")
def predict(request: InflationPredictionRequest):

    input_dict = request.model_dump()
    income = input_dict["Income"] if input_dict["Income"] > 0 else 1.0

    engineered_dict = {
        "Occupation": input_dict["Occupation"],
        "City_Tier": input_dict["City_Tier"],
        "Age": input_dict["Age"],
        "Dependents": input_dict["Dependents"]
    }

    expense_categories = [
        "Rent", "Loan_Repayment", "Insurance", "Groceries", "Transport",
        "Eating_Out", "Entertainment", "Utilities", "Healthcare", "Education"
    ]
    
    for cat in expense_categories:
        engineered_dict[f"{cat}_Ratio"] = input_dict[cat] / income
    
        savings_key = f"Potential_Savings_{cat}"
        if savings_key in input_dict:
            engineered_dict[f"{savings_key}_Ratio"] = input_dict[savings_key] / income

    df_engineered = pd.DataFrame([engineered_dict])

    # ---------------------------
    # 2. MODEL PREDICTION (Calculated using ratios)
    # ---------------------------
    pred = float(pipeline.predict(df_engineered)[0])

    # ---------------------------
    # 3. COUNTERFACTUAL (AFTER SAVINGS RATIO OPTIMIZATION)
    # ---------------------------
    cf_dict = engineered_dict.copy()

    # Apply counterfactual drops relative to the income baseline scale
    optimizable_cols = [
        "Groceries", "Transport", "Eating_Out", 
        "Entertainment", "Healthcare", "Education"
    ]

    for c in optimizable_cols:
        if f"Potential_Savings_{c}_Ratio" in cf_dict:
            cf_dict[f"{c}_Ratio"] = max(
                0.0,
                engineered_dict[f"{c}_Ratio"] - engineered_dict[f"Potential_Savings_{c}_Ratio"]
            )

    cf_df = pd.DataFrame([cf_dict])
    adjusted_pred = float(pipeline.predict(cf_df)[0])

    # ---------------------------
    # 4. BUSINESS LOGIC METRICS (Raw currency for frontend stats)
    # ---------------------------
    total_expenses = safe_sum(input_dict, expense_categories)

    potential_savings_keys = [f"Potential_Savings_{c}" for c in optimizable_cols if f"Potential_Savings_{c}" in input_dict]
    total_potential_savings = safe_sum(input_dict, potential_savings_keys)

    # ---------------------------
    # 5. SHAP ATTRIBUTION CLEAN PARSING
    # ---------------------------
    transformed = preprocessor.transform(df_engineered)

    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()

    shap_output = explainer(transformed)
    
    if isinstance(shap_output, np.ndarray):
        shap_vals = shap_output[0]
    elif hasattr(shap_output, "values") and isinstance(shap_output.values, np.ndarray):
        shap_vals = shap_output.values[0]
    else:
        shap_vals = getattr(shap_output, "values", shap_output)[0]

    feature_names = preprocessor.get_feature_names_out()

    # Map pipeline features cleanly back to clean base categories
    category_impacts = {cat: 0.0 for cat in expense_categories}
    
    for name, val in zip(feature_names, shap_vals):
        # Extract name (e.g., 'num__Rent_Ratio' -> 'Rent_Ratio')
        clean_name = name.split("__")[-1] if "__" in name else name
        # Strip suffix (e.g., 'Rent_Ratio' -> 'Rent')
        base_key = clean_name.replace("_Ratio", "")
        
        if base_key in category_impacts:
            category_impacts[base_key] += abs(float(val))

    # Normalize values into percentage breakdowns for client chart tracking
    total_impact_sum = sum(category_impacts.values()) or 1.0
    spending_breakdown = {
        cat: round((val / total_impact_sum) * 100, 2)
        for cat, val in category_impacts.items()
    }

    # Scale metrics to percentage values
    savings_impact = max(0.0, (pred - adjusted_pred)*100) 

    # ---------------------------
    # 6. RECOMMENDATIONS 
    # ---------------------------
    recs = []

    if total_impact_sum > 0:
        highest_driver = max(category_impacts, key=category_impacts.get)
        if category_impacts[highest_driver] > 0.001:
            recs.append(f"AI Explainability Insight: Your **{highest_driver}** profile has the highest marginal contribution to your personal inflation tracking score.")

    if input_dict["Eating_Out"] > 0.2 * input_dict["Income"] and input_dict["Income"] > 0:
        recs.append("High spending on dining out detected.")

    if input_dict["Transport"] > 0.15 * input_dict["Income"] and input_dict["Income"] > 0:
        recs.append("Transport costs are relatively high.")

    if savings_impact > 0:
        recs.append(f"Savings optimization successfully reduces your model-predicted inflation exposure by {round(savings_impact, 2)}%.")

    # ---------------------------
    # 7. RESPONSE PAYLOAD
    # ---------------------------
    return {
        "predicted_inflation_rate": float(round(pred * 100, 2)),
        "adjusted_inflation_rate": float(round(adjusted_pred * 100, 2)),
        "base_national_inflation": 5.5,
        "savings_impact": float(round(savings_impact, 2)),
        "monthly_savings_amount": float(round(total_potential_savings, 2)),
        "total_expenses": float(round(total_expenses, 2)),
        "spending_breakdown": spending_breakdown,
        "recommendations": recs,
        "is_mock_model": False
    }
