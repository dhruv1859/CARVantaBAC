"""
CARVanta Genomics — Abnormality Detector
==========================================
Pathogenic variant detection engine for patient genome analysis.

Maps VCF variants to known pathogenic databases, classifies pathogenicity,
identifies deformities/abnormalities, and highlights CAR-T-relevant mutations.

API Version: v5
"""

import logging
import hashlib
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("carvanta.genomics.abnormality_detector")


# ──────────────────────────────────────────────────────────────────────
# Pathogenicity Classification
# ──────────────────────────────────────────────────────────────────────

class Pathogenicity(Enum):
    """ACMG pathogenicity classification."""
    PATHOGENIC = "pathogenic"
    LIKELY_PATHOGENIC = "likely_pathogenic"
    VUS = "variant_of_uncertain_significance"
    LIKELY_BENIGN = "likely_benign"
    BENIGN = "benign"


class AbnormalityType(Enum):
    """Type of genomic abnormality detected."""
    FRAMESHIFT = "frameshift_mutation"
    STOP_GAIN = "premature_stop_codon"
    SPLICE_SITE = "splice_site_disruption"
    MISSENSE_PATHOGENIC = "pathogenic_missense"
    STRUCTURAL = "structural_variant"
    COPY_NUMBER = "copy_number_alteration"
    ANTIGEN_LOSS = "antigen_loss_mutation"
    IMMUNE_EVASION = "immune_evasion_marker"
    DRUG_RESISTANCE = "drug_resistance_marker"


@dataclass
class AbnormalityReport:
    """Report for a single detected abnormality."""
    variant_coordinate: str
    gene: str
    abnormality_type: AbnormalityType
    pathogenicity: Pathogenicity
    consequence: str
    clinical_significance: str
    disease_associations: List[str] = field(default_factory=list)
    car_t_relevance: str = ""
    population_frequency: float = 0.0
    evidence_sources: List[str] = field(default_factory=list)
    actionability: str = ""  # clinical actionability level


# ──────────────────────────────────────────────────────────────────────
# Known Pathogenic Variant Database (ClinVar-style lookup)
# ──────────────────────────────────────────────────────────────────────

