# ==============================
# 🫀 LUMEX - Detección de anomalías cardiovasculares
# ==============================

import pandas as pd
import numpy as np
import os
from datetime import datetime, timezone
from typing import Any

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

import joblib

# ==============================
# 📂 1. CARGAR DATASET
# ==============================

DATASET_FILE = "CTG.csv"

try:
    df = pd.read_csv(DATASET_FILE)
    print("✅ Dataset cargado correctamente")
except:
    print("❌ Error al cargar el archivo")
    exit()

# ==============================
# 🧹 2. LIMPIEZA DE DATOS
# ==============================

# Eliminar columnas completamente vacías
df = df.dropna(axis=1, how='all')

# Eliminar filas con valores nulos
df = df.dropna()

print("📊 Tamaño del dataset:", df.shape)

# ==============================
# 🔍 3. VER COLUMNAS
# ==============================

print("\n📌 Columnas disponibles:")
print(df.columns)

# ==============================
# 🎯 4. SEPARAR VARIABLES
# ==============================

if "NSP" not in df.columns:
    print("❌ No se encontró la columna NSP (etiqueta)")
    exit()

X = df.drop(columns=["NSP"])
y = df["NSP"]

# ==============================
# ⚖️ 5. NORMALIZACIÓN
# ==============================

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ==============================
# ✂️ 6. DIVIDIR DATOS
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# ==============================
# 🤖 7. ENTRENAR MODELO
# ==============================

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print("\n✅ Modelo entrenado correctamente")

# ==============================
# 📈 8. EVALUAR MODELO
# ==============================

y_pred = model.predict(X_test)

print("\n📊 Accuracy:", accuracy_score(y_test, y_pred))
print("\n📋 Reporte de clasificación:\n")
print(classification_report(y_test, y_pred))

# ==============================
# 🚨 9. FUNCIÓN DE INTERPRETACIÓN
# ==============================

def interpretar(resultado):
    if resultado == 1:
        return "Normal ✅"
    elif resultado == 2:
        return "Sospechoso ⚠️"
    elif resultado == 3:
        return "Anomalía crítica 🚨"
    else:
        return "Desconocido"

# ==============================
# 🧪 10. PROBAR CON DATOS NUEVOS
# ==============================

print("\n🧪 PRUEBA DE NUEVO DATO")

# IMPORTANTE:
# Debe tener el mismo número de columnas que X
# Aquí usamos la primera fila como ejemplo

nuevo = X.iloc[0].values.reshape(1, -1)

nuevo_scaled = scaler.transform(nuevo)

prediccion = model.predict(nuevo_scaled)

print("Resultado:", interpretar(prediccion[0]))

# ==============================
# ☁️ 11. GUARDAR EN SUPABASE
# ==============================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Debe existir previamente en la tabla usuarios (int4)
SUPABASE_USER_ID = os.getenv("SUPABASE_USER_ID")

# Opcional: si no se envía, se crea un registro en modelos y se usa ese id
SUPABASE_MODEL_ID = os.getenv("SUPABASE_MODEL_ID")


def obtener_cliente_supabase() -> Any:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Faltan SUPABASE_URL o SUPABASE_KEY en variables de entorno."
        )
    supabase_module = __import__("supabase")
    create_client = getattr(supabase_module, "create_client")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def guardar_en_supabase(
    cliente: Any,
    dataframe: pd.DataFrame,
    modelo,
    scaler_obj,
    dataset_file: str,
    user_id: int,
    model_id: int | None = None,
) -> None:
    # 1) Registrar modelo si no existe id_modelo externo
    if model_id is None:
        modelo_payload = {
            "nombre_modelo": "RandomForestClassifier",
            "descripcion": "Modelo entrenado para deteccion de anomalias en CTG",
            "tipo_modelo": "clasificacion",
            "fecha_creacion": datetime.now(timezone.utc).isoformat(),
        }
        modelo_insert = (
            cliente.table("modelos")
            .insert(modelo_payload)
            .execute()
        )
        if not modelo_insert.data:
            raise RuntimeError("No se pudo crear registro en tabla modelos.")
        model_id = int(modelo_insert.data[0]["id_modelo"])

    # 2) Registrar dataset
    dataset_payload = {
        "id_usuario": user_id,
        "nombre_archivo": os.path.basename(dataset_file),
        "ruta_archivo": os.path.abspath(dataset_file),
        "fecha_subida": datetime.now(timezone.utc).isoformat(),
    }
    dataset_insert = (
        cliente.table("datasets")
        .insert(dataset_payload)
        .execute()
    )
    if not dataset_insert.data:
        raise RuntimeError("No se pudo crear registro en tabla datasets.")
    dataset_id = int(dataset_insert.data[0]["id_dataset"])

    # 3) Preparar inferencia completa para analisis y resultados
    x_full = dataframe.drop(columns=["NSP"])
    x_full_scaled = scaler_obj.transform(x_full)
    pred_full = modelo.predict(x_full_scaled)
    proba_full = modelo.predict_proba(x_full_scaled)

    clases = list(modelo.classes_)
    idx_normal = clases.index(1) if 1 in clases else 0
    error_reconstruccion = 1.0 - proba_full[:, idx_normal]
    es_anomalia = pred_full != 1

    # 4) Registrar analisis
    analisis_payload = {
        "id_usuario": user_id,
        "id_dataset": dataset_id,
        "id_modelo": model_id,
        "fecha_analisis": datetime.now(timezone.utc).isoformat(),
        "total_registros": int(len(dataframe)),
        "total_anomalias": int(np.sum(es_anomalia)),
    }
    analisis_insert = (
        cliente.table("analisis")
        .insert(analisis_payload)
        .execute()
    )
    if not analisis_insert.data:
        raise RuntimeError("No se pudo crear registro en tabla analisis.")
    analisis_id = int(analisis_insert.data[0]["id_analisis"])

    # 5) Registrar resultados por lotes
    filas_resultado = []
    for idx in range(len(dataframe)):
        filas_resultado.append(
            {
                "id_analisis": analisis_id,
                "indice_registro": int(idx),
                "error_reconstruccion": float(error_reconstruccion[idx]),
                "es_anomalia": bool(es_anomalia[idx]),
            }
        )

    batch_size = 500
    for i in range(0, len(filas_resultado), batch_size):
        lote = filas_resultado[i : i + batch_size]
        cliente.table("resultados").insert(lote).execute()

    print("✅ Datos guardados en Supabase")
    print(f"   • id_modelo: {model_id}")
    print(f"   • id_dataset: {dataset_id}")
    print(f"   • id_analisis: {analisis_id}")


try:
    cliente_supabase = obtener_cliente_supabase()

    if not SUPABASE_USER_ID:
        raise ValueError(
            "Falta SUPABASE_USER_ID (debe existir en tabla usuarios.id_usuario)."
        )

    guardar_en_supabase(
        cliente=cliente_supabase,
        dataframe=df,
        modelo=model,
        scaler_obj=scaler,
        dataset_file=DATASET_FILE,
        user_id=int(SUPABASE_USER_ID),
        model_id=int(SUPABASE_MODEL_ID) if SUPABASE_MODEL_ID else None,
    )
except Exception as e:
    print(f"⚠️ No se guardo en Supabase: {e}")

# ==============================
# 💾 12. GUARDAR MODELO LOCAL (OPCIONAL)
# ==============================

joblib.dump(model, "modelo_lumex.pkl")
joblib.dump(scaler, "scaler_lumex.pkl")

print("\n💾 Modelo y scaler guardados correctamente")