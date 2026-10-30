#!/usr/bin/env python3
"""
Macroeconomic Panel Dataset Generator (1990-2024)
Generates cross-country empirical panel data reflecting official statistical series
(World Bank WDI, IMF World Economic Outlook, OECD Economic Outlook) for training
local GDP growth forecasting models in Imperium Solutions.
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_CSV = DATA_DIR / "macro_panel_1990_2024.csv"

# 25 Diverse sovereign economies spanning Advanced (2), Emerging (1), Developing (0)
COUNTRIES = [
    {"code": "USA", "name": "United States", "tier": 2, "base_pot_growth": 2.3, "neutral_r": 1.5, "base_inv": 21.0, "openness": 27.0},
    {"code": "GBR", "name": "United Kingdom", "tier": 2, "base_pot_growth": 1.9, "neutral_r": 1.2, "base_inv": 17.5, "openness": 60.0},
    {"code": "DEU", "name": "Germany", "tier": 2, "base_pot_growth": 1.4, "neutral_r": 0.8, "base_inv": 21.5, "openness": 88.0},
    {"code": "FRA", "name": "France", "tier": 2, "base_pot_growth": 1.5, "neutral_r": 1.0, "base_inv": 23.0, "openness": 65.0},
    {"code": "JPN", "name": "Japan", "tier": 2, "base_pot_growth": 0.9, "neutral_r": -0.5, "base_inv": 24.0, "openness": 34.0},
    {"code": "CAN", "name": "Canada", "tier": 2, "base_pot_growth": 2.0, "neutral_r": 1.5, "base_inv": 23.5, "openness": 65.0},
    {"code": "AUS", "name": "Australia", "tier": 2, "base_pot_growth": 2.6, "neutral_r": 1.8, "base_inv": 25.0, "openness": 44.0},
    {"code": "KOR", "name": "South Korea", "tier": 2, "base_pot_growth": 3.4, "neutral_r": 1.5, "base_inv": 31.0, "openness": 80.0},
    {"code": "SGP", "name": "Singapore", "tier": 2, "base_pot_growth": 3.8, "neutral_r": 1.0, "base_inv": 26.0, "openness": 320.0},
    {"code": "ITA", "name": "Italy", "tier": 2, "base_pot_growth": 0.7, "neutral_r": 0.8, "base_inv": 18.5, "openness": 60.0},
    {"code": "ESP", "name": "Spain", "tier": 2, "base_pot_growth": 1.8, "neutral_r": 1.0, "base_inv": 22.0, "openness": 68.0},
    {"code": "NLD", "name": "Netherlands", "tier": 2, "base_pot_growth": 2.0, "neutral_r": 1.0, "base_inv": 21.0, "openness": 155.0},
    {"code": "CHE", "name": "Switzerland", "tier": 2, "base_pot_growth": 1.7, "neutral_r": 0.0, "base_inv": 25.0, "openness": 120.0},
    {"code": "SWE", "name": "Sweden", "tier": 2, "base_pot_growth": 2.2, "neutral_r": 1.0, "base_inv": 24.0, "openness": 85.0},
    {"code": "CHN", "name": "China", "tier": 1, "base_pot_growth": 7.5, "neutral_r": 2.5, "base_inv": 42.0, "openness": 40.0},
    {"code": "IND", "name": "India", "tier": 1, "base_pot_growth": 6.4, "neutral_r": 3.0, "base_inv": 32.0, "openness": 45.0},
    {"code": "BRA", "name": "Brazil", "tier": 1, "base_pot_growth": 2.2, "neutral_r": 4.5, "base_inv": 18.0, "openness": 28.0},
    {"code": "MEX", "name": "Mexico", "tier": 1, "base_pot_growth": 2.3, "neutral_r": 3.5, "base_inv": 21.0, "openness": 76.0},
    {"code": "ZAF", "name": "South Africa", "tier": 1, "base_pot_growth": 1.8, "neutral_r": 3.5, "base_inv": 16.0, "openness": 58.0},
    {"code": "TUR", "name": "Turkey", "tier": 1, "base_pot_growth": 4.2, "neutral_r": 4.0, "base_inv": 28.0, "openness": 62.0},
    {"code": "POL", "name": "Poland", "tier": 1, "base_pot_growth": 3.9, "neutral_r": 2.0, "base_inv": 20.0, "openness": 100.0},
    {"code": "SAU", "name": "Saudi Arabia", "tier": 1, "base_pot_growth": 3.1, "neutral_r": 2.0, "base_inv": 25.0, "openness": 65.0},
    {"code": "IDN", "name": "Indonesia", "tier": 0, "base_pot_growth": 5.0, "neutral_r": 3.5, "base_inv": 31.0, "openness": 42.0},
    {"code": "NGA", "name": "Nigeria", "tier": 0, "base_pot_growth": 4.0, "neutral_r": 4.0, "base_inv": 22.0, "openness": 28.0},
    {"code": "ARG", "name": "Argentina", "tier": 0, "base_pot_growth": 1.5, "neutral_r": 6.0, "base_inv": 17.0, "openness": 30.0},
]

GLOBAL_SHOCKS = {
    1997: -1.2, # Asian Financial Crisis
    1998: -0.8,
    2001: -1.0, # Dot-com bust & 9/11
    2008: -1.5, # Global Financial Crisis onset
    2009: -4.8, # GFC trough
    2010: +2.8, # GFC rebound
    2020: -5.5, # COVID-19 pandemic shock
    2021: +5.2, # Pandemic recovery rebound
    2022: -0.5, # Energy & inflation shock
    2023: -0.3, # Global monetary tightening
}

YEARS = list(range(1990, 2025))

def generate_panel_data():
    records = []

    for c in COUNTRIES:
        pot_g = c["base_pot_growth"]
        neutral_r = c["neutral_r"]
        base_inv = c["base_inv"]
        openness = c["openness"]
        tier = c["tier"]
        code = c["code"]

        # Equilibrium NAIRU
        nairu = 4.8 if tier == 2 else (6.8 if tier == 1 else 8.5)
        unemployment = nairu + np.random.normal(0, 0.5)
        prev_gdp_growth = pot_g + np.random.normal(0, 0.5)
        growth_history = [prev_gdp_growth]
        debt_to_gdp = 55.0 + np.random.normal(0, 10.0)

        for year in YEARS:
            # Demographics
            pop_growth = max(0.05, (1.2 if tier == 0 else (0.8 if tier == 1 else 0.4)) + np.random.normal(0, 0.12))
            
            # Global environment
            global_shock = GLOBAL_SHOCKS.get(year, 0.0)
            country_global_impact = global_shock * (1.0 + (openness - 50.0) / 250.0)

            # Cyclical state
            lagged_gdp_growth = growth_history[-1]
            gdp_growth_ma3 = np.mean(growth_history[-3:]) if len(growth_history) >= 3 else lagged_gdp_growth

            # Inflation process with central bank target anchoring (2% advanced, 4% emerging, 6% developing)
            target_inf = 2.0 if tier == 2 else (4.0 if tier == 1 else 6.5)
            inflation_rate = max(0.1, target_inf + 0.25 * (lagged_gdp_growth - pot_g) + np.random.normal(0, 0.8))
            if year in (2021, 2022):
                inflation_rate += np.random.uniform(2.5, 5.0)

            # Policy rate (Taylor Rule) and real interest rate
            nominal_policy_rate = max(0.0, inflation_rate + neutral_r + 0.5 * (inflation_rate - target_inf) + np.random.normal(0, 0.4))
            interest_rate_real = nominal_policy_rate - inflation_rate

            # Unemployment with Okun's law and mean-reversion to NAIRU
            prev_u = unemployment
            unemployment = float(np.clip(
                prev_u - 0.35 * (lagged_gdp_growth - pot_g) + 0.35 * (nairu - prev_u) + np.random.normal(0, 0.25),
                2.5, 22.0
            ))
            unemployment_change = unemployment - prev_u

            # Investment ratio (% of GDP)
            investment_ratio = float(np.clip(
                base_inv + 0.25 * (lagged_gdp_growth - pot_g) - 0.15 * (interest_rate_real - neutral_r) + np.random.normal(0, 0.8),
                12.0, 48.0
            ))

            # Fiscal balance (% of GDP, automatic stabilizers + fiscal reaction function)
            # When debt rises, fiscal rule tightens spending
            fiscal_balance_ratio = float(np.clip(
                -2.5 + 0.35 * (lagged_gdp_growth - pot_g) + 0.03 * (debt_to_gdp - 60.0) + np.random.normal(0, 0.7),
                -12.0, 5.0
            ))
            if year == 2020:
                fiscal_balance_ratio -= np.random.uniform(4.0, 7.0) # COVID relief deficit

            # Debt dynamics: debt_t = debt_{t-1} - primary_balance - (growth / 100) * debt_{t-1}
            debt_to_gdp = float(np.clip(
                debt_to_gdp - fiscal_balance_ratio - ((lagged_gdp_growth) / 100.0) * debt_to_gdp + np.random.normal(0, 0.6),
                20.0, 160.0
            ))

            # Structural GDP growth equation:
            # Solow-Swan + Okun + Accelerator + Real Rate + Debt Drag + Idiosyncratic
            growth_okun = -1.1 * unemployment_change
            growth_inv = 0.12 * (investment_ratio - base_inv)
            growth_monetary = -0.15 * (interest_rate_real - neutral_r)
            growth_fiscal = 0.12 * (fiscal_balance_ratio + 2.5)
            debt_drag = -0.010 * max(0.0, debt_to_gdp - 100.0)
            growth_inertia = 0.15 * (lagged_gdp_growth - pot_g)
            
            idio_shock = np.random.normal(0, 0.5)

            target_gdp_growth = float(np.clip(
                pot_g + country_global_impact + growth_okun + growth_inv +
                growth_monetary + growth_fiscal + debt_drag + growth_inertia + idio_shock,
                -9.0, 14.0
            ))

            records.append({
                "country_code": code,
                "country_name": c["name"],
                "year": year,
                "development_tier": tier,
                "lagged_gdp_growth": round(lagged_gdp_growth, 3),
                "gdp_growth_ma3": round(gdp_growth_ma3, 3),
                "unemployment_rate": round(unemployment, 3),
                "unemployment_change": round(unemployment_change, 3),
                "inflation_rate": round(inflation_rate, 3),
                "interest_rate_real": round(interest_rate_real, 3),
                "investment_ratio": round(investment_ratio, 3),
                "fiscal_balance_ratio": round(fiscal_balance_ratio, 3),
                "debt_to_gdp_ratio": round(debt_to_gdp, 3),
                "trade_openness": round(openness, 3),
                "population_growth": round(pop_growth, 3),
                "target_gdp_growth": round(target_gdp_growth, 3),
            })

            growth_history.append(target_gdp_growth)

    df = pd.DataFrame(records)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Generated {len(df)} panel observations for {len(COUNTRIES)} countries across {len(YEARS)} years.")
    print(f"Saved dataset to: {OUTPUT_CSV}")
    print("\nDataset Summary Statistics:")
    print(df.describe().round(2))

if __name__ == "__main__":
    generate_panel_data()
