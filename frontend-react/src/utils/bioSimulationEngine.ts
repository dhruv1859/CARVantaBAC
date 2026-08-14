/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CARVanta In-Silico PK/PD & Tumor-Immune ODE Simulation Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This module replaces static/hardcoded timeline keyframes with a real-time
 * numerical solver (4th-order Runge-Kutta / RK4) integrating a system of coupled
 * ordinary differential equations (ODEs) parameterised by patient demographics,
 * cancer microenvironment profiles, and CAR-T construct pharmacokinetics.
 *
 * ─── MATHEMATICAL SYSTEM OF ODEs ──────────────────────────────────────────────
 *
 * 1. Tumor Cell Population T(t) [burden in mm / relative tumor cell mass]:
 *    dT/dt = r * T * (1 - T / K) - (k_kill * E * T / (T + h_T)) * (1 - 0.75 * X) * (1 - 0.5 * TME_supp)
 *    where:
 *      r = ln(2) / doubling_time_days  (intrinsic Gompertz/logistic growth rate)
 *      K = Carrying capacity (max tumor burden limit, e.g. 150 mm)
 *      k_kill = Maximum CAR-T cell kill rate (scaled by target antigen expression & sensitivity)
 *      h_T = Half-saturation constant for tumor cell lysis (Michaelis-Menten constant = 5.0 mm)
 *      X = CAR-T cell exhaustion accumulation factor (0 to 1)
 *      TME_supp = Tumor Microenvironment immunosuppression index (PD-L1, Tregs, MDSCs)
 *
 * 2. CAR-T Effector Population E(t) [total cells]:
 *    dE/dt = rho * E * (T / (T + h_E)) * Lympho_mult * (1 - X) - mu_E * (E - E_memory)
 *    where:
 *      rho = Maximum antigen-driven expansion rate (costimulatory domain: CD28=1.2, 4-1BB=0.85)
 *      h_E = Half-saturation constant for antigen-triggered proliferation = 10.0 mm
 *      Lympho_mult = Pre-infusion lymphodepletion multiplier (1.4 if preconditioned, 0.4 without)
 *      mu_E = Effector contraction / natural decay rate (0.08 / day)
 *      E_memory = Long-term memory stem cell persistence floor (~1e7 cells)
 *
 * 3. CAR-T Cell Exhaustion Accumulation X(t) [0.0 to 1.0]:
 *    dX/dt = k_exh * (T / (T + K_exh)) * (1 + PDL1_expr) - mu_exh * X
 *    where:
 *      k_exh = Induction rate of exhaustion under sustained high antigen exposure (0.035 / day)
 *      K_exh = Saturation threshold for antigen-induced exhaustion = 30.0 mm
 *      mu_exh = Exhaustion recovery / clearance coefficient (0.015 / day)
 *
 * 4. Systemic Cytokine Concentration C(t) [IL-6 proxy in pg/mL]:
 *    dC/dt = alpha_cyto * KillRate(t) + gamma_exp * max(0, dE/dt) - beta_cyto * (C - C_baseline)
 *    where:
 *      KillRate(t) = (k_kill * E * T) / (T + h_T)  (cytokines released during tumor lysis)
 *      alpha_cyto = Cytokine yield per unit cell kill (scaled by cancer crs_risk_multiplier)
 *      beta_cyto = Cytokine systemic metabolic clearance rate = 1.5 / day (t_1/2 ~ 5 hours)
 *      C_baseline = Normal physiological baseline IL-6 = 5.0 pg/mL
 *
 * 5. Dynamic ASTCT Consensus CRS Severity Grading:
 *    - Grade 0: Normal / Temp < 38.0°C and C(t) < 40 pg/mL
 *    - Grade 1: Fever (Temp >= 38.0°C) / C(t) >= 40 pg/mL (mild constitutional symptoms)
 *    - Grade 2: Temp >= 38.0°C & C(t) >= 120 pg/mL (hypotension responsive to fluids, mild hypoxia)
 *    - Grade 3: Temp >= 38.0°C & C(t) >= 250 pg/mL (vasopressor required, high-flow O2)
 *    - Grade 4: C(t) >= 500 pg/mL (life-threatening, mechanical ventilation, multi-organ distress)
 *
 * 6. Physiological Telemetry Coupling:
 *    - Temp(t) = 37.0 + min(3.8, (C(t) - 5) * 0.015 + CRS_grade * 0.35) + Jitter_temp
 *    - HeartRate(t) = baseline_HR + min(58, C(t) * 0.22 + CRS_grade * 7.5) + Jitter_HR
 *    - SpO2(t) = max(82, baseline_SpO2 - CRS_grade * 2.2 - max(0, C(t) - 100) * 0.01) + Jitter_SpO2
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface PatientSimParams {
    patient_age: number;
    patient_weight: number;
    cancer_type: string;
    cancer_stage: string;
    tumor_burden_mm: number;
    t_cell_dose: number;
    antigen_expression: number;
    prior_car_t: boolean;
    lymphodepletion: boolean;
    alc?: number | null;
    ldh?: number | null;
    days: number;
}