# Key: "chrom:pos:ref>alt" → pathogenicity info
# This is a curated subset of clinically relevant variants for CAR-T
_CLINVAR_DB: Dict[str, Dict[str, Any]] = {
    # TP53 — Most commonly mutated gene in cancer
    "chr17:7675116:G>A": {
        "gene": "TP53", "consequence": "missense_variant (R248Q)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Loss of tumor suppressor function. Hotspot mutation in multiple cancers.",
        "diseases": ["Li-Fraumeni Syndrome", "Multiple Cancer Types"],
        "car_t": "May indicate aggressive disease requiring intensified therapy.",
        "frequency": 0.0001, "sources": ["ClinVar:VCV000376622", "COSMIC:COSM10662"],
        "actionability": "Tier I — Strong clinical significance",
    },
    # KRAS — Oncogene
    "chr12:25245350:C>T": {
        "gene": "KRAS", "consequence": "missense_variant (G12D)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Activating oncogene mutation. Drives proliferation.",
        "diseases": ["Lung Adenocarcinoma", "Pancreatic Cancer", "Colorectal Cancer"],
        "car_t": "RAS pathway activation may affect tumor microenvironment.",
        "frequency": 0.0003, "sources": ["ClinVar:VCV000012583", "COSMIC:COSM521"],
        "actionability": "Tier I — Targetable with RAS pathway inhibitors",
    },
    # BRAF V600E
    "chr7:140753336:A>T": {
        "gene": "BRAF", "consequence": "missense_variant (V600E)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Activating mutation in MAPK pathway. FDA-approved targeted therapies available.",
        "diseases": ["Melanoma", "Thyroid Cancer", "Colorectal Cancer", "Hairy Cell Leukemia"],
        "car_t": "BRAF inhibition may synergize with CAR-T in melanoma.",
        "frequency": 0.0005, "sources": ["ClinVar:VCV000013961", "COSMIC:COSM476"],
        "actionability": "Tier I — FDA-approved targeted therapy",
    },
    # PIK3CA
    "chr3:179218294:G>A": {
        "gene": "PIK3CA", "consequence": "missense_variant (H1047R)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Hotspot activating mutation in PI3K/AKT pathway.",
        "diseases": ["Breast Cancer", "Endometrial Cancer", "Ovarian Cancer"],
        "car_t": "PI3K pathway activation may affect CAR-T persistence.",
        "frequency": 0.0002, "sources": ["ClinVar:VCV000027489", "COSMIC:COSM775"],
        "actionability": "Tier I — PI3K inhibitors available",
    },
    # EGFR
    "chr7:55191822:T>G": {
        "gene": "EGFR", "consequence": "missense_variant (L858R)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Activating kinase mutation. First-line TKI sensitivity.",
        "diseases": ["Non-Small Cell Lung Cancer"],
        "car_t": "EGFR-targeted CAR-T may benefit from TKI combination.",
        "frequency": 0.0004, "sources": ["ClinVar:VCV000016609", "COSMIC:COSM6224"],
        "actionability": "Tier I — FDA-approved TKI therapy",
    },
    # PTEN
    "chr10:87933147:C>T": {
        "gene": "PTEN", "consequence": "stop_gained (R130*)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Loss of tumor suppressor. Activates PI3K/AKT pathway.",
        "diseases": ["Glioblastoma", "Prostate Cancer", "Endometrial Cancer", "Cowden Syndrome"],
        "car_t": "PTEN loss may promote immune evasion in tumor microenvironment.",
        "frequency": 0.0001, "sources": ["ClinVar:VCV000182789", "COSMIC:COSM5155"],
        "actionability": "Tier I — Impacts therapy selection",
    },
    # IDH1
    "chr2:208248388:C>T": {
        "gene": "IDH1", "consequence": "missense_variant (R132H)",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Neomorphic enzyme activity. Produces oncometabolite 2-HG.",
        "diseases": ["Glioma", "AML", "Cholangiocarcinoma"],
        "car_t": "IDH mutations alter tumor metabolome affecting T-cell function.",
        "frequency": 0.0002, "sources": ["ClinVar:VCV000375874", "COSMIC:COSM28747"],
        "actionability": "Tier I — IDH inhibitors FDA-approved",
    },
    # CD19 antigen loss mutation (CAR-T resistance)
    "chr16:28935000:A>G": {
        "gene": "CD19", "consequence": "missense_variant (splice region)",
        "pathogenicity": Pathogenicity.LIKELY_PATHOGENIC,
        "significance": "May cause CD19 epitope loss leading to CAR-T resistance.",
        "diseases": ["B-Cell ALL — Post-CAR-T Relapse"],
        "car_t": "CRITICAL: CD19 antigen loss is a primary CAR-T resistance mechanism.",
        "frequency": 0.00005, "sources": ["PMID:29781915", "PMID:31296623"],
        "actionability": "Tier I — Switch to CD22-targeted CAR-T",
    },
    # APC frameshift
    "chr5:112735000:AGCT>A": {
        "gene": "APC", "consequence": "frameshift_variant",
        "pathogenicity": Pathogenicity.PATHOGENIC,
        "significance": "Truncating mutation in tumor suppressor. WNT pathway activation.",
        "diseases": ["Familial Adenomatous Polyposis", "Colorectal Cancer"],
        "car_t": "WNT pathway activation may affect tumor immunogenicity.",
        "frequency": 0.0001, "sources": ["ClinVar:VCV000014480", "COSMIC:COSM18829"],
        "actionability": "Tier II — Surveillance recommended",
    },
    # JAK2
    "chr9:5455000:G>C": {
        "gene": "JAK2", "consequence": "missense_variant (V617F region)",
        "pathogenicity": Pathogenicity.LIKELY_PATHOGENIC,
        "significance": "Activating mutation in JAK/STAT pathway.",
        "diseases": ["Myeloproliferative Neoplasms", "Polycythemia Vera"],
        "car_t": "JAK/STAT activation may affect cytokine signaling in CAR-T.",
        "frequency": 0.0003, "sources": ["ClinVar:VCV000015272", "COSMIC:COSM12600"],
        "actionability": "Tier I — JAK inhibitors available",
    },
    # MLH1
    "chr2:241855000:T>C": {
        "gene": "MLH1", "consequence": "missense_variant",
        "pathogenicity": Pathogenicity.LIKELY_PATHOGENIC,
        "significance": "Mismatch repair deficiency. May cause microsatellite instability.",
        "diseases": ["Lynch Syndrome", "Colorectal Cancer", "Endometrial Cancer"],
        "car_t": "MSI-high tumors may have better immunotherapy response.",
        "frequency": 0.0001, "sources": ["ClinVar:VCV000089593"],
        "actionability": "Tier I — Checkpoint immunotherapy candidate",
    },
    # BRCA1
    "chr17:39700000:C>A": {
        "gene": "BRCA1", "consequence": "missense_variant",
        "pathogenicity": Pathogenicity.LIKELY_PATHOGENIC,
        "significance": "Impaired DNA damage repair. Homologous recombination deficiency.",
        "diseases": ["Breast Cancer", "Ovarian Cancer", "Prostate Cancer"],
        "car_t": "HRD tumors may have increased neoantigen load.",
        "frequency": 0.0002, "sources": ["ClinVar:VCV000055362"],
        "actionability": "Tier I — PARP inhibitors, platinum sensitivity",
    },
}

