# CARVanta Sentinel HYDRA
## Technical Methodology Document
### Bio-NEST Incubator Application — Section 3: Methodology

---

## 1. Overview of Technical Approach

The CARVanta Sentinel HYDRA is developed using a hardware-first, software-integrated methodology. The development is structured across four interconnected phases: (1) PCB hardware design and fabrication, (2) embedded firmware development, (3) cloud AI platform integration, and (4) biosensor surface chemistry (electrode functionalization). Each phase is executed concurrently where possible and converges into a unified validation and testing phase.

---

## 2. Hardware Architecture

### 2.1 PCB Design (6-Layer Custom Board)

The Sentinel HYDRA is implemented on a custom 6-layer, 100mm × 100mm FR-4 printed circuit board designed using KiCad 10. The 6-layer stackup is designed to achieve maximum signal integrity and noise isolation for sensitive electrochemical measurements:

| Layer | Function |
|-------|----------|
| Layer 1 (F.Cu) | Digital signal traces — MCU, SPI, UART |
| Layer 2 (In1.Cu) | Solid GND copper plane |
| Layer 3 (In2.Cu) | Analog signal traces — AD5941, AS7341 |
| Layer 4 (In3.Cu) | Power planes — 3.3V analog and digital |
| Layer 5 (In4.Cu) | High-speed differential pairs — USB |
| Layer 6 (B.Cu) | Solid GND copper + thermal heater meander |

This stackup ensures that every sensitive analog trace has a ground plane on both sides, providing shielding from digital switching noise — a critical requirement for electrochemical current measurements in the picoampere range.

### 2.2 Core ICs and Their Roles

**AD5941 (×2) — Analog Devices:**
The AD5941 is a high-precision, low-power analog front-end (AFE) specifically designed for electrochemical measurement. Each AD5941 integrates a 16-bit SAR ADC (1.6 MSPS), a 12-bit DAC for electrode excitation, a low-noise potentiostat amplifier, a transimpedance amplifier (TIA), and a hardware DFT (Discrete Fourier Transform) engine for impedance calculation. Two AD5941 chips provide 8 independent electrochemical channels.

The device supports three measurement modes:
- **Cyclic Voltammetry (CV):** Voltage sweep from -0.6V to +0.6V, measures oxidation/reduction peak current for biomarker quantification
- **Differential Pulse Voltammetry (DPV):** Higher sensitivity mode for low-concentration analytes (picomolar range)
- **Electrochemical Impedance Spectroscopy (EIS):** Frequency sweep from 0.015 Hz to 200 kHz; measures cell impedance, enabling label-free binding detection

**AS7341 — ams OSRAM:**
An 11-channel spectral sensor covering 350nm to 1000nm with dedicated channels for F1 (415nm), F2 (445nm), F3 (480nm), F4 (515nm), F5 (555nm), F6 (590nm), F7 (630nm), F8 (680nm), NIR (910nm), Clear, and Flicker. Used for quantitative lateral flow assay readout and fluorescence measurement. Three excitation LEDs (UV 365nm, Blue 470nm, White) are PWM-driven by the RP2040.

**TMP117 — Texas Instruments:**
Precision temperature sensor with ±0.1°C accuracy. Used for real-time monitoring of the heater zone to enable isothermal amplification at 65°C ± 0.2°C.

**ESP32-S3-WROOM-1:**
Dual-core Xtensa LX7 @ 240MHz. Handles WiFi, BLE, TFT display, I2C sensor polling via TCA9548A mux, SD card logging, cloud API communication, and on-device TensorFlow Lite Micro inference.

**RP2040:**
Dual-core ARM Cortex-M0+ @ 133MHz with unique PIO (Programmable I/O) blocks. Handles all real-time, deterministic tasks: AD5941 SPI sequencing, AS7341 readout, LED control, and PID heater control loop at 10Hz. Communicates with ESP32 via 921,600 baud UART using a JSON command protocol.

### 2.3 Power Management

| Component | Role |
|-----------|------|
| BQ25895 | USB-C PD charging (up to 12V, 4.5A input) |
| TPS63020 | Buck-boost converter → stable VSYS_3V3 from 1.8V–5.5V battery |
| TPS7A20 | Ultra-low-noise LDO → 3V3_A (analog supply) |
| AMS1117 | Digital LDO → 3V3_D (digital supply) |
| MAX17048 | LiPo fuel gauge — reports battery % via I2C |

The power architecture separates analog and digital supply rails with ferrite bead filters to prevent digital switching noise from contaminating electrochemical measurements.

---

## 3. Embedded Firmware Architecture