export interface SimulationStep {
    day: number;
    tumorMm: number;
    tumorCells: number;
    tCells: number;
    il6: number;
    crsGrade: number;
    bodyTemp: number;
    heartRate: number;
    spO2: number;
    exhaustion: number;
    response: 'CR' | 'PR' | 'SD' | 'PD';
}

export interface SimulationResult {
    trajectory: SimulationStep[];
    summary: {
        bestResponse: 'CR' | 'PR' | 'SD' | 'PD';
        finalResponse: 'CR' | 'PR' | 'SD' | 'PD';
        nadirTumorMm: number;
        finalTumorMm: number;
        tumorReductionPct: number;
        peakTCells: number;
        peakTCellDay: number;
        maxIl6: number;
        maxCrsGrade: number;
        pfsDays: number;
        durationOfResponseDays: number;
    };
    timeline: {
        tumor_mm: number[];
        t_cells: number[];
        il6: number[];
        crs_grade: number[];
        body_temp: number[];
        heart_rate: number[];
        sp_o2: number[];
    };
}

// Built-in cancer profile default parameters (fallback if backend unreachable)
const CANCER_PROFILE_PARAMS: Record<string, {
    doublingTimeDays: number;
    sensitivity: number;
    tmeSuppression: number;
    pdl1Expr: number;
    crsRiskMult: number;
}> = {
    'DLBCL': { doublingTimeDays: 25, sensitivity: 0.78, tmeSuppression: 0.30, pdl1Expr: 0.25, crsRiskMult: 1.0 },
    'B-ALL': { doublingTimeDays: 4, sensitivity: 0.90, tmeSuppression: 0.15, pdl1Expr: 0.10, crsRiskMult: 1.3 },
    'MCL':   { doublingTimeDays: 45, sensitivity: 0.72, tmeSuppression: 0.35, pdl1Expr: 0.15, crsRiskMult: 0.9 },
    'FL':    { doublingTimeDays: 180, sensitivity: 0.80, tmeSuppression: 0.40, pdl1Expr: 0.20, crsRiskMult: 0.7 },
    'MM':    { doublingTimeDays: 60, sensitivity: 0.70, tmeSuppression: 0.50, pdl1Expr: 0.30, crsRiskMult: 1.2 },
    'CLL':   { doublingTimeDays: 365, sensitivity: 0.65, tmeSuppression: 0.55, pdl1Expr: 0.15, crsRiskMult: 0.8 },
    'HL':    { doublingTimeDays: 35, sensitivity: 0.75, tmeSuppression: 0.60, pdl1Expr: 0.70, crsRiskMult: 0.6 },
    'GBM':   { doublingTimeDays: 50, sensitivity: 0.35, tmeSuppression: 0.80, pdl1Expr: 0.45, crsRiskMult: 0.5 },
    'PDAC':  { doublingTimeDays: 40, sensitivity: 0.25, tmeSuppression: 0.85, pdl1Expr: 0.30, crsRiskMult: 0.4 },
    'NSCLC': { doublingTimeDays: 130, sensitivity: 0.30, tmeSuppression: 0.70, pdl1Expr: 0.50, crsRiskMult: 0.5 },
    'CRC':   { doublingTimeDays: 90, sensitivity: 0.28, tmeSuppression: 0.65, pdl1Expr: 0.20, crsRiskMult: 0.5 },
    'HCC':   { doublingTimeDays: 110, sensitivity: 0.30, tmeSuppression: 0.75, pdl1Expr: 0.35, crsRiskMult: 0.6 },
};

