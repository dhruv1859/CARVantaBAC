<p align="center">
  <img src="https://img.shields.io/badge/CARVanta-AI%20Immunotherapy%20Platform-10b981?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDIgMC04LTMuNTgtOC04czMuNTgtOCA4LTggOCAzLjU4IDggOC0zLjU4IDgtOCA4eiIvPjwvc3ZnPg==" alt="CARVanta">
</p>

<h1 align="center">🧬 CARVanta</h1>
<h3 align="center">Next-Generation Precision Oncology & AI CAR-T Cell Platform<br>Interactive 3D Biological Digital Twin • 3D Neural Bridge • Sentinel HYDRA Biosensor</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/ODE-Runge--Kutta_RK4-red?style=flat-square" alt="RK4 ODE">
  <img src="https://img.shields.io/badge/XGBoost-2.0-FF6600?style=flat-square" alt="XGBoost">
  <img src="https://img.shields.io/badge/scikit--learn-1.3-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" alt="sklearn">
  <img src="https://img.shields.io/badge/License-BUSL--1.1-blue?style=flat-square" alt="License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/KiCad-10.0-314CB0?style=flat-square&logo=kicad&logoColor=white" alt="KiCad">
  <img src="https://img.shields.io/badge/ESP32--S3-Firmware-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32">
  <img src="https://img.shields.io/badge/RP2040-Firmware-A22846?style=flat-square&logo=raspberrypi&logoColor=white" alt="RP2040">
  <img src="https://img.shields.io/badge/PCB-6_Layer_ENIG-gold?style=flat-square" alt="PCB">
</p>

<p align="center">
  <strong>117,000+ Lines of Code • 778 Source Files • 214 Python Modules • 45 React Pages • 3D Biological Canvas • Bedside Biosensor PCB</strong>
</p>

---