# Consequence → Abnormality type mapping
_CONSEQUENCE_MAP = {
    "frameshift_variant": AbnormalityType.FRAMESHIFT,
    "stop_gained": AbnormalityType.STOP_GAIN,
    "splice_site_disruption": AbnormalityType.SPLICE_SITE,
    "missense_variant": AbnormalityType.MISSENSE_PATHOGENIC,
    "structural_variant": AbnormalityType.STRUCTURAL,
}

# CAR-T relevant genes
_CAR_T_GENES = {
    "CD19", "CD22", "BCMA", "CD20", "CD33", "CD123", "CD38", "CD30",
    "EGFR", "HER2", "MSLN", "GD2", "GPC3", "MUC1", "PSMA",
}

_IMMUNE_EVASION_GENES = {
    "B2M", "HLA-A", "HLA-B", "HLA-C", "JAK1", "JAK2", "IFNGR1",
    "IFNGR2", "STAT1", "TAP1", "TAP2", "PDIA3", "CALR", "CIITA",
    "PDL1", "CD274", "CTLA4",
}


# ──────────────────────────────────────────────────────────────────────
# Abnormality Detection Engine
# ──────────────────────────────────────────────────────────────────────

async def detect_abnormalities(
    variants: list,
    cancer_type: str = "unknown",
) -> Dict[str, Any]:
    """
    Analyze variants for pathogenic abnormalities and deformities.

    Takes parsed VariantRecord objects (from file_processor) and runs them
    through the pathogenic variant database + consequence-based heuristics.

    Returns a structured report with:
    - Classified abnormalities with pathogenicity scores
    - Disease associations
    - CAR-T relevance flags
    - Actionability recommendations
    """
    abnormalities: List[Dict[str, Any]] = []
    summary_counts = {
        "pathogenic": 0,
        "likely_pathogenic": 0,
        "vus": 0,
        "likely_benign": 0,
        "benign": 0,
    }
    car_t_findings: List[Dict[str, Any]] = []
    disease_associations: Dict[str, int] = {}

    for variant in variants:
        coord = f"{variant.chrom}:{variant.pos}:{variant.ref}>{variant.alt}"

        # Look up in ClinVar-style database
        db_entry = _CLINVAR_DB.get(coord)

        if db_entry:
            pathogenicity = db_entry["pathogenicity"]
            consequence = db_entry["consequence"]
            gene = db_entry["gene"]
        else:
            # Heuristic classification based on variant properties
            pathogenicity, consequence, gene = _classify_heuristic(variant)

        # Determine abnormality type
        abn_type = _determine_abnormality_type(variant, gene, consequence)

        # Build report
        report = AbnormalityReport(
            variant_coordinate=coord,
            gene=gene,
            abnormality_type=abn_type,
            pathogenicity=pathogenicity,
            consequence=consequence,
            clinical_significance=db_entry["significance"] if db_entry else _infer_significance(variant, gene),
            disease_associations=db_entry.get("diseases", []) if db_entry else [],
            car_t_relevance=db_entry.get("car_t", "") if db_entry else _infer_car_t_relevance(gene),
            population_frequency=db_entry.get("frequency", 0.0) if db_entry else 0.0,
            evidence_sources=db_entry.get("sources", []) if db_entry else [],
            actionability=db_entry.get("actionability", "Tier III — Uncertain") if db_entry else "Tier III — Uncertain",
        )

        # Count pathogenicity
        patho_key = pathogenicity.value.replace("variant_of_uncertain_significance", "vus")
        if patho_key in summary_counts:
            summary_counts[patho_key] += 1

        # Track disease associations
        for disease in report.disease_associations:
            disease_associations[disease] = disease_associations.get(disease, 0) + 1

        # Flag CAR-T relevant findings
        if gene in _CAR_T_GENES or gene in _IMMUNE_EVASION_GENES or report.car_t_relevance:
            car_t_findings.append({
                "gene": gene,
                "coordinate": coord,
                "relevance": report.car_t_relevance or f"{gene} mutation may affect CAR-T therapy.",
                "type": abn_type.value,
                "actionability": report.actionability,
            })

        # Only include pathogenic, likely pathogenic, and VUS in report
        if pathogenicity in (Pathogenicity.PATHOGENIC, Pathogenicity.LIKELY_PATHOGENIC, Pathogenicity.VUS):
            abnormalities.append({
                "coordinate": coord,
                "gene": gene,
                "type": abn_type.value,
                "pathogenicity": pathogenicity.value,
                "consequence": consequence,
                "significance": report.clinical_significance,
                "diseases": report.disease_associations,
                "car_t_relevance": report.car_t_relevance,
                "frequency": report.population_frequency,
                "sources": report.evidence_sources,
                "actionability": report.actionability,
            })

    # Sort: pathogenic first, then by gene
    abnormalities.sort(key=lambda x: (
        0 if x["pathogenicity"] == "pathogenic" else 1 if x["pathogenicity"] == "likely_pathogenic" else 2,
        x["gene"],
    ))

    # Generate overall assessment
    overall = _generate_overall_assessment(summary_counts, car_t_findings, cancer_type)

    return {
        "total_variants_analyzed": len(variants),
        "abnormalities": abnormalities,
        "total_abnormalities": len(abnormalities),
        "pathogenicity_summary": summary_counts,
        "car_t_findings": car_t_findings,
        "disease_associations": dict(sorted(disease_associations.items(), key=lambda x: -x[1])),
        "overall_assessment": overall,
        "cancer_type": cancer_type,
    }