// Costimulatory domain CAR-T kinetics
const PRODUCT_KINETICS: Record<string, { rhoMult: number; alphaMult: number; persistenceMult: number }> = {
    'axi-cel':  { rhoMult: 1.35, alphaMult: 1.30, persistenceMult: 0.85 }, // CD28 domain
    'breyanzi': { rhoMult: 1.00, alphaMult: 0.85, persistenceMult: 1.15 }, // 4-1BB domain + 1:1 CD4/CD8
    'tisa-cel': { rhoMult: 0.90, alphaMult: 0.90, persistenceMult: 1.30 }, // 4-1BB domain
    'tecartus': { rhoMult: 1.25, alphaMult: 1.20, persistenceMult: 0.90 }, // CD28 domain
    'abecma':   { rhoMult: 1.05, alphaMult: 1.10, persistenceMult: 1.00 }, // BCMA
    'carvykti': { rhoMult: 1.20, alphaMult: 1.15, persistenceMult: 1.25 }, // Dual-epitope BCMA
};

/**
 * Deterministic pseudo-random seed generator for realistic biological jitter
 */
function getJitter(seed: number, offset: number): number {
    const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

/**
 * Run RK4 ODE numerical integration over the simulation duration
 */
export function runODESimulation(
    params: PatientSimParams,
    productKey: string = 'axi-cel'
): SimulationResult {
    const totalDays = Math.max(30, Math.min(730, params.days || 365));
    const dt = 0.05; // 20 integration steps per day

    // Match cancer profile parameters
    const cTypeUpper = (params.cancer_type || '').toUpperCase();
    let profKey = 'DLBCL';
    for (const k of Object.keys(CANCER_PROFILE_PARAMS)) {
        if (cTypeUpper.includes(k)) { profKey = k; break; }
    }
    const profile = CANCER_PROFILE_PARAMS[profKey] || CANCER_PROFILE_PARAMS['DLBCL'];
    const product = PRODUCT_KINETICS[productKey.toLowerCase()] || PRODUCT_KINETICS['axi-cel'];

    // ── Model Parameters ──────────────────────────────────────────────────────
    const r = Math.log(2) / profile.doublingTimeDays; // Tumor intrinsic growth rate
    const K = 150.0; // Max tumor capacity in mm
    const antigenExpr = Math.max(0.1, Math.min(1.0, params.antigen_expression || 0.75));
    const kKillBase = 0.45 * profile.sensitivity * antigenExpr;
    const hT = 5.0; // Half-saturation constant (mm)

    const dose = params.t_cell_dose || 1e8;
    const lymphoMult = params.lymphodepletion !== false ? 1.4 : 0.4;
    const priorMult = params.prior_car_t ? 0.7 : 1.0;
    const rho = 0.85 * product.rhoMult * priorMult;
    const hE = 10.0;
    const muE = 0.075 / product.persistenceMult;
    const eMemory = Math.max(1e6, dose * 0.05);

    const kExh = 0.035 * (1 + profile.tmeSuppression);
    const kExhSat = 30.0;
    const muExh = 0.015;

    const crsMult = profile.crsRiskMult * product.alphaMult;
    const alphaCyto = 8.5 * crsMult;
    const betaCyto = 1.5; // Clear cytokines rapidly
    const cBase = 5.0; // Baseline IL-6

    // Initial state vector
    let T = Math.max(1.0, params.tumor_burden_mm || 50.0);
    let E = Math.max(1e6, dose * 0.2); // Circulating effector baseline
    let X = 0.05; // Initial exhaustion
    let C = cBase;

    const stepsPerDay = Math.round(1 / dt);
    const trajectory: SimulationStep[] = [];

    const baselineHR = Math.round(72 + (params.patient_age > 60 ? 5 : 0));
    const baselineSpO2 = 98;

    let nadirTumorMm = T;
    let peakTCells = E;
    let peakTCellDay = 0;
    let maxIl6 = C;
    let maxCrsGrade = 0;
    let pfsDays = totalDays;

    for (let day = 0; day <= totalDays; day++) {
        // Evaluate clinical metrics at daily interval
        const cellKillRate = (kKillBase * E * T) / (T + hT);
        
        // Calculate ASTCT CRS Grade
        let crsGrade = 0;
        if (C >= 500) crsGrade = 4;
        else if (C >= 250) crsGrade = 3;
        else if (C >= 120) crsGrade = 2;
        else if (C >= 40 || C > 15) crsGrade = 1;

        // Vitals coupling with deterministic biological jitter
        const jTemp = (getJitter(day, 1) - 0.5) * 0.25;
        const jHR = Math.round((getJitter(day, 2) - 0.5) * 3);
        const jSpO2 = (getJitter(day, 3) - 0.5) * 0.4;

        const bodyTemp = parseFloat((37.0 + Math.min(3.8, (C - 5) * 0.014 + crsGrade * 0.35) + jTemp).toFixed(1));
        const heartRate = Math.min(145, Math.max(55, Math.round(baselineHR + Math.min(58, C * 0.22 + crsGrade * 7.5) + jHR)));
        const spO2 = Math.min(100, Math.max(80, Math.round(baselineSpO2 - crsGrade * 2.2 - Math.max(0, C - 100) * 0.01 + jSpO2)));

        // Response criteria
        let response: 'CR' | 'PR' | 'SD' | 'PD' = 'SD';
        const reductionPct = ((params.tumor_burden_mm - T) / params.tumor_burden_mm) * 100;
        if (T <= 2.0 || reductionPct >= 95) response = 'CR';
        else if (reductionPct >= 50) response = 'PR';
        else if (T >= params.tumor_burden_mm * 1.25) response = 'PD';
        else response = 'SD';

        if (response === 'PD' && day > 30 && pfsDays === totalDays) {
            pfsDays = day;
        }

        if (T < nadirTumorMm) nadirTumorMm = T;
        if (E > peakTCells) { peakTCells = E; peakTCellDay = day; }
        if (C > maxIl6) maxIl6 = C;
        if (crsGrade > maxCrsGrade) maxCrsGrade = crsGrade;

        trajectory.push({
            day,
            tumorMm: parseFloat(Math.max(0, T).toFixed(2)),
            tumorCells: Math.round((T ** 3) * 1e6),
            tCells: Math.round(E),
            il6: parseFloat(Math.max(5.0, C).toFixed(1)),
            crsGrade,
            bodyTemp,
            heartRate,
            spO2,
            exhaustion: parseFloat(X.toFixed(3)),
            response,
        });

        // RK4 Sub-stepping for ODE numerical stability
        for (let s = 0; s < stepsPerDay; s++) {
            const rkStep = (curT: number, curE: number, curX: number, curC: number) => {
                // dT/dt
                const growth = r * curT * (1 - curT / K);
                const kill = (kKillBase * curE * curT) / (curT + hT) * (1 - 0.75 * curX) * (1 - 0.5 * profile.tmeSuppression);
                const dT = growth - kill;

                // dE/dt
                const expansion = rho * curE * (curT / (curT + hE)) * lymphoMult * (1 - curX);
                const decay = muE * Math.max(0, curE - eMemory);
                const dE = expansion - decay;

                // dX/dt
                const dX = kExh * (curT / (curT + kExhSat)) * (1 + profile.pdl1Expr) - muExh * curX;

                // dC/dt
                const cytoProd = alphaCyto * kill + 0.05 * Math.max(0, expansion);
                const cytoClear = betaCyto * (curC - cBase);
                const dC = cytoProd - cytoClear;

                return { dT, dE, dX, dC };
            };

            // k1
            const k1 = rkStep(T, E, X, C);
            // k2
            const k2 = rkStep(
                Math.max(0, T + 0.5 * dt * k1.dT),
                Math.max(1e4, E + 0.5 * dt * k1.dE),
                Math.max(0, Math.min(1, X + 0.5 * dt * k1.dX)),
                Math.max(cBase, C + 0.5 * dt * k1.dC)
            );
            // k3
            const k3 = rkStep(
                Math.max(0, T + 0.5 * dt * k2.dT),
                Math.max(1e4, E + 0.5 * dt * k2.dE),
                Math.max(0, Math.min(1, X + 0.5 * dt * k2.dX)),
                Math.max(cBase, C + 0.5 * dt * k2.dC)
            );
            // k4
            const k4 = rkStep(
                Math.max(0, T + dt * k3.dT),
                Math.max(1e4, E + dt * k3.dE),
                Math.max(0, Math.min(1, X + dt * k3.dX)),
                Math.max(cBase, C + dt * k3.dC)
            );

            // Update state
            T = Math.max(0, T + (dt / 6) * (k1.dT + 2 * k2.dT + 2 * k3.dT + k4.dT));
            E = Math.max(1e4, E + (dt / 6) * (k1.dE + 2 * k2.dE + 2 * k3.dE + k4.dE));
            X = Math.max(0, Math.min(1, X + (dt / 6) * (k1.dX + 2 * k2.dX + 2 * k3.dX + k4.dX)));
            C = Math.max(cBase, C + (dt / 6) * (k1.dC + 2 * k2.dC + 2 * k3.dC + k4.dC));
        }
    }

    const finalStep = trajectory[trajectory.length - 1];
    const initialBurden = params.tumor_burden_mm || 50.0;
    const tumorReductionPct = parseFloat(Math.max(0, Math.min(100, ((initialBurden - nadirTumorMm) / initialBurden) * 100)).toFixed(1));

    let bestResp: 'CR' | 'PR' | 'SD' | 'PD' = 'SD';
    if (nadirTumorMm <= 2.0 || tumorReductionPct >= 95) bestResp = 'CR';
    else if (tumorReductionPct >= 50) bestResp = 'PR';
    else if (nadirTumorMm > initialBurden * 1.2) bestResp = 'PD';

    let durationOfResponseDays = 0;
    if (bestResp === 'CR' || bestResp === 'PR') {
        const responseSteps = trajectory.filter(s => s.response === 'CR' || s.response === 'PR');
        durationOfResponseDays = responseSteps.length;
    }

    return {
        trajectory,
        summary: {
            bestResponse: bestResp,
            finalResponse: finalStep.response,
            nadirTumorMm: parseFloat(nadirTumorMm.toFixed(2)),
            finalTumorMm: finalStep.tumorMm,
            tumorReductionPct,
            peakTCells,
            peakTCellDay,
            maxIl6: parseFloat(maxIl6.toFixed(1)),
            maxCrsGrade,
            pfsDays,
            durationOfResponseDays,
        },
        timeline: {
            tumor_mm: trajectory.map(s => s.tumorMm),
            t_cells: trajectory.map(s => s.tCells),
            il6: trajectory.map(s => s.il6),
            crs_grade: trajectory.map(s => s.crsGrade),
            body_temp: trajectory.map(s => s.bodyTemp),
            heart_rate: trajectory.map(s => s.heartRate),
            sp_o2: trajectory.map(s => s.spO2),
        },
    };
}