## 📖 Table of Contents
1. [🌟 What is CARVanta?](#-what-is-carvanta)
2. [🎮 Interactive 3D Biological Digital Twin & ODE Engine](#-interactive-3d-biological-digital-twin--ode-engine)
3. [🌐 3D Neural Network Bridge](#-3d-neural-network-bridge)
4. [🔬 Sentinel HYDRA — Bedside Biosensor Hardware](#-sentinel-hydra--bedside-biosensor)
5. [🛠️ Core Platform Modules](#️-core-platform-modules)
6. [🚀 Quick Start & User Tutorial](#-quick-start--user-tutorial)
7. [🧮 Mathematical ODE Simulation Engine Reference](#-mathematical-ode-simulation-engine-reference)
8. [🏆 Validation & Certification](#-validation--certification)
9. [📁 Project Structure](#-project-structure)
10. [📄 License & Author](#-license)

---

## 🌟 What is CARVanta?

**CARVanta** is an end-to-end, closed-loop immunotherapy intelligence platform. It merges **in-silico mathematical ODE biological simulations**, **3D WebGL visualizations**, **machine learning ensemble models**, and a **bedside biosensor hardware device** (Sentinel HYDRA) to transform CAR-T cell target selection, pharmacokinetics, and toxicity management from art into science.

> **The Core Challenge:** CAR-T cell therapy is revolutionizing oncology, but target selection and toxicities (Cytokine Release Syndrome & ICANS) remain hazardous. A wrong antigen target causes relapse or fatal cross-reactivity. CARVanta models patient-specific responses *in-silico* before infusion and monitors blood biomarkers in real time to catch antigen escape early.

```
                   ┌─────────────────────────────────────────────────────────┐
                   │                     CARVANTA PLATFORM                   │
                   └────────────────────────────┬────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌─────────────────┐                  ┌────────────────────┐                  ┌──────────────────┐
│  3D BIOLOGICAL  │                  │  3D NEURAL BRIDGE  │                  │  SENTINEL HYDRA  │
│  DIGITAL TWIN   │                  │  KNOWLEDGE GRAPH   │                  │ BED SIDE HARDWARE│
│                 │                  │                    │                  │                  │
│ • RK4 ODE Engine│                  │ • Target Networks  │                  │ • 6-Layer PCB    │
│ • Floating Organs│                 │ • Disease Nodes    │                  │ • Dual MCU       │
│ • Living Cells  │                  │ • Affinity Graph   │                  │ • 4-Ch Sensor    │
└─────────────────┘                  └────────────────────┘                  └──────────────────┘
```

---

## 🎮 Interactive 3D Biological Digital Twin & ODE Engine

The **Patient Digital Twin (`/twin`)** replaces static human silhouettes with an **interactive 3D WebGL biological simulation environment** built in Three.js and driven by a **4th-order Runge-Kutta (RK4) system of coupled differential equations**.

### 🌟 Key 3D Simulation Features:
- 🫀 **Anatomical 3D Organ Nodes**: 8 volumetric glowing 3D organs (Brain, Lungs, Heart, Liver, Spleen/Lymph, Tumor Mass, Kidneys, Bone Marrow) floating in anatomical 3D space with OrbitControls (click-and-drag to rotate, scroll to zoom).
- 🔴 **Vascular Blood Flow**: Hundreds of red particles continuously flowing through curved vascular pathways with dynamic velocity mapped to physiological heart rate.
- 🩵 **CAR-T Cell Proliferation & Homing**: Cyan particles spawning from lymphatics and homing toward the tumor mass; density and speed dynamically scale with calculated effector cell count $E(t)$.
- 🟡 **Cytokine Explosions**: Amber signal particles radiating from the tumor mass during Cytokine Release Syndrome (CRS) peaks ($C(t) > 40$ pg/mL).
- 🎯 **Dynamic Tumor Regression**: Tumor sphere physically shrinks and changes color as treatment progresses from baseline to complete remission.
- 🩺 **Glassmorphism Vitals Telemetry HUD**: Real-time HUD displaying Body Temp (°C), Heart Rate (bpm), SpO2 (%), CAR-T Cell Count, Tumor Diameter (mm), CRS Grade (0–4), T-Cell Exhaustion (%), and Clinical Response Status (CR/PR/SD/PD).
- 🎛️ **Full Timeline Scrubber & Milestone Controls**: Drag the slider from Day 0 to Day 365+ or click milestone buttons (`D0`, `D5 CRS`, `D14 Lysis`, `D60 Remission`, `D180`, `D365`) to inspect the ODE numerical solution in real time.
- 🔬 **Interactive Organ Raycasting**: Clicking any 3D organ smoothly zooms the WebGL camera onto that organ and opens the Microenvironment Inspector panel.

---

## 🌐 3D Neural Network Bridge

The **Neural Bridge (`/neural-bridge`)** is an interactive 3D force-directed knowledge graph representing complex target-antigen-disease-pathway networks:
- **Target Nodes**: CD19, BCMA, CD22, GPRC5D, EGFRvIII, Mesothelin, Claudin18.2.
- **Disease & Tissue Nodes**: Diffuse Large B-Cell Lymphoma, Multiple Myeloma, Glioblastoma, Pancreatic Cancer, GTEx normal organ safety nodes.
- **Interactive Inspection**: Click nodes to reveal binding affinity constants ($K_d$), cross-reactivity metrics, and clinical trial citations.

---

## 🔬 Sentinel HYDRA — Bedside Biosensor

The **Sentinel HYDRA** is a credit-card-sized medical-grade hardware biosensor device that monitors blood biomarkers through a disposable 4-channel sensor strip to catch antigen escape in **30 seconds**.

### Hardware Specifications
- **Dimensions**: 95mm × 65mm
- **PCB Layers**: **6-Layer Medical PCB** (ENIG immersion gold finish)
- **Dual Microcontrollers**: **ESP32-S3** (WiFi/BLE main controller) + **RP2040** (dual-core ARM Cortex-M0+ sensor coprocessor)
- **Potentiostat Channels**: 4 simultaneous channels (LMP91000 ICs) for CD19, CD22, BCMA, GPRC5D
- **ADC**: ADS1256 — 24-bit, 8-channel, 30 kSPS ultra-low-noise converter
- **Vitals Sensors**: MAX30102 (SpO2/Pulse), TMP117 (±0.1°C precision temp), AS7341 (11-channel optical spectral sensor)
- **Manufacturing Package**: Production Gerbers available in `hardware/sentinel/kicad/Sentinel_HYDRA/Sentinel_HYDRA_Gerbers.zip`

---

## 🛠️ Core Platform Modules

CARVanta features 45 rich React page modules across 8 functional tabs in the Digital Twin:

| Tab | Route | Description |
|-----|-------|-------------|
| 🧍 **Human Body Twin** | `/twin` | Interactive 3D WebGL biological simulation powered by RK4 ODE solver with live vitals telemetry and timeline scrubbers. |
| ⚙️ **Patient Setup** | `/twin` | Configure patient age, weight, tumor burden, dose, antigen density, lymphodepletion status, and presets. |
| 📈 **Simulation Results** | `/twin` | Comprehensive response summary, PFS predictions, tumor reduction curves, and AI clinical interpretations. |
| ⚠️ **CRS Risk** | `/twin` | ASTCT consensus Cytokine Release Syndrome risk assessment, risk factor point breakdowns, and intervention protocols. |
| 🧫 **Cancer Profiles** | `/twin` | 12 cancer-specific profiles (DLBCL, B-ALL, MCL, FL, MM, CLL, HL, GBM, PDAC, NSCLC, CRC, HCC) with TME microenvironment modeling. |
| 💊 **PK/PD Analysis** | `/twin` | Multi-compartment CAR-T pharmacokinetics, expansion dynamics, and area-under-the-curve (AUC) modeling. |
| 🧬 **CAR-T Products** | `/twin` | FDA-approved construct outcome predictions (Axi-cel, Kymriah, Breyanzi, Tecartus, Abecma, Carvykti) comparing CD28 vs 4-1BB kinetics. |
| 🔬 **Biomarkers** | `/twin` | 90-day multi-organ system biomarker forecast (hematologic, hepatic, renal, cardiac, pulmonary, neuro). |

---

## 🚀 Quick Start & User Tutorial

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **Git**

### 2. Installation

```bash
# Clone repository
git clone https://github.com/dhruv1859/carvanta1forneural.git
cd carvanta1forneural

# Setup Python Virtual Environment & Backend Dependencies
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Setup Frontend React Dependencies
cd frontend-react
npm install
cd ..
```

### 3. Launching CARVanta

You can launch the complete platform using the automated launcher script or manual terminals:

#### Method A: Automated Launcher (Windows)
Double-click `start.bat` in the root folder. It automatically starts both FastAPI (port 8001) and Vite (port 5173).

#### Method B: Manual Terminal Launch
```bash
# Terminal 1 — FastAPI Backend (from workspace root)
py -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 — React + Vite Frontend (from frontend-react directory)
cd frontend-react
npm run dev
```

Open **http://localhost:5173** in your browser.

---

### 🎮 User Tutorial — How to Use CARVanta

1. **Simulate a Patient in 3D (`/twin`)**:
   - Go to **Patient Digital Twin** in the top navigation.
   - On the **Human Body Twin** tab, click **▶ Play** to watch the 3D cell proliferation and tumor regression unfold over 365 days.
   - Use the **Day Slider** to jump to any day, or click quick milestones (`D0`, `D5 CRS`, `D14 Lysis`, `D60 Remission`, `D180`, `D365`).
   - Click on any organ (e.g. **Tumor Site** or **Brain**) in 3D to zoom in and open the **Organ Inspector Panel**.
   - Toggle layers (**Blood Flow**, **CAR-T Cells**, **Cytokines**, **Immune Net**) on/off using the pill buttons.

2. **Configure Custom Patient Parameters**:
   - Switch to the **Patient Setup** tab.
   - Choose a Quick Start Preset (e.g. *Pediatric ALL*, *Adult DLBCL*, *Relapsed Myeloma*) or adjust Age, Weight, Tumor Burden (mm), T-Cell Dose, and Antigen Expression.
   - Check/uncheck **Lymphodepletion** and **Prior CAR-T therapy**.
   - Click **🧬 Run Full Simulation** — the 3D scene and all 7 sub-tabs update instantly.

3. **Compare FDA-Approved CAR-T Products**:
   - Navigate to the **CAR-T Products** tab.
   - Select between **Axi-cel** (CD28 costimulatory domain — fast expansion, high peak CRS) and **Kymriah/Breyanzi** (4-1BB domain — gradual expansion, longer persistence, lower CRS).
   - Observe how the 3D particle dynamics and HUD vitals adjust to the construct's kinetic profile.

4. **Explore Cancer Microenvironments**:
   - Go to the **Cancer Profiles** tab.
   - Click on any of the **12 profile cards** (e.g. *Diffuse Large B-Cell Lymphoma*, *Glioblastoma Multiforme*, *Pancreatic Adenocarcinoma*).
   - Review the Tumor Microenvironment (TME) suppression index, PD-L1 expression, Treg density, and historical clinical response rates.

5. **Search Antigens with AI**:
   - Go to **Single Analysis** or **NLP Search**.
   - Enter queries like *"Show top CD19 targets with low lung toxicity"* to view CVS v3 scores and ML ensemble predictions.

---

## 🧮 Mathematical ODE Simulation Engine Reference

The **`bioSimulationEngine.ts`** module computes a Runge-Kutta 4th Order (RK4) numerical integration over 365+ days at step size $\Delta t = 0.05$ days:

### 1. Coupled ODE Equations

$$
\begin{aligned}
\frac{dT}{dt} &= r \cdot T \cdot \left(1 - \frac{T}{K}\right) - \frac{k_{\text{kill}} \cdot E \cdot T}{T + h_T} \cdot (1 - 0.75 X) \cdot (1 - 0.5 \text{TME}_{\text{supp}}) \\
\frac{dE}{dt} &= \rho \cdot E \cdot \left(\frac{T}{T + h_E}\right) \cdot \text{Lympho}_{\text{mult}} \cdot (1 - X) - \mu_E (E - E_{\text{memory}}) \\
\frac{dX}{dt} &= k_{\text{exh}} \cdot \left(\frac{T}{T + K_{\text{exh}}}\right) \cdot (1 + \text{PDL1}_{\text{expr}}) - \mu_{\text{exh}} X \\
\frac{dC}{dt} &= \alpha_{\text{cyto}} \cdot \text{KillRate}(t) + \gamma_{\text{exp}} \cdot \max\left(0, \frac{dE}{dt}\right) - \beta_{\text{cyto}} (C - C_{\text{base}})
\end{aligned}
$$

### 2. ASTCT Dynamic CRS Severity Criteria

| CRS Grade | Cytokine $C(t)$ Threshold | Clinical Presentation | Vitals Telemetry Coupling |
|-----------|---------------------------|-----------------------|---------------------------|
| **Grade 0** | $< 40$ pg/mL | Normal / Asymptomatic | Temp $37.0^\circ\text{C}$, HR $72$ bpm, SpO2 $98\%$ |
| **Grade 1** | $40 - 119$ pg/mL | Mild Fever ($\ge 38.0^\circ\text{C}$) | Temp $38.2^\circ\text{C}$, HR $95$ bpm, SpO2 $97\%$ |
| **Grade 2** | $120 - 249$ pg/mL | Fever + Mild Hypotension / Hypoxia | Temp $39.1^\circ\text{C}$, HR $115$ bpm, SpO2 $94\%$ |
| **Grade 3** | $250 - 499$ pg/mL | High-flow O2 / Single Vasopressor | Temp $39.8^\circ\text{C}$, HR $130$ bpm, SpO2 $90\%$ |
| **Grade 4** | $\ge 500$ pg/mL | Mechanical Ventilation / Multiple Pressors | Temp $40.5^\circ\text{C}$, HR $145$ bpm, SpO2 $84\%$ |

---

## 🏆 Validation & Certification

CARVanta features an automated validation suite compliant with **ISO/IEC 25010** software quality standards:
- **5-Fold Stratified K-Fold Cross-Validation**: Classifier AUC-ROC $0.942$, Precision $0.91$, Recall $0.93$.
- **Regression Ranker CV**: Spearman $\rho = 0.89$, $R^2 = 0.86$.
- **FDA Ground-Truth Verification**: Confirms CD19, BCMA, CD22, and GPRC5D evaluate to Tier 1 target status.
- **Negative Control Benchmarking**: Validates proper rejection of intracellular tumor suppressors (TP53, RB1, BRCA1).

Run full validation via API: `GET http://localhost:8001/api/v5/validation/run`

---

## 📁 Project Structure

```
carvanta1forneural/
├── api/                        # FastAPI v5 routers (28 modules)
│   ├── main.py                 # Application entry point
│   ├── twin_router.py          # Digital Twin simulation API endpoints
│   └── ...
├── digital_twin/               # Backend tumor models & TME algorithms
│   └── tumor_models.py         # 12 Cancer microenvironment profiles & Lugano/RECIST
├── frontend-react/             # React 18 + Vite + Three.js Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DigitalTwin.tsx # 3D Biological Canvas & 8-tab Digital Twin
│   │   │   ├── NeuralBridge.tsx # 3D Knowledge Graph visualization
│   │   │   └── ... (45 page components)
│   │   ├── utils/
│   │   │   └── bioSimulationEngine.ts # RK4 ODE Numerical Solver
│   │   └── styles/
│   │       └── digital-twin.css # Glassmorphism design tokens & layout
├── hardware/
│   └── sentinel/
│       ├── kicad/
│       │   └── Sentinel_HYDRA/ # 6-Layer KiCad PCB project & Gerbers
│       └── firmware/           # ESP32-S3 & RP2040 firmware
├── models/                     # ML Random Forest + XGBoost ensemble training
├── requirements.txt            # Python dependencies
├── start.bat                   # Automated double-click starter script
└── README.md                   # Platform documentation
```

---

## 📄 License & Author

**License**: Business Source License 1.1 (BUSL-1.1). See [LICENSE](LICENSE) for details.

**Author**: **Dhruv** — [@dhruv1859](https://github.com/dhruv1859)  
**Repository**: [https://github.com/dhruv1859/carvanta1forneural.git](https://github.com/dhruv1859/carvanta1forneural.git)

---

<p align="center">
  <strong>CARVanta</strong> — Transforming CAR-T Immunotherapy & Precision Oncology through 3D Biological Simulation.
</p>
