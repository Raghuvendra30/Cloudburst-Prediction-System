import os
import random
import warnings

import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import MinMaxScaler
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    auc
)

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    LSTM,
    Dense,
    Dropout,
    BatchNormalization
)

from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)

from tensorflow.keras.optimizers import Adam

# =========================================================
# SUPPRESS WARNINGS
# =========================================================

warnings.filterwarnings("ignore")

# =========================================================
# RANDOM SEED
# =========================================================

SEED = 42

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model",
    "lstm"
)

DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "cbp.csv"
)

os.makedirs(MODEL_DIR, exist_ok=True)

# =========================================================
# CONFIG
# =========================================================

TIMESTEPS = 24
TARGET = "cloudburst"

EPOCHS = 60
BATCH_SIZE = 128
LEARNING_RATE = 0.0003

# =========================================================
# LOAD DATASET
# =========================================================

print("=" * 60)
print("Loading Dataset...")
print("=" * 60)

df = pd.read_csv(DATA_PATH, low_memory=False)

print("Dataset Loaded Successfully")
print("Shape:", df.shape)

# =========================================================
# CLEAN DATASET
# =========================================================

df = df.loc[:, ~df.columns.str.contains("^Unnamed")]

df.columns = df.columns.str.strip()

df.rename(columns={
    "rain": "rainfall",
    "rain ": "rainfall",
    "CloudBurstTomorrow": "cloudburst"
}, inplace=True)

print("\nColumns:")
print(df.columns.tolist())

# =========================================================
# NUMERIC CONVERSION
# =========================================================

numeric_cols = [
    "temp_min",
    "temp_max",
    "humidity",
    "pressure",
    "wind_speed",
    "rainfall"
]

for col in numeric_cols:

    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )

# =========================================================
# HANDLE MISSING VALUES
# =========================================================

df = df.ffill().bfill()

# =========================================================
# FEATURE ENGINEERING
# =========================================================

df["temp"] = (
    df["temp_min"] + df["temp_max"]
) / 2

df["pressure_change"] = (
    df["pressure"].diff().fillna(0)
)

df["temp_pressure"] = (
    df["temp"] / (df["pressure"] + 0.0001)
)

df["humidity_temp"] = (
    df["humidity"] * df["temp"]
)

df["wind_rain"] = (
    df["wind_speed"] * df["rainfall"]
)

df["rain_rate"] = (
    df["rainfall"]
    .rolling(3)
    .mean()
    .fillna(0)
)

df["humidity_pressure"] = (
    df["humidity"] /
    (df["pressure"] + 0.0001)
)

# =========================================================
# CREATE LABEL
# =========================================================

df["cloudburst"] = np.where(

    (
        (df["rainfall"] > 60)
    ) |

    (
        (df["rainfall"] > 40) &
        (df["pressure_change"] < -3)
    ),

    1,
    0
)

# =========================================================
# CLASS DISTRIBUTION
# =========================================================

print("\nCloudburst Distribution:")
print(df["cloudburst"].value_counts())

# =========================================================
# FEATURES
# =========================================================

FEATURES = [

    "temp",
    "humidity",
    "pressure",
    "wind_speed",
    "rainfall",

    "temp_pressure",
    "humidity_temp",
    "wind_rain",
    "pressure_change",
    "rain_rate",
    "humidity_pressure"

]

X_raw = df[FEATURES].values

y = df[TARGET].values

# =========================================================
# SCALE DATA
# =========================================================

scaler = MinMaxScaler()

X_scaled = scaler.fit_transform(X_raw)

# Save scaler
joblib.dump(
    scaler,
    os.path.join(MODEL_DIR, "scaler.pkl")
)

print("\nScaler Saved")

# =========================================================
# BUILD SEQUENCES
# =========================================================

X = []
Y = []

for i in range(TIMESTEPS, len(X_scaled)):

    X.append(
        X_scaled[i - TIMESTEPS:i]
    )

    Y.append(y[i])

X = np.array(X, dtype=np.float32)

Y = np.array(Y, dtype=np.float32)

print("\nSequence Shape:", X.shape)

# =========================================================
# TRAIN TEST SPLIT
# =========================================================

split = int(len(X) * 0.8)

X_train = X[:split]
X_val = X[split:]

y_train = Y[:split]
y_val = Y[split:]

print("\nTrain Shape:", X_train.shape)
print("Validation Shape:", X_val.shape)

# =========================================================
# CLASS WEIGHTS
# =========================================================

weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(y_train),
    y=y_train
)

class_weights = dict(enumerate(weights))

print("\nClass Weights:")
print(class_weights)

# =========================================================
# BUILD LSTM MODEL
# =========================================================

print("\nBuilding LSTM Model...")

