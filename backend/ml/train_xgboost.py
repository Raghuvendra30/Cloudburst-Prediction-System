import os
import datetime
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import xgboost as xgb

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import classification_report, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split

# ================= PATHS =================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")
XGB_DIR = os.path.join(MODEL_DIR, "xgboost")
ARTIFACTS_DIR = os.path.join(MODEL_DIR, "artifacts")
VERSIONS_DIR = os.path.join(MODEL_DIR, "versions")

os.makedirs(XGB_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(VERSIONS_DIR, exist_ok=True)

DATA_PATH = os.path.join(BASE_DIR, "ml", "cloudburst_data.csv")
TARGET = "CloudBurstTomorrow"

# ================= LOAD DATA =================

print("Loading dataset...")

df = pd.read_csv(DATA_PATH, low_memory=False)

# Clean dataset
df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
df.columns = df.columns.str.strip()

if "rain " in df.columns:
    df.rename(columns={"rain ": "rain"}, inplace=True)

# Convert numeric
for col in df.columns:
    if col != TARGET:
        df[col] = pd.to_numeric(df[col], errors="coerce")

df.ffill(inplace=True)
df.bfill(inplace=True)

# ================= FEATURE ENGINEERING =================

if "wind_gust" not in df.columns:
    df["wind_gust"] = df["wind_speed"] * 1.2

if "clouds" not in df.columns:
    df["clouds"] = (df["humidity"] * 0.8).clip(0, 100)

df["temp_range"] = df["temp_max"] - df["temp_min"]
df["humidity_pressure"] = df["humidity"] / (df["pressure"] + 1)
df["wind_rain"] = df["wind_speed"] * df["rain"]
df["pressure_drop"] = df["pressure"].diff().fillna(0)
df["rain_intensity"] = df["rain"] / (df["humidity"] + 1)
df["wind_pressure"] = df["wind_speed"] / (df["pressure"] + 1)

# OPTIONAL (SAFE BOOST FEATURE)
df["pressure_change_3"] = df["pressure"].diff(3).fillna(0)

FEATURES = [
    "temp_min", "temp_max", "temp_range",
    "rain", "rain_intensity",
    "wind_gust", "wind_speed", "wind_rain", "wind_pressure",
    "humidity", "humidity_pressure",
    "pressure", "pressure_drop",
    "clouds",
    "pressure_change_3"
]

X = df[FEATURES].values
y = df[TARGET].values

print("Target distribution:")
print(pd.Series(y).value_counts())

# ================= SCALE =================

scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

# ================= SPLIT =================

X_train, X_val, y_train, y_val = train_test_split(
    X_scaled,
    y,
    test_size=0.25,
    stratify=y,
    random_state=42
)

# ================= CLASS IMBALANCE =================

neg = np.sum(y_train == 0)
pos = np.sum(y_train == 1)

scale_pos_weight = neg / pos
print("scale_pos_weight:", scale_pos_weight)

# ================= MODEL =================

model = xgb.XGBClassifier(

    n_estimators=1200,
    max_depth=6,
    learning_rate=0.03,

    subsample=0.9,
    colsample_bytree=0.9,

    gamma=0.8,
    min_child_weight=3,

    reg_lambda=1.2,
    reg_alpha=0.2,

    scale_pos_weight=scale_pos_weight,

    objective="binary:logistic",
    eval_metric="auc",

    tree_method="hist",
    random_state=42
)

# ================= TRAIN =================

model.fit(
    X_train,
    y_train,
    eval_set=[(X_train, y_train), (X_val, y_val)],
    verbose=100,
    early_stopping_rounds=70
)

print("Best iteration:", model.best_iteration)

# ================= EVALUATION =================

y_prob = model.predict_proba(X_val)[:, 1]

# tuned threshold
threshold = 0.32
y_pred = (y_prob > threshold).astype(int)

print("\nClassification Report\n")
print(classification_report(y_val, y_pred, zero_division=0))

if len(np.unique(y_val)) > 1:
    auc = roc_auc_score(y_val, y_prob)
    print("ROC-AUC:", auc)

    # ROC Curve
    fpr, tpr, _ = roc_curve(y_val, y_prob)

    plt.figure()
    plt.plot(fpr, tpr, label=f"AUC = {auc:.3f}")
    plt.plot([0, 1], [0, 1], "--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve")
    plt.legend()

    plt.savefig(os.path.join(ARTIFACTS_DIR, "xgb_roc_curve.png"))
    plt.close()

# ================= SAVE =================

timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")

joblib.dump(model, os.path.join(XGB_DIR, "xgb_model.pkl"))
joblib.dump(model, os.path.join(VERSIONS_DIR, f"xgb_model_{timestamp}.pkl"))
joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "xgb_scaler.pkl"))

# ================= FEATURE IMPORTANCE =================

plt.figure(figsize=(10, 6))
xgb.plot_importance(model, importance_type="gain")
plt.title("XGBoost Feature Importance")
plt.tight_layout()
plt.savefig(os.path.join(ARTIFACTS_DIR, "xgb_feature_importance.png"))
plt.close()

print("\nXGBoost model trained and saved successfully")