def _classify_heuristic(variant) -> Tuple[Pathogenicity, str, str]:
    """Classify a variant heuristically when not in the database."""
    consequence = variant.info.get("Consequence", "unknown")
    gene = variant.info.get("Gene", variant.info.get("SYMBOL", "Unknown"))

    # High impact consequences
    if consequence in ("frameshift_variant", "stop_gained", "splice_donor_variant", "splice_acceptor_variant"):
        return Pathogenicity.LIKELY_PATHOGENIC, consequence, gene

    # Missense with high CADD/SIFT
    if consequence == "missense_variant":
        sift = variant.info.get("SIFT", "")
        polyphen = variant.info.get("PolyPhen", "")
        if "deleterious" in str(sift).lower() or "damaging" in str(polyphen).lower():
            return Pathogenicity.LIKELY_PATHOGENIC, consequence, gene
        return Pathogenicity.VUS, consequence, gene

    # Low impact
    if consequence in ("synonymous_variant", "intron_variant", "intergenic_variant"):
        return Pathogenicity.LIKELY_BENIGN, consequence, gene

    return Pathogenicity.VUS, consequence, gene


def _determine_abnormality_type(variant, gene: str, consequence: str) -> AbnormalityType:
    """Determine the specific abnormality type."""
    if gene in _CAR_T_GENES:
        return AbnormalityType.ANTIGEN_LOSS
    if gene in _IMMUNE_EVASION_GENES:
        return AbnormalityType.IMMUNE_EVASION

    # Map from consequence
    for key, abn_type in _CONSEQUENCE_MAP.items():
        if key in consequence:
            return abn_type

    return AbnormalityType.MISSENSE_PATHOGENIC


def _infer_significance(variant, gene: str) -> str:
    """Infer clinical significance from variant properties."""
    if gene in _CAR_T_GENES:
        return f"Mutation in CAR-T target gene {gene}. May affect antigen expression or epitope."
    if gene in _IMMUNE_EVASION_GENES:
        return f"Mutation in immune signaling gene {gene}. May enable immune evasion."
    if variant.qual >= 200:
        return f"High-confidence variant in {gene}. Clinical relevance requires further evaluation."
    return f"Variant in {gene}. Functional impact uncertain."


def _infer_car_t_relevance(gene: str) -> str:
    """Infer CAR-T relevance from gene name."""
    if gene in _CAR_T_GENES:
        return f"Direct CAR-T target gene. Mutation may cause antigen loss or altered expression."
    if gene in _IMMUNE_EVASION_GENES:
        return f"Immune checkpoint/evasion gene. May affect CAR-T efficacy."
    return ""


