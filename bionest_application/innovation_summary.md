# Bio-NEST Application — Answers

---

## INNOVATION SUMMARY (400-500 words)

### 1. Problem Statement

Cancer diagnostics in India remain prohibitively expensive, slow, and geographically inaccessible. Over 70% of cancer cases in India are diagnosed at Stage III or IV, when survival rates drop to below 20%. The primary barrier is not lack of awareness — it is the absence of affordable, rapid, point-of-care diagnostic infrastructure. A standard immunoassay panel at a tertiary hospital costs ₹8,000–₹25,000 and requires 48–72 hours for results. For a patient in a Tier-2 or Tier-3 city, this means traveling hundreds of kilometers, losing wages, and waiting days — often leading to abandonment of diagnosis altogether. India has approximately 1.4 million new cancer cases annually, yet fewer than 500 functional oncology diagnostic labs serve a population of 1.4 billion. The result is a diagnostic desert where the technology exists to detect cancer early, but the infrastructure to deliver that detection does not reach the people who need it most.

### 2. Proposed Technology

CARVanta Sentinel HYDRA is a first-of-its-kind multimodal point-of-care cancer immunodiagnostic instrument built on a single custom-designed 6-layer printed circuit board. The device integrates three independent sensing modalities that have never before been combined on a single PCB platform. First, it incorporates two AD5941 electrochemical analog front-end chips capable of running Cyclic Voltammetry, Differential Pulse Voltammetry, and Electrochemical Impedance Spectroscopy (EIS) across eight independent sensor channels simultaneously. This enables label-free, aptamer-functionalized detection of cancer biomarkers such as CD19, BCMA, CA-125, and PSA directly from a fingerprick blood sample. Second, an AS7341 eleven-channel spectrophotometer (350nm–1000nm) is integrated to perform simultaneous colorimetric and fluorescence quantification of lateral flow assay results, eliminating subjective visual interpretation. Third, a precision thermal control module built around the TMP117 sensor (±0.1°C accuracy) and a PID-controlled PCB heater enables on-board Loop-Mediated Isothermal Amplification (LAMP) at 65°C, making nucleic acid-based cancer marker detection possible without any external laboratory equipment.

The instrument is controlled by a dual-MCU architecture: an ESP32-S3 handles the user interface (2.4" TFT display), WiFi connectivity, cloud data upload to the CARVanta AI platform, and SD card logging, while a co-processing RP2040 microcontroller manages all real-time sensor sequencing, AD5941 SPI communication, heater PID, and optical LED excitation. The entire system runs on a 3.7V LiPo battery with USB-C charging, producing a fully portable, handheld diagnostic instrument.

### 3. Uniqueness

No commercially available or research-stage point-of-care device combines electrochemical impedance spectroscopy, 11-channel spectrophotometry, and on-board thermal nucleic acid amplification on a single integrated PCB. Existing competitors address only one modality: Abbot ID NOW provides isothermal amplification but no electrochemical sensing; Roche cobas systems provide electrochemical immunoassays but require laboratory infrastructure; portable spectrophotometers exist but lack electrochemical capability. CARVanta Sentinel HYDRA uniquely delivers all three modalities in one device, powered by edge AI inference running directly on the ESP32-S3 (TensorFlow Lite Micro). The device does not require trained laboratory personnel — a community health worker can operate it with a 30-minute training session. Combined with the CARVanta cloud AI platform for result interpretation and oncologist review, the complete system creates an end-to-end cancer diagnostic pipeline accessible at the village level.

---

## MARKET POTENTIAL (400-500 words)

### 1. Target Users or Customers

The primary customers of CARVanta Sentinel HYDRA are three distinct segments. The first and largest segment is government and NGO-operated rural health infrastructure — specifically Community Health Centres (CHCs), Primary Health Centres (PHCs), and Ayushman Bharat Health and Wellness Centres (HWCs), of which there are over 160,000 across India. These facilities currently have zero cancer diagnostic capability beyond basic clinical examination. The second segment is private diagnostic chains operating in Tier-2 and Tier-3 cities — players like Thyrocare, Metropolis, and regional labs who need to expand their cancer screening menu without investing in high-cost ELISA analyzers. The third segment is oncology hospitals and research institutions that need a rapid bedside monitoring tool to track treatment response through serial biomarker measurement — a use case currently served only by expensive, slow laboratory panels.

### 2. Market Opportunity

The Indian in-vitro diagnostics (IVD) market is currently valued at approximately USD 2.5 billion (₹20,800 crore) and is growing at 15% CAGR, driven by government push for early disease detection under Ayushman Bharat and the National Cancer Grid. The addressable market for point-of-care cancer screening instruments in India alone is estimated at USD 380 million (₹3,160 crore) by 2028. Globally, the point-of-care cancer diagnostics market is projected to reach USD 8.9 billion by 2030, with Asia-Pacific being the fastest-growing region. Our initial addressable market — government health centres, Tier-2 private labs, and research hospitals — represents approximately 12,000 institutions in India, each representing a ₹1.5–3 lakh instrument sale plus a recurring consumable (sensor strip) revenue of ₹50,000–₹1,20,000 per year.

### 3. Competitive Landscape

Current competitors fall into two categories: high-end laboratory analyzers (Roche, Abbott, Siemens — priced at ₹30–80 lakh per unit, requiring trained technicians and cold-chain reagents) and low-end lateral flow rapid tests (no quantitative output, high false-positive rates, no EIS capability). No direct competitor offers the combination of electrochemical impedance spectroscopy, optical spectrophotometry, and thermal amplification in a portable ₹25,000–₹40,000 device. Our sustainable competitive advantage is the proprietary custom PCB hardware (Sentinel HYDRA) that integrates this capability at a manufacturing cost of approximately ₹8,000–₹12,000 per unit at scale, combined with the CARVanta AI software platform that provides cloud-based result validation and regulatory-grade audit trails — creating a hardware-software moat that cannot be easily replicated.

---

## BUDGET ESTIMATE (INR)

**₹18,50,000 (Eighteen Lakh Fifty Thousand)**

| Item | Amount (INR) |
|------|-------------|
| PCB fabrication & assembly (50 prototype units) | ₹4,50,000 |
| Electronic components & ICs (AD5941, RP2040, etc.) | ₹2,80,000 |
| Electrode chemistry & wet-lab consumables | ₹3,00,000 |
| Lab access & testing equipment | ₹2,50,000 |
| Software development & cloud infrastructure | ₹1,80,000 |
| Regulatory consultation (CDSCO pre-submission) | ₹1,20,000 |
| Personnel (2 research engineers, 12 months) | ₹2,40,000 |
| Miscellaneous & contingency | ₹30,000 |

---

## IP STATUS

**Patents planned**

Patent application to be filed covering:
- Novel single-PCB multimodal biosensor architecture combining EIS + spectrophotometry + isothermal amplification
- Dual-MCU real-time sensor sequencing architecture for point-of-care electrochemical instruments
- AI-assisted multi-biomarker cancer scoring algorithm (CARVanta Scoring Engine)

---

## SUPPORT REQUIRED FROM BIO-NEST

**Selected:**
- ✅ Laboratory access
- ✅ Technical mentoring
- ✅ Regulatory and IPR guidance
- ✅ Business mentoring

**Expected Outcomes:**
- ✅ Prototype development
- ✅ Product validation

---

## EXISTING INCUBATION SUPPORT

Currently incubated: **No**

---

## EXISTING FUNDING SUPPORT

**Bootstrapped / Self-funded**
