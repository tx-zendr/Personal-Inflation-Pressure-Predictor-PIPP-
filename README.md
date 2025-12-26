# Personal-Inflation-Pressure-Predictor-PIPP-
Machine learning system to estimate individual inflation pressure using income structure, spending rigidity, and explainable AI (SHAP)
👇

📌 Personal Inflation Pressure Predictor (PIPP)
📖 Overview

Inflation impacts individuals differently based on income structure, spending rigidity, and financial flexibility.
This project builds a machine learning model to estimate personal inflation pressure for an individual using demographic, income, and savings flexibility signals — without relying on raw expense magnitudes.

The goal is to provide an interpretable, leakage-free, and realistic financial ML system.

🎯 Problem Statement

Traditional inflation metrics are macroeconomic and fail to capture individual-level vulnerability.

This project answers:

How vulnerable is a person to inflation based on their financial rigidity and adaptability?

🧠 Target Variable

Inflation Pressure is defined as:

Inflation Pressure
=
1
−
Disposable Income
Income
Inflation Pressure=1−
Income
Disposable Income
	​


Value range: 0 → 1

Higher value → higher financial stress due to inflation

📊 Dataset Description

The dataset contains 20,000 individual financial profiles, including:

Demographics

Age

Dependents

Occupation

City Tier

Financial Signals

Income

Desired Savings Percentage

Fixed vs Flexible expense categories

Potential savings across categories (Groceries, Healthcare, Utilities, etc.)

⚠️ Raw expense amounts were intentionally excluded to prevent data leakage and arithmetic shortcuts.

🔧 Feature Engineering

Fixed / Flexible Expense Counts to capture spending rigidity

Potential Savings by Category to represent adaptability

Ordinal Encoding for City Tier

One-Hot Encoding for Occupation

🤖 Model Used

Random Forest Regressor

300 estimators

Max depth = 10

Chosen for:

Non-linear learning

Robustness

Strong interpretability with SHAP

📈 Model Performance
Metric	Score
MAE	0.0321
R² Score	0.8272

These results indicate strong generalization without overfitting.

🔍 Explainability (SHAP)

To ensure transparency:

SHAP Summary Plot explains global feature importance

SHAP Force Plots explain individual predictions

Key Insights:

Inflation pressure is driven more by expense rigidity than spending amount

Living in higher-tier cities increases vulnerability

Higher income and savings flexibility act as buffers

Categories like healthcare and utilities matter due to low flexibility, not excess spending

🚦 Inflation Risk Bands

Model predictions are converted into intuitive risk levels:

Score Range	Risk Level
< 0.30	Low Inflation Pressure
0.30 – 0.60	Moderate Inflation Pressure
> 0.60	High Inflation Pressure

This mirrors real-world financial risk scoring systems.

🧪 Tech Stack

Python

Pandas, NumPy

Scikit-learn

SHAP

Matplotlib / Seaborn

📌 Key Design Principles

❌ No data leakage

❌ No direct expense prediction

✅ Explainable ML

✅ Financial realism

✅ Ethical modeling

🚀 Future Enhancements

Policy impact simulation

Time-based inflation sensitivity

Interactive dashboard (Streamlit)

🏁 Conclusion

This project demonstrates how machine learning can be applied responsibly in personal finance by focusing on financial structure and adaptability, rather than raw spending behavior.