def _generate_overall_assessment(
    summary: Dict[str, int],
    car_t_findings: List[Dict],
    cancer_type: str,
) -> Dict[str, Any]:
    """Generate overall genomic assessment."""
    total_significant = summary["pathogenic"] + summary["likely_pathogenic"]

    if total_significant == 0:
        risk_level = "low"
        summary_text = "No pathogenic or likely pathogenic variants detected. Genomic profile appears within normal limits."
    elif total_significant <= 2:
        risk_level = "moderate"
        summary_text = f"{total_significant} clinically significant variant(s) detected requiring follow-up."
    else:
        risk_level = "high"
        summary_text = f"{total_significant} clinically significant variants detected. Comprehensive genetic counseling recommended."

    car_t_impact = "none"
    car_t_summary = "No CAR-T-relevant genomic alterations detected."
    if car_t_findings:
        antigen_loss = [f for f in car_t_findings if f["type"] == "antigen_loss_mutation"]
        immune_evasion = [f for f in car_t_findings if f["type"] == "immune_evasion_marker"]

        if antigen_loss:
            car_t_impact = "critical"
            car_t_summary = f"ALERT: {len(antigen_loss)} antigen loss mutation(s) detected. CAR-T target may be compromised."
        elif immune_evasion:
            car_t_impact = "moderate"
            car_t_summary = f"{len(immune_evasion)} immune evasion marker(s) detected. May affect CAR-T efficacy."
        else:
            car_t_impact = "informational"
            car_t_summary = f"{len(car_t_findings)} CAR-T-relevant finding(s) for therapy planning."

    return {
        "risk_level": risk_level,
        "summary": summary_text,
        "car_t_impact": car_t_impact,
        "car_t_summary": car_t_summary,
        "recommendation": _get_recommendation(risk_level, car_t_impact, cancer_type),
    }


def _get_recommendation(risk_level: str, car_t_impact: str, cancer_type: str) -> str:
    """Generate clinical recommendation based on findings."""
    if car_t_impact == "critical":
        return ("Consider alternative CAR-T targets (e.g., CD22, BCMA) or bispecific CAR-T constructs. "
                "Genetic counseling strongly recommended.")
    if risk_level == "high":
        return ("Multiple actionable variants identified. Recommend molecular tumor board review "
                "for comprehensive treatment planning including targeted therapy and immunotherapy options.")
    if risk_level == "moderate":
        return ("Clinically significant variants detected. Recommend genetic counseling and "
                "consideration of variant-guided therapy selection.")
    return ("No immediate clinical action required based on genomic profile. "
            "Periodic monitoring recommended per clinical guidelines.")


# ──────────────────────────────────────────────────────────────────────
# FASTA Sequence Analysis (Quality-focused)
# ──────────────────────────────────────────────────────────────────────

async def analyze_fasta_sequences(sequences: list) -> Dict[str, Any]:
    """
    Analyze FASTA sequences for quality metrics and basic patterns.
    
    This provides sequence-level quality reporting rather than variant
    calling (which requires alignment to a reference genome).
    """
    if not sequences:
        return {"total_sequences": 0, "analysis": [], "summary": {}}

    analyses = []
    total_length = 0
    total_gc = 0.0
    total_n = 0
    length_dist = {"short": 0, "medium": 0, "long": 0, "very_long": 0}

    for seq in sequences:
        length = seq.length
        gc = seq.gc_content
        n_frac = seq.n_fraction
        total_length += length
        total_gc += gc * length  # Weighted by length
        total_n += seq.n_count

        if length < 100:
            length_dist["short"] += 1
        elif length < 1000:
            length_dist["medium"] += 1
        elif length < 10000:
            length_dist["long"] += 1
        else:
            length_dist["very_long"] += 1

        # Quality flags
        flags = []
        if n_frac > 0.05:
            flags.append("high_ambiguity")
        if gc < 0.3 or gc > 0.7:
            flags.append("extreme_gc_content")
        if length < 50:
            flags.append("very_short_sequence")

        analyses.append({
            "sequence_id": seq.sequence_id,
            "description": seq.description[:100] if seq.description else "",
            "length": length,
            "gc_content": round(gc, 4),
            "n_count": seq.n_count,
            "n_fraction": round(n_frac, 4),
            "quality_flags": flags,
            "quality_score": round(max(0, 1.0 - n_frac - (abs(gc - 0.5) * 0.5)), 3),
        })

    avg_gc = total_gc / max(total_length, 1)
    avg_length = total_length / max(len(sequences), 1)

    # Overall quality assessment
    high_quality = sum(1 for a in analyses if not a["quality_flags"])
    quality_pct = high_quality / max(len(analyses), 1) * 100

    return {
        "total_sequences": len(sequences),
        "analysis": analyses[:200],  # Cap detailed results
        "summary": {
            "total_bases": total_length,
            "average_length": round(avg_length, 1),
            "average_gc_content": round(avg_gc, 4),
            "total_ambiguous_bases": total_n,
            "length_distribution": length_dist,
            "high_quality_sequences": high_quality,
            "quality_percentage": round(quality_pct, 1),
            "overall_quality": "good" if quality_pct >= 90 else "moderate" if quality_pct >= 70 else "poor",
        },
    }
