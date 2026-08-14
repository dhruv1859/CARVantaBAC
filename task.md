# Task Tracker — CARVanta Digital Twin Improvements

- [x] **Part 1 — Fix blank-screen bug on Cancer Profile click**
  - [x] Identified root cause: key mismatch between frontend (`prof.name`, `prof.cancer_type`) and backend `CANCER_PROFILES` dictionary keys (`DLBCL`, `B-ALL`, `MCL`, `MM`, etc.).
  - [x] Enhanced backend `simulate_with_cancer_profile` in `digital_twin/tumor_models.py` with flexible multi-key lookup (key, name, code, case-insensitive).
  - [x] Added `key`, `cancer_type`, `primary_target`, `typical_response_rate`, `median_pfs_months` to `get_cancer_profiles_summary()`.
  - [x] Instrumented frontend click handlers with try/catch and explicit `targetCancerType` passing.
  - [x] Wrapped Cancer Profiles view in defensive checks with fallback empty states (`"No data available for this profile yet"`) preventing white screens.
  - [x] Verified all 12 cancer profiles render reliably.

- [x] **Part 2 — Real PK/PD + Tumor-Immune ODE Simulation Engine**
  - [x] Created `bioSimulationEngine.ts` RK4 numerical solver implementing coupled system of ODEs for $T(t)$, $E(t)$, $X(t)$, $C(t)$.
  - [x] Documented mathematical equations, parameters, and ASTCT consensus CRS grading in the engine header block.
  - [x] Linked inputs from Patient Setup, Cancer Profiles, PK/PD, and CAR-T Products (e.g. CD28 vs 4-1BB kinetics, tumor burden, antigen expression).
  - [x] Dynamically integrated `runODESimulation` into `DigitalTwin.tsx` via `useMemo` so scrubbing the Day slider indexes into the computed trajectory.
  - [x] Bound 3D biological visualizer (particle counts, cytokine sparks, blood flow speed, tumor radius) directly to current ODE state.
  - [x] Verified output behavior: responder vs non-responder trajectories, dynamic CRS grade elevation/decay, and deterministic rerun.
