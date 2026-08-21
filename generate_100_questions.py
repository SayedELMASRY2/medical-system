import json
import random
import os

categories = [
    "Preeclampsia Diagnostic", "Gestational Diabetes", "Routine Check-in",
    "Out-of-Scope Query", "HELLP Syndrome Emergency", "Fetal Movement Monitoring",
    "Gestational Hypertension"
]

templates = {
    "Preeclampsia Diagnostic": {
        "query": "Patient at {week} weeks with BP {sys}/{dia}, {symptom1}, {symptom2}. What is the risk level and clinical action?",
        "docs": ["doc_preeclampsia_guidelines", "doc_acog_hypertension_2023"],
        "risk": "RED",
        "oos": False
    },
    "Gestational Diabetes": {
        "query": "Fasting blood sugar {bs} mg/dL at {week} weeks. {symptom1}. How should glucose tolerance test be interpreted?",
        "docs": ["doc_gdm_screening_ada", "doc_maternal_nutrition_guide"],
        "risk": "YELLOW",
        "oos": False
    },
    "Routine Check-in": {
        "query": "BP {sys}/{dia} mmHg, weight gain {weight}kg this week, fetal movement normal at {week} weeks.",
        "docs": ["doc_routine_prenatal_care"],
        "risk": "GREEN",
        "oos": False
    },
    "Out-of-Scope Query": {
        "query": [
            "How do I fix a flat tire on a {year} {car}?", 
            "What stock options should I buy for tech companies this quarter?", 
            "Best recipe for chocolate cake?", 
            "How to train a dog to sit?",
            "What are the best movies of 2024?"
        ],
        "docs": [],
        "risk": "NONE",
        "oos": True
    },
    "HELLP Syndrome Emergency": {
        "query": "{symptom1}, AST {ast} U/L, platelets {plt},000 /uL at {week} weeks.",
        "docs": ["doc_preeclampsia_guidelines", "doc_hellp_syndrome_protocol"],
        "risk": "RED",
        "oos": False
    },
    "Fetal Movement Monitoring": {
        "query": "Decreased fetal kick count over past {hours} hours at {week} weeks.",
        "docs": ["doc_fetal_wellbeing_monitoring"],
        "risk": "RED",
        "oos": False
    },
    "Gestational Hypertension": {
        "query": "New onset blood pressure {sys}/{dia} mmHg at {week} weeks with negative proteinuria.",
        "docs": ["doc_acog_hypertension_2023"],
        "risk": "YELLOW",
        "oos": False
    }
}

symptoms1 = ["severe frontal headache", "mild nausea", "Right upper quadrant abdominal pain", "blurred vision"]
symptoms2 = ["proteinuria +2", "facial edema", "swollen ankles", "shortness of breath"]
cars = ["Toyota Corolla", "Honda Civic", "Ford F-150"]

dataset = []
random.seed(42) # For reproducibility
for i in range(1, 101):
    cat = random.choice(categories)
    t = templates[cat]
    
    if cat == "Out-of-Scope Query":
        query_template = random.choice(t["query"])
        if "{year}" in query_template:
            query = query_template.format(year=random.randint(2010, 2024), car=random.choice(cars))
        else:
            query = query_template
    elif cat == "Preeclampsia Diagnostic":
        query = t["query"].format(week=random.randint(28, 40), sys=random.randint(140, 180), dia=random.randint(90, 120), symptom1=random.choice(symptoms1), symptom2=random.choice(symptoms2))
    elif cat == "Gestational Diabetes":
        query = t["query"].format(bs=random.randint(95, 140), week=random.randint(24, 32), symptom1=random.choice(["No prior history", "Previous history of GDM"]))
    elif cat == "Routine Check-in":
        query = t["query"].format(sys=random.randint(110, 130), dia=random.randint(70, 85), weight=round(random.uniform(0.1, 1.0), 1), week=random.randint(12, 40))
    elif cat == "HELLP Syndrome Emergency":
        query = t["query"].format(symptom1=random.choice(symptoms1), ast=random.randint(70, 200), plt=random.randint(50, 95), week=random.randint(28, 40))
    elif cat == "Fetal Movement Monitoring":
        query = t["query"].format(hours=random.randint(6, 24), week=random.randint(28, 40))
    elif cat == "Gestational Hypertension":
        query = t["query"].format(sys=random.randint(140, 159), dia=random.randint(90, 109), week=random.randint(20, 40))

    dataset.append({
        "id": f"eval-{i:03d}",
        "category": cat,
        "query": query,
        "ground_truth_doc_ids": t["docs"],
        "expected_risk": t["risk"],
        "is_out_of_scope": t["oos"]
    })

dataset_path = os.path.join(os.path.dirname(__file__), "evaluations", "dataset.json")
with open(dataset_path, "w") as f:
    json.dump(dataset, f, indent=2)

print(f"Generated 100 questions in {dataset_path}")