model = Sequential([

    LSTM(
        64,
        return_sequences=True,
        input_shape=(
            TIMESTEPS,
            X.shape[2]
        )
    ),

    BatchNormalization(),

    Dropout(0.3),

    LSTM(32),

    BatchNormalization(),

    Dropout(0.3),

    Dense(
        32,
        activation="relu"
    ),

    Dropout(0.2),

    Dense(
        16,
        activation="relu"
    ),

    Dense(
        1,
        activation="sigmoid"
    )

])

# =========================================================
# COMPILE MODEL
# =========================================================

optimizer = Adam(
    learning_rate=LEARNING_RATE
)

model.compile(

    optimizer=optimizer,

    loss="binary_crossentropy",

    metrics=[
        "accuracy",
        tf.keras.metrics.AUC(name="auc"),
        tf.keras.metrics.Precision(name="precision"),
        tf.keras.metrics.Recall(name="recall")
    ]
)

model.summary()

# =========================================================
# CALLBACKS
# =========================================================

BEST_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "best_lstm_model.keras"
)

callbacks = [

    ModelCheckpoint(
        filepath=BEST_MODEL_PATH,
        monitor="val_auc",
        mode="max",
        save_best_only=True,
        verbose=1
    ),

    EarlyStopping(
        monitor="val_loss",
        patience=10,
        restore_best_weights=True,
        verbose=1
    ),

    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=5,
        verbose=1
    )
]

# =========================================================
# TRAIN MODEL
# =========================================================

print("\nTraining Started...\n")

history = model.fit(

    X_train,
    y_train,

    validation_data=(
        X_val,
        y_val
    ),

    epochs=EPOCHS,

    batch_size=BATCH_SIZE,

    class_weight=class_weights,

    callbacks=callbacks,

    verbose=1
)

# =========================================================
# SAVE FINAL MODEL
# =========================================================

FINAL_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "lstm_model.keras"
)

model.save(FINAL_MODEL_PATH)

print("\nFinal Model Saved")

# =========================================================
# EVALUATION
# =========================================================

print("\nEvaluating Model...\n")

y_pred_prob = model.predict(X_val).flatten()

THRESHOLD = 0.80

y_pred = (
    y_pred_prob > THRESHOLD
).astype(int)

# =========================================================
# CLASSIFICATION REPORT
# =========================================================

print("\nClassification Report:\n")

print(
    classification_report(
        y_val,
        y_pred
    )
)

# =========================================================
# ROC AUC
# =========================================================

roc_auc = roc_auc_score(
    y_val,
    y_pred_prob
)

print(f"ROC-AUC Score: {roc_auc:.4f}")

# =========================================================
# CONFUSION MATRIX
# =========================================================

cm = confusion_matrix(
    y_val,
    y_pred
)

plt.figure(figsize=(6, 5))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues"
)

plt.title("Confusion Matrix")

plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODEL_DIR,
        "confusion_matrix.png"
    )
)

plt.close()

print("Confusion Matrix Saved")

# =========================================================
# ROC CURVE
# =========================================================

fpr, tpr, _ = roc_curve(
    y_val,
    y_pred_prob
)

roc_auc_value = auc(fpr, tpr)

plt.figure(figsize=(6, 5))

plt.plot(fpr, tpr)

plt.plot([0, 1], [0, 1], linestyle="--")

plt.title(
    f"ROC Curve (AUC = {roc_auc_value:.4f})"
)

plt.xlabel("False Positive Rate")

plt.ylabel("True Positive Rate")

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODEL_DIR,
        "roc_curve.png"
    )
)

plt.close()

print("ROC Curve Saved")

# =========================================================
# ACCURACY PLOT
# =========================================================

plt.figure(figsize=(7, 5))

plt.plot(history.history["accuracy"])

plt.plot(history.history["val_accuracy"])

plt.title("Model Accuracy")

plt.xlabel("Epoch")
plt.ylabel("Accuracy")

plt.legend([
    "Train",
    "Validation"
])

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODEL_DIR,
        "accuracy_plot.png"
    )
)

plt.close()

# =========================================================
# LOSS PLOT
# =========================================================

plt.figure(figsize=(7, 5))

plt.plot(history.history["loss"])

plt.plot(history.history["val_loss"])

plt.title("Model Loss")

plt.xlabel("Epoch")
plt.ylabel("Loss")

plt.legend([
    "Train",
    "Validation"
])

plt.tight_layout()

plt.savefig(
    os.path.join(
        MODEL_DIR,
        "loss_plot.png"
    )
)

plt.close()

print("Training Plots Saved")

# =========================================================
# COMPLETE
# =========================================================

print("\n" + "=" * 60)
print("LSTM MODEL TRAINING COMPLETED")
print("=" * 60)

print(f"\nModel Path:\n{FINAL_MODEL_PATH}")