### 3.1 ESP32-S3 Firmware (Brain MCU)

Written in C++ using the Arduino framework (PlatformIO). Key functions:

1. **Measurement orchestration:** Sends JSON commands over UART to RP2040 (`"run_echem"`, `"run_eis"`, `"read_spectral"`, `"read_thermal"`)
2. **I2C sensor polling:** Reads MAX30102 (SpO2/HR), MLX90614 (IR temperature), DS3231 (RTC), LSM6DSO (IMU) via TCA9548A I2C multiplexer
3. **Display management:** Real-time dashboard on 2.4" TFT showing all 8 electrochemical channels, spectral data, vitals, and battery level
4. **Cloud upload:** HTTP POST to CARVanta Railway API endpoint with full sensor JSON payload
5. **SD logging:** Appends timestamped CSV rows to local SD card for offline operation
6. **TFLite inference:** Runs on-device biomarker scoring using quantized TensorFlow Lite Micro model (planned Phase 3)

### 3.2 RP2040 Firmware (Co-Processor)

Written in C++ using the Arduino-RP2040 framework. Key functions:

1. **AD5941 SPI driver:** Implements full register read/write protocol, configures switch matrix per channel, runs CV and EIS sweeps
2. **AS7341 driver:** Configures I2C SMUX registers for low/high channel bank switching, manages LED excitation timing
3. **PID Heater control:** Runs at 10Hz interrupt, reads TMP117, computes PID output, drives heater MOSFET via PWM
4. **Command parser:** Receives JSON commands from ESP32, executes sensor tasks, returns JSON data

### 3.3 Communication Protocol

```
ESP32 → UART → RP2040: {"cmd": "run_echem", "ts": 12345}
RP2040 → UART → ESP32: {"type": "echem", "channels": [1.23, 0.87, ...]}
```

All communication is JSON-over-UART at 921,600 baud for low-latency, human-readable debugging.

---

## 4. Cloud AI Platform

The CARVanta platform (deployed on Railway, built with FastAPI + PostgreSQL) receives sensor data from each Sentinel HYDRA device. The AI scoring engine processes the multi-modal data:

- **Electrochemical signals:** Peak current values from DPV sweeps are processed by a trained XGBoost classifier to estimate biomarker concentration (calibration curve-based)
- **Spectral data:** 11-channel spectral signature is analyzed by a CNN-based classifier trained on lateral flow assay images to provide quantitative result scores
- **Fusion layer:** A meta-model combines electrochemical + optical signals for final diagnostic confidence score (0–100)

The platform provides oncologist review interface, patient record management, longitudinal tracking, and regulatory-grade audit logs.

---

## 5. Biosensor Surface Chemistry (Phase 2)

The working electrodes (WE) of the sensor strips are gold-plated PCB traces. Functionalization follows:

1. **SAM formation:** Thiolated aptamers (specific to target biomarker — CD19, BCMA, CA-125) are incubated on the gold surface for 16 hours, forming a self-assembled monolayer via Au-S bond
2. **Backfilling:** 6-mercapto-1-hexanol (MCH) is applied to align aptamers vertically and block non-specific binding sites
3. **Validation:** EIS is used to confirm successful functionalization by measuring the Rct (charge transfer resistance) shift before and after aptamer immobilization

This phase requires wet-lab infrastructure (Bio-NEST support requested).

---

## 6. Development Timeline

| Phase | Duration | Milestone |
|-------|----------|-----------|
| PCB schematic + layout complete | Month 1-2 | KiCad DRC: 0 errors |
| PCB fabrication + assembly | Month 2-3 | 10 prototype boards |
| Firmware development + testing | Month 2-4 | All sensors operational |
| Electrode functionalization | Month 3-6 | EIS validation of aptamer SAM |
| Cloud AI integration | Month 4-6 | End-to-end pipeline test |
| Prototype validation | Month 6-9 | Accuracy vs ELISA gold standard |
| CDSCO pre-submission | Month 9-12 | Regulatory pathway defined |

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AD5941 routing noise | 6-layer stackup with ground planes on both sides of analog layer |
| Aptamer specificity | Test with 3 different aptamer sequences per target; validate cross-reactivity |
| RP2040 timing jitter | Use PIO blocks for deterministic, interrupt-free sensor control |
| Cloud connectivity loss | SD card local logging as fallback; sync on reconnection |
| Regulatory delay | Engage CDSCO consultant from Month 6; design to IEC 62366 standards |

---

*Document prepared by: CARVanta Team*
*Date: June 2026*
*Contact: carvanta.platform@gmail.com*
