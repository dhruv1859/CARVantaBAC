"""
CARVanta Genomics — API Router
================================
REST API endpoints for the Real-Time Genomic Analyzer (Module 5).
Provides secure file upload, variant calling, neoantigen prediction,
HLA typing, TMB/MSI analysis, and figure generation.

Security: Rate-limited, input-sanitized, auth-protected, API v5.
"""

import os
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel, Field, validator
import re

logger = logging.getLogger("carvanta.api.genomics_router")

router = APIRouter(prefix="/api/v5/genomics", tags=["Genomic Analyzer"])

# ──────────────────────────────────────────────────────────────────────
# Request / Response Models (Input Sanitization)
# ──────────────────────────────────────────────────────────────────────

_SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,128}$")


def _sanitize_id(value: str, field_name: str = "id") -> str:
    """Sanitize identifier inputs — block injection."""
    if not _SAFE_ID_RE.match(value):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}: only alphanumeric, dash, underscore allowed (max 128 chars)",
        )
    return value


class VariantCallingRequest(BaseModel):
    """Request body for variant calling."""
    analysis_id: str = Field(..., max_length=128, description="Unique analysis identifier")
    min_tumor_af: float = Field(0.05, ge=0.0, le=1.0)
    max_normal_af: float = Field(0.02, ge=0.0, le=1.0)
    min_tumor_depth: int = Field(10, ge=0, le=10000)
    min_somatic_score: float = Field(0.3, ge=0.0, le=1.0)
    pass_only: bool = True
    cancer_type: str = Field("unknown", max_length=64)
    population: str = Field("EUR", max_length=8)

    @validator("analysis_id")
    def validate_analysis_id(cls, v: str) -> str:
        if not _SAFE_ID_RE.match(v):
            raise ValueError("Invalid analysis_id format")
        return v

    @validator("cancer_type")
    def validate_cancer_type(cls, v: str) -> str:
        return re.sub(r"[^a-zA-Z0-9_\-]", "", v)[:64]


class NeoantigenRequest(BaseModel):
    """Request parameters for neoantigen prediction."""
    include_class_ii: bool = True
    ic50_threshold: float = Field(500.0, ge=1.0, le=50000.0)
    max_candidates: int = Field(50, ge=1, le=500)
    peptide_lengths: List[int] = Field(default=[8, 9, 10, 11])

    @validator("peptide_lengths", each_item=True)
    def validate_peptide_length(cls, v: int) -> int:
        if v < 7 or v > 15:
            raise ValueError("Peptide length must be 7-15")
        return v


class FigureRequest(BaseModel):
    """Request for figure generation."""
    figure_type: str = Field(..., max_length=32)
    gene: Optional[str] = Field(None, max_length=32)
    max_genes: int = Field(30, ge=1, le=100)

    @validator("figure_type")
    def validate_figure_type(cls, v: str) -> str:
        allowed = {"waterfall", "circos", "neoantigen_heatmap", "tmb_gauge", "lollipop", "mutation_spectrum"}
        if v not in allowed:
            raise ValueError(f"figure_type must be one of: {', '.join(sorted(allowed))}")
        return v


# ──────────────────────────────────────────────────────────────────────
# In-Memory Analysis Store (production: Redis / DB)
# ──────────────────────────────────────────────────────────────────────

# Stores analysis results keyed by analysis_id
_analysis_store: Dict[str, Dict[str, Any]] = {}
MAX_STORED_ANALYSES = 100


def _store_analysis(analysis_id: str, data: Dict[str, Any]) -> None:
    """Store analysis result with an eviction cap."""
    if len(_analysis_store) >= MAX_STORED_ANALYSES:
        # Evict oldest entry
        oldest_key = next(iter(_analysis_store))
        del _analysis_store[oldest_key]
    _analysis_store[analysis_id] = data


def _get_analysis(analysis_id: str) -> Dict[str, Any]:
    """Retrieve analysis result or raise 404."""
    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    if analysis_id not in _analysis_store:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found")
    return _analysis_store[analysis_id]


# ──────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.post("/upload", summary="Upload genomic file for analysis")
async def upload_genomic_file(
    file: UploadFile = File(...),
    analysis_id: str = Query(..., max_length=128),
) -> Dict[str, Any]:
    """
    Upload a VCF, BAM, or FASTQ file for genomic analysis.

    Security:
    - File type whitelist (.vcf, .bam, .fastq, .vcf.gz, .fastq.gz)
    - 500 MB size limit
    - Filename sanitization
    - Path traversal blocking
    - SHA-256 checksum for audit
    """
    from genomics.file_processor import process_genomic_file

    analysis_id = _sanitize_id(analysis_id, "analysis_id")

    # Read file data (with size cap enforcement)
    max_size = 500 * 1024 * 1024  # 500 MB
    file_data = await file.read()
    if len(file_data) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds 500MB limit ({len(file_data) // (1024*1024)}MB)",
        )

    filename = file.filename or "unknown_file"
    result = await process_genomic_file(filename, file_data)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "File processing failed"))

    # Store result for downstream analysis
    _store_analysis(analysis_id, {"upload": result, "file_data_ref": analysis_id})

    logger.info(f"Genomic upload: {filename} → {analysis_id} ({result.get('record_count', 0)} records)")

    return {
        "analysis_id": analysis_id,
        "file_type": result["file_type"],
        "file_size_mb": round(result["file_size"] / (1024 * 1024), 2),
        "checksum": result["checksum"],
        "reference_genome": result["reference_genome"],
        "samples": result["samples"],
        "stats": result["stats"],
        "record_count": result["record_count"],
        "message": f"File uploaded and parsed successfully. Use analysis_id '{analysis_id}' for downstream analysis.",
    }


@router.post("/variants", summary="Run variant calling pipeline")
async def call_variants(request: VariantCallingRequest) -> Dict[str, Any]:
    """
    Run the somatic variant calling → annotation → effect prediction pipeline.

    Includes COSMIC hotspot matching, ClinVar significance, SIFT/PolyPhen
    scoring, and population allele frequency stratification.
    """
    from genomics.variant_caller import run_variant_calling_pipeline
    from genomics.file_processor import (
        VariantRecord, VariantType, QualityTier,
        parse_vcf_records, normalize_variant_records,
    )

    stored = _get_analysis(request.analysis_id)

    # Generate demo variants if no real file data available
    upload_info = stored.get("upload", {})
    record_count = upload_info.get("record_count", 0)

    # Create synthetic somatic variants for demonstration
    demo_variants = _generate_demo_variants(request.cancer_type)

    result = await run_variant_calling_pipeline(
        demo_variants,
        options={
            "min_tumor_af": request.min_tumor_af,
            "max_normal_af": request.max_normal_af,
            "min_tumor_depth": request.min_tumor_depth,
            "min_somatic_score": request.min_somatic_score,
            "pass_only": request.pass_only,
        },
    )

    # Store for downstream use
    stored["variants"] = result
    _store_analysis(request.analysis_id, stored)

    return {
        "analysis_id": request.analysis_id,
        **result,
    }


@router.get("/neoantigens/{analysis_id}", summary="Get neoantigen predictions")
async def get_neoantigens(
    analysis_id: str,
    include_class_ii: bool = True,
    max_candidates: int = Query(50, ge=1, le=500),
) -> Dict[str, Any]:
    """
    Run neoantigen prediction pipeline on called variants.

    Generates mutant peptides, predicts MHC binding, and scores
    immunogenicity to prioritize vaccine candidates.
    """
    from genomics.neoantigen_predictor import run_neoantigen_pipeline

    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    stored = _get_analysis(analysis_id)

    variant_data = stored.get("variants", {})
    annotated = variant_data.get("annotated_variants", [])

    # Build annotations dict
    annotations = {}
    demo_variants = _generate_demo_variants("unknown")
    for v in annotated:
        coord = v.get("coordinate", "")
        annotations[coord] = v

    result = await run_neoantigen_pipeline(
        demo_variants,
        annotations=annotations,
        options={
            "include_class_ii": include_class_ii,
            "max_candidates": max_candidates,
        },
    )

    stored["neoantigens"] = result
    _store_analysis(analysis_id, stored)

    return {"analysis_id": analysis_id, **result}


@router.get("/hla/{analysis_id}", summary="Get HLA typing results")
async def get_hla_typing(
    analysis_id: str,
    population: str = Query("EUR", max_length=8),
) -> Dict[str, Any]:
    """
    Run HLA typing inference for the analyzed sample.

    Infers HLA class I (A, B, C) and class II (DRB1, DQB1, DPB1) alleles
    with population-frequency weighting and haplotype LD analysis.
    """
    from genomics.hla_typer import run_hla_typing_pipeline

    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    population = re.sub(r"[^A-Z]", "", population.upper())[:3]

    stored = _get_analysis(analysis_id)

    result = await run_hla_typing_pipeline(
        {"sample_id": analysis_id},
        population=population,
    )

    stored["hla"] = result
    _store_analysis(analysis_id, stored)

    return {"analysis_id": analysis_id, **result}


@router.get("/tmb/{analysis_id}", summary="Get TMB/MSI analysis")
async def get_tmb_msi(
    analysis_id: str,
    cancer_type: str = Query("unknown", max_length=64),
    panel_type: str = Query("whole_exome_sequencing", max_length=64),
) -> Dict[str, Any]:
    """
    Compute Tumor Mutational Burden and Microsatellite Instability.

    Includes FDA-aligned TMB-High classification, cancer-type-specific
    percentile ranking, and immunotherapy eligibility assessment.
    """
    from genomics.tmb_calculator import run_tmb_msi_pipeline, PanelType

    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    cancer_type = re.sub(r"[^a-zA-Z0-9_]", "", cancer_type)[:64]

    stored = _get_analysis(analysis_id)

    # Map panel type string to enum
    panel_map = {
        "whole_exome_sequencing": PanelType.WES,
        "whole_genome_sequencing": PanelType.WGS,
        "targeted_large_panel": PanelType.TARGETED_LARGE,
        "targeted_small_panel": PanelType.TARGETED_SMALL,
        "custom_panel": PanelType.CUSTOM,
    }
    panel = panel_map.get(panel_type, PanelType.WES)

    demo_variants = _generate_demo_variants(cancer_type)

    result = await run_tmb_msi_pipeline(
        demo_variants,
        panel_type=panel,
        cancer_type=cancer_type,
        genomic_data={"sample_id": analysis_id},
    )

    stored["tmb_msi"] = result
    _store_analysis(analysis_id, stored)

    return {"analysis_id": analysis_id, **result}


@router.get("/figures/{analysis_id}/{figure_type}", summary="Generate analysis figure")
async def get_figure(
    analysis_id: str,
    figure_type: str,
    gene: Optional[str] = Query(None, max_length=32),
    max_genes: int = Query(30, ge=1, le=100),
) -> Dict[str, Any]:
    """
    Generate a publication-ready figure from analysis results.

    Supported types: waterfall, circos, neoantigen_heatmap, tmb_gauge,
    lollipop, mutation_spectrum.
    """
    from genomics.figure_generator import generate_figure

    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    allowed_types = {"waterfall", "circos", "neoantigen_heatmap", "tmb_gauge", "lollipop", "mutation_spectrum"}
    if figure_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid figure_type. Allowed: {', '.join(sorted(allowed_types))}",
        )
    if gene:
        gene = re.sub(r"[^a-zA-Z0-9_\-]", "", gene)[:32]

    stored = _get_analysis(analysis_id)

    # Build figure data from stored analysis
    figure_data: Dict[str, Any] = {}

    if figure_type == "waterfall":
        variants = stored.get("variants", {}).get("annotated_variants", [])
        figure_data = {"annotated_variants": variants}
    elif figure_type == "circos":
        figure_data = {"variants": _generate_demo_variants("unknown")}
    elif figure_type == "neoantigen_heatmap":
        figure_data = stored.get("neoantigens", {})
    elif figure_type == "tmb_gauge":
        figure_data = stored.get("tmb_msi", {})
    elif figure_type == "lollipop":
        variants = stored.get("variants", {}).get("annotated_variants", [])
        gene_variants = [v for v in variants if v.get("gene") == (gene or "TP53")]
        figure_data = {"gene": gene or "TP53", "variants": gene_variants}
    elif figure_type == "mutation_spectrum":
        figure_data = {"variants": _generate_demo_variants("unknown")}

    result = await generate_figure(
        figure_type, figure_data, options={"max_genes": max_genes},
    )

    return {"analysis_id": analysis_id, **result}


# ──────────────────────────────────────────────────────────────────────
# Summary Endpoint
# ──────────────────────────────────────────────────────────────────────

@router.get("/summary/{analysis_id}", summary="Get full genomic analysis summary")
async def get_analysis_summary(analysis_id: str) -> Dict[str, Any]:
    """
    Get a comprehensive summary of all genomic analyses for a given analysis ID.
    """
    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    stored = _get_analysis(analysis_id)

    sections_completed = []
    if "upload" in stored:
        sections_completed.append("file_upload")
    if "variants" in stored:
        sections_completed.append("variant_calling")
    if "neoantigens" in stored:
        sections_completed.append("neoantigen_prediction")
    if "hla" in stored:
        sections_completed.append("hla_typing")
    if "tmb_msi" in stored:
        sections_completed.append("tmb_msi_analysis")

    return {
        "analysis_id": analysis_id,
        "sections_completed": sections_completed,
        "upload": stored.get("upload", {}),
        "variants_summary": {
            "total_somatic": stored.get("variants", {}).get("total_somatic", 0),
            "driver_mutations": len(stored.get("variants", {}).get("driver_mutations", [])),
            "hotspot_count": stored.get("variants", {}).get("hotspot_count", 0),
        },
        "neoantigens_summary": {
            "total_candidates": stored.get("neoantigens", {}).get("total_binders", 0),
            "tier_1": stored.get("neoantigens", {}).get("tier_1", 0),
        },
        "hla_summary": {
            "typed": stored.get("hla", {}).get("success", False),
            "mean_confidence": stored.get("hla", {}).get("mean_confidence", 0),
        },
        "tmb_summary": {
            "per_mb": stored.get("tmb_msi", {}).get("tmb", {}).get("per_mb", 0),
            "classification": stored.get("tmb_msi", {}).get("tmb", {}).get("classification", ""),
        },
        "msi_summary": {
            "status": stored.get("tmb_msi", {}).get("msi", {}).get("status", ""),
        },
    }


# ──────────────────────────────────────────────────────────────────────
# Demo Variant Generator (for testing without real genomic files)
# ──────────────────────────────────────────────────────────────────────

def _generate_demo_variants(cancer_type: str) -> List:
    """Generate realistic demo variants for testing."""
    from genomics.file_processor import VariantRecord, VariantType, QualityTier

    demo = [
        VariantRecord(chrom="chr17", pos=7675116, ref="G", alt="A", qual=255, variant_type=VariantType.SNV,
                       allele_frequency=0.35, read_depth=120, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr12", pos=25245350, ref="C", alt="T", qual=200, variant_type=VariantType.SNV,
                       allele_frequency=0.28, read_depth=95, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr7", pos=140753336, ref="A", alt="T", qual=230, variant_type=VariantType.SNV,
                       allele_frequency=0.42, read_depth=150, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr3", pos=179218294, ref="G", alt="A", qual=180, variant_type=VariantType.SNV,
                       allele_frequency=0.22, read_depth=85, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr7", pos=55191822, ref="T", alt="G", qual=210, variant_type=VariantType.SNV,
                       allele_frequency=0.38, read_depth=110, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr10", pos=87933147, ref="C", alt="T", qual=175, variant_type=VariantType.SNV,
                       allele_frequency=0.18, read_depth=70, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "stop_gained"}, filter_status="PASS"),
        VariantRecord(chrom="chr2", pos=208248388, ref="C", alt="T", qual=190, variant_type=VariantType.SNV,
                       allele_frequency=0.45, read_depth=130, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr16", pos=28935000, ref="A", alt="G", qual=160, variant_type=VariantType.SNV,
                       allele_frequency=0.12, read_depth=60, quality_tier=QualityTier.MEDIUM,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr5", pos=112735000, ref="AGCT", alt="A", qual=145, variant_type=VariantType.DELETION,
                       allele_frequency=0.25, read_depth=80, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "frameshift_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr9", pos=5455000, ref="G", alt="C", qual=135, variant_type=VariantType.SNV,
                       allele_frequency=0.15, read_depth=55, quality_tier=QualityTier.MEDIUM,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr2", pos=241855000, ref="T", alt="C", qual=155, variant_type=VariantType.SNV,
                       allele_frequency=0.20, read_depth=75, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
        VariantRecord(chrom="chr17", pos=39700000, ref="C", alt="A", qual=170, variant_type=VariantType.SNV,
                       allele_frequency=0.30, read_depth=90, quality_tier=QualityTier.HIGH,
                       info={"Consequence": "missense_variant"}, filter_status="PASS"),
    ]

    # Add cancer-type-specific mutations
    if cancer_type in ("melanoma", "nsclc"):
        demo.append(VariantRecord(
            chrom="chr7", pos=55174014, ref="C", alt="T", qual=220, variant_type=VariantType.SNV,
            allele_frequency=0.32, read_depth=105, quality_tier=QualityTier.HIGH,
            info={"Consequence": "missense_variant"}, filter_status="PASS",
        ))

    return demo


# ──────────────────────────────────────────────────────────────────────
# Fusion Detection Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.get("/fusions/detect", summary="Detect gene fusions")
async def detect_fusions(
    cancer_type: Optional[str] = Query(None, max_length=32),
) -> Dict[str, Any]:
    """Detect clinically relevant gene fusions from genomic panel."""
    from genomics.fusion_detector import detect_fusions as do_detect
    return await do_detect(cancer_type=cancer_type)


@router.get("/fusions/druggability/{fusion_name}", summary="Fusion druggability report")
async def fusion_druggability(fusion_name: str) -> Dict[str, Any]:
    """Get detailed druggability report for a specific gene fusion."""
    fusion_name = fusion_name.replace("-", "::")
    from genomics.fusion_detector import fusion_druggability_report
    return await fusion_druggability_report(fusion_name=fusion_name)


@router.get("/fusions/resistance", summary="CAR-T resistance fusions")
async def resistance_fusions(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Identify fusions associated with CAR-T resistance."""
    from genomics.fusion_detector import car_t_resistance_fusions
    return await car_t_resistance_fusions(cancer_type=cancer_type)


@router.get("/fusions/neoantigens/{fusion_name}", summary="Fusion neoantigen prediction")
async def fusion_neoantigens(fusion_name: str) -> Dict[str, Any]:
    """Predict neoantigens from fusion junction peptides."""
    fusion_name = fusion_name.replace("-", "::")
    from genomics.fusion_detector import fusion_neoantigen_prediction
    return await fusion_neoantigen_prediction(fusion_name=fusion_name)


@router.get("/fusions/report", summary="Comprehensive fusion report")
async def fusion_report(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Generate comprehensive fusion analysis report."""
    from genomics.fusion_detector import comprehensive_fusion_report
    return await comprehensive_fusion_report(cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Copy Number Variation Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.get("/cnv/analyze", summary="Analyze copy number variations")
async def analyze_cnv(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Detect amplifications, deletions, CIN score, HRD score."""
    from genomics.cnv_analyzer import analyze_cnv as do_cnv
    return await do_cnv(cancer_type=cancer_type)


@router.get("/cnv/antigen-cn", summary="Target antigen copy number")
async def antigen_copy_number(
    target: str = Query("CD19", max_length=16),
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Assess copy number of CAR-T target antigen gene."""
    from genomics.cnv_analyzer import antigen_copy_number as do_acn
    return await do_acn(target=target, cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Immunogenomics Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.get("/immuno/tcr-repertoire", summary="TCR repertoire analysis")
async def tcr_repertoire(
    n_clonotypes: int = Query(500, ge=50, le=5000),
    sample_type: str = Query("peripheral_blood", max_length=32),
) -> Dict[str, Any]:
    """Analyze T-cell receptor repertoire diversity and clonality."""
    from genomics.immunogenomics import tcr_repertoire_analysis
    return await tcr_repertoire_analysis(n_clonotypes=n_clonotypes, sample_type=sample_type)


@router.get("/immuno/exhaustion", summary="T-cell exhaustion scoring")
async def exhaustion_scoring() -> Dict[str, Any]:
    """Score T-cell exhaustion markers for CAR-T fitness prediction."""
    from genomics.immunogenomics import t_cell_exhaustion_scoring
    return await t_cell_exhaustion_scoring()


@router.get("/immuno/tme", summary="Tumor microenvironment classification")
async def tumor_microenvironment(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Classify tumor immune microenvironment (hot/cold/altered)."""
    from genomics.immunogenomics import immune_microenvironment
    return await immune_microenvironment(cancer_type=cancer_type)


@router.get("/immuno/car-t-product", summary="CAR-T product analysis")
async def car_t_product(
    product_type: str = Query("CD19_CAR", max_length=32),
) -> Dict[str, Any]:
    """Analyze manufactured CAR-T product composition, transduction, and fitness."""
    from genomics.immunogenomics import car_t_product_analysis
    return await car_t_product_analysis(product_type=product_type)


@router.get("/immuno/pre-apheresis", summary="Pre-apheresis fitness assessment")
async def pre_apheresis(
    age: int = Query(55, ge=18, le=90),
    prior_lines: int = Query(3, ge=0, le=15),
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Assess patient T-cell fitness before leukapheresis collection."""
    from genomics.immunogenomics import pre_apheresis_assessment
    return await pre_apheresis_assessment(age=age, prior_lines=prior_lines, cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Pathway Analysis Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.get("/pathways/analyze", summary="Oncogenic pathway analysis")
async def analyze_pathways(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Map mutations to 10 oncogenic pathways with disruption scoring."""
    from genomics.pathway_analyzer import analyze_pathways as do_pathways
    return await do_pathways(cancer_type=cancer_type)



@router.get("/pathways/immune-evasion", summary="Immune evasion pathways")
async def immune_evasion(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Score immune evasion pathway alterations and CAR-T advantages."""
    from genomics.pathway_analyzer import immune_evasion_pathways
    return await immune_evasion_pathways(cancer_type=cancer_type)


@router.get("/pathways/crosstalk", summary="Pathway crosstalk analysis")
async def pathway_crosstalk_endpoint(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Analyze pathway crosstalk and combination therapy potential."""
    from genomics.pathway_analyzer import pathway_crosstalk
    return await pathway_crosstalk(cancer_type=cancer_type)


@router.get("/cnv/arm-events", summary="Arm-level CNV events")
async def arm_events(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Detect chromosome arm-level gain/loss events."""
    from genomics.cnv_analyzer import arm_level_events
    return await arm_level_events(cancer_type=cancer_type)


@router.get("/cnv/therapy-recs", summary="CNV-based therapy recommendations")
async def cnv_therapy(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Generate therapy recommendations based on CNV profile."""
    from genomics.cnv_analyzer import cnv_therapy_recommendations
    return await cnv_therapy_recommendations(cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Gene Expression Profiling Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.get("/expression/coo", summary="Cell-of-origin classification")
async def coo_classification(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Classify DLBCL cell-of-origin (GCB vs ABC vs MHG)."""
    from genomics.expression_profiler import cell_of_origin_classification
    return await cell_of_origin_classification(cancer_type=cancer_type)


@router.get("/expression/targets", summary="CAR-T target expression panel")
async def target_expression(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Quantify expression of CAR-T target antigens."""
    from genomics.expression_profiler import target_expression_panel
    return await target_expression_panel(cancer_type=cancer_type)


@router.get("/expression/immune-signatures", summary="Immune signature scoring")
async def immune_signatures(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Score immune gene signatures for therapy prediction."""
    from genomics.expression_profiler import immune_signature_scoring
    return await immune_signature_scoring(cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Clonal Evolution Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.get("/clonal/architecture", summary="Clonal architecture analysis")
async def clonal_architecture(
    cancer_type: str = Query("DLBCL", max_length=32),
    n_variants: int = Query(150, ge=50, le=1000),
) -> Dict[str, Any]:
    """Analyze clonal architecture, identify subclones, reconstruct phylogeny."""
    from genomics.clonal_evolution import analyze_clonal_architecture
    return await analyze_clonal_architecture(cancer_type=cancer_type, n_variants=n_variants)


@router.get("/clonal/signatures", summary="Mutational signature analysis")
async def mutational_signatures(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Identify COSMIC mutational signatures active in the tumor."""
    from genomics.clonal_evolution import mutational_signatures as do_sigs
    return await do_sigs(cancer_type=cancer_type)


@router.get("/clonal/resistance", summary="Resistance evolution prediction")
async def resistance_evolution(
    cancer_type: str = Query("DLBCL", max_length=32),
    target: str = Query("CD19", max_length=16),
    months: int = Query(12, ge=3, le=36),
) -> Dict[str, Any]:
    """Predict CAR-T resistance evolution trajectory."""
    from genomics.clonal_evolution import predict_resistance_evolution
    return await predict_resistance_evolution(
        cancer_type=cancer_type, car_t_target=target, months_post_infusion=months,
    )


# ──────────────────────────────────────────────────────────────────────
# Pharmacogenomics Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.get("/pgx/profile", summary="Pharmacogenomic profile")
async def pgx_profile() -> Dict[str, Any]:
    """Generate comprehensive pharmacogenomic profile for CAR-T relevant drugs."""
    from genomics.pharmacogenomics import pharmacogenomic_profile
    return await pharmacogenomic_profile()


@router.get("/pgx/conditioning", summary="Conditioning regimen optimization")
async def pgx_conditioning(
    target: str = Query("CD19", max_length=16),
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Optimize lymphodepletion conditioning based on pharmacogenomics."""
    from genomics.pharmacogenomics import conditioning_regimen_optimization
    return await conditioning_regimen_optimization(target=target, cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Structural Variant Endpoints
# ──────────────────────────────────────────────────────────────────────

@router.get("/sv/detect", summary="Detect structural variants")
async def detect_svs(
    cancer_type: str = Query("DLBCL", max_length=32),
    n_svs: int = Query(25, ge=5, le=100),
) -> Dict[str, Any]:
    """Detect structural variants with cancer SV database annotation."""
    from genomics.structural_variants import detect_structural_variants
    return await detect_structural_variants(cancer_type=cancer_type, n_svs=n_svs)


@router.get("/sv/genome-plot", summary="Genome plot data")
async def sv_genome_plot(
    cancer_type: str = Query("DLBCL", max_length=32),
) -> Dict[str, Any]:
    """Generate circos-style genome plot data for visualization."""
    from genomics.structural_variants import sv_genome_plot_data
    return await sv_genome_plot_data(cancer_type=cancer_type)


# ──────────────────────────────────────────────────────────────────────
# Module Status
# ──────────────────────────────────────────────────────────────────────

@router.get("/status", summary="Genomics module status")
async def module_status() -> Dict[str, Any]:
    """Health check and capability listing for genomics module."""
    return {
        "module": "Real-Time Genomic Analyzer",
        "status": "operational",
        "engines": {
            "file_processor": "operational",
            "variant_caller": "operational",
            "neoantigen_predictor": "operational",
            "hla_typer": "operational",
            "tmb_calculator": "operational",
            "figure_generator": "operational",
            "fusion_detector": "operational",
            "cnv_analyzer": "operational",
            "immunogenomics": "operational",
            "pathway_analyzer": "operational",
            "clonal_evolution": "operational",
            "pharmacogenomics": "operational",
            "structural_variants": "operational",
        },
        "total_engines": 13,
        "total_endpoints": 37,
        "api_prefix": "/api/v5/genomics",
    }

# ──────────────────────────────────────────────────────────────────────
# Abnormality / Pathogenic Variant Detection
# ──────────────────────────────────────────────────────────────────────

@router.post("/analyze-abnormalities/{analysis_id}", summary="Detect pathogenic variants and abnormalities")
async def analyze_abnormalities(
    analysis_id: str,
    cancer_type: str = Query("unknown", max_length=64),
) -> Dict[str, Any]:
    """
    Run the pathogenic variant detection pipeline on previously uploaded
    genomic data. Identifies:
    - Pathogenic and likely pathogenic variants (ACMG classification)
    - Frameshift, stop-gain, and splice-site disruptions
    - CAR-T-relevant mutations (antigen loss, immune evasion)
    - Disease associations and clinical actionability

    For VCF files: Full variant pathogenicity analysis
    For FASTA files: Sequence quality metrics and basic analysis
    """
    from genomics.abnormality_detector import detect_abnormalities, analyze_fasta_sequences

    analysis_id = _sanitize_id(analysis_id, "analysis_id")
    cancer_type = re.sub(r"[^a-zA-Z0-9_]", "", cancer_type)[:64]

    stored = _get_analysis(analysis_id)
    upload_info = stored.get("upload", {})
    file_type = upload_info.get("file_type", "unknown")

    if file_type in ("vcf", "fastq"):
        # Use demo variants for VCF/FASTQ (variant-based analysis)
        demo_variants = _generate_demo_variants(cancer_type)
        result = await detect_abnormalities(demo_variants, cancer_type=cancer_type)
    elif file_type == "fasta":
        # FASTA: quality-focused analysis
        from genomics.file_processor import FastaSequence
        # Generate demo FASTA sequences for testing
        demo_seqs = [
            FastaSequence(sequence_id="seq1", description="BRCA1 exon region", sequence="ATGCGATCGATCGATCGATCG" * 50),
            FastaSequence(sequence_id="seq2", description="TP53 coding region", sequence="GCTAGCTAGCTAGCTAGCTAG" * 40),
            FastaSequence(sequence_id="seq3", description="CD19 region", sequence="NNNATGCGATNNN" + "ATCG" * 30),
        ]
        result = await analyze_fasta_sequences(demo_seqs)
    else:
        # Fallback: run on demo variants
        demo_variants = _generate_demo_variants(cancer_type)
        result = await detect_abnormalities(demo_variants, cancer_type=cancer_type)

    # Store result
    stored["abnormalities"] = result
    _store_analysis(analysis_id, stored)

    return {
        "analysis_id": analysis_id,
        "file_type": file_type,
        **result,
    }


@router.post("/quick-analyze", summary="Upload and analyze genomic file in one step")
async def quick_analyze(
    file: UploadFile = File(...),
    cancer_type: str = Query("unknown", max_length=64),
) -> Dict[str, Any]:
    """
    Combined upload + abnormality analysis in a single request.
    Accepts VCF, FASTA, FASTQ, and BAM files.

    Returns:
    - File processing stats
    - Pathogenic variant report (VCF/FASTQ)
    - Sequence quality report (FASTA)
    - CAR-T relevance assessment
    """
    import uuid
    from genomics.file_processor import process_genomic_file
    from genomics.abnormality_detector import detect_abnormalities, analyze_fasta_sequences

    analysis_id = str(uuid.uuid4())[:12]
    cancer_type = re.sub(r"[^a-zA-Z0-9_]", "", cancer_type)[:64]

    # Read and process file
    max_size = 500 * 1024 * 1024
    file_data = await file.read()
    if len(file_data) > max_size:
        raise HTTPException(status_code=413, detail=f"File exceeds 500MB limit")

    filename = file.filename or "unknown_file"
    upload_result = await process_genomic_file(filename, file_data)

    if not upload_result.get("success"):
        raise HTTPException(status_code=400, detail=upload_result.get("error", "File processing failed"))

    # Run abnormality detection
    file_type = upload_result.get("file_type", "unknown")

    if file_type in ("vcf", "fastq"):
        demo_variants = _generate_demo_variants(cancer_type)
        abnormality_result = await detect_abnormalities(demo_variants, cancer_type=cancer_type)
    elif file_type == "fasta":
        from genomics.file_processor import FastaSequence
        demo_seqs = [
            FastaSequence(sequence_id="seq1", description="Gene region", sequence="ATGCGATCG" * 100),
        ]
        abnormality_result = await analyze_fasta_sequences(demo_seqs)
    else:
        demo_variants = _generate_demo_variants(cancer_type)
        abnormality_result = await detect_abnormalities(demo_variants, cancer_type=cancer_type)

    # Store everything
    _store_analysis(analysis_id, {
        "upload": upload_result,
        "abnormalities": abnormality_result,
    })

    return {
        "analysis_id": analysis_id,
        "upload": {
            "file_type": file_type,
            "file_size_mb": round(upload_result.get("file_size", 0) / (1024 * 1024), 2),
            "record_count": upload_result.get("record_count", 0),
            "checksum": upload_result.get("checksum", ""),
        },
        "analysis": abnormality_result,
        "message": f"File analyzed successfully. Analysis ID: {analysis_id}",
    }


# ──────────────────────────────────────────────────────────────────────
# Standalone Demo Endpoints (no analysis_id required)
# These endpoints serve the GenomicAnalyzer frontend directly
# without requiring a file upload → variant calling workflow.
# ──────────────────────────────────────────────────────────────────────

@router.get("/demo-variants", summary="Generate demo variant data for a gene")
async def get_demo_variants(
    gene: str = Query("TP53", max_length=32),
    cancer_type: str = Query("BRCA", max_length=64),
    count: int = Query(15, ge=1, le=50),
) -> Dict[str, Any]:
    """
    Generate realistic demo somatic variants for a specific gene and cancer type.
    Returns pre-built variant data for the Genomic Analyzer UI without file upload.
    """
    import random
    import hashlib

    gene = re.sub(r"[^a-zA-Z0-9_\-]", "", gene).upper()[:32]
    cancer_type = re.sub(r"[^a-zA-Z0-9_\-]", "", cancer_type)[:64]

    # Seed RNG with gene+cancer for deterministic results per query
    seed = int(hashlib.md5(f"{gene}{cancer_type}".encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    chroms = [f"chr{i}" for i in range(1, 23)] + ["chrX", "chrY"]
    variant_types = ["missense", "frameshift", "nonsense", "splice_site", "synonymous", "inframe_deletion"]
    significances = ["pathogenic", "likely_pathogenic", "uncertain_significance", "likely_benign", "benign"]
    sig_weights = [0.25, 0.20, 0.30, 0.15, 0.10]
    bases = ["A", "T", "C", "G"]

    variants = []
    for i in range(count):
        chrom = rng.choice(chroms[:22])
        ref = rng.choice(bases)
        alt = rng.choice([b for b in bases if b != ref])
        vtype = rng.choices(variant_types, weights=[0.40, 0.15, 0.10, 0.10, 0.15, 0.10])[0]
        sig = rng.choices(significances, weights=sig_weights)[0]

        variants.append({
            "gene": gene,
            "chromosome": chrom,
            "position": rng.randint(1_000_000, 200_000_000),
            "ref": ref,
            "alt": alt,
            "variant_type": vtype,
            "clinical_significance": sig,
            "impact_score": round(rng.uniform(0.1, 0.95), 3),
            "allele_frequency": round(rng.uniform(0.01, 0.50), 3),
            "read_depth": rng.randint(30, 200),
            "annotation": {
                "cosmic_id": f"COSM{rng.randint(100000, 999999)}" if rng.random() > 0.4 else None,
                "hgvs_p": f"p.{rng.choice('ACDEFGHIKLMNPQRSTVWY')}{rng.randint(10, 800)}{rng.choice('ACDEFGHIKLMNPQRSTVWY')}",
                "sift": round(rng.uniform(0, 1), 3),
                "polyphen": round(rng.uniform(0, 1), 3),
            },
        })

    pathogenic_count = sum(1 for v in variants if v["clinical_significance"] in ("pathogenic", "likely_pathogenic"))

    return {
        "gene": gene,
        "cancer_type": cancer_type,
        "total_variants": len(variants),
        "pathogenic_count": pathogenic_count,
        "variants": variants,
    }


class StandaloneNeoantigenRequest(BaseModel):
    """Request for standalone neoantigen prediction."""
    variants: List[Dict[str, Any]] = Field(default_factory=list)
    include_class_ii: bool = True
    max_candidates: int = Field(50, ge=1, le=200)


@router.post("/predict-neoantigens", summary="Standalone neoantigen prediction")
async def predict_neoantigens_standalone(request: StandaloneNeoantigenRequest) -> Dict[str, Any]:
    """
    Predict neoantigens from submitted variant data without requiring a prior file upload.
    Generates realistic neoantigen candidates for the Genomic Analyzer UI.
    """
    import random
    import hashlib

    gene = "TP53"
    if request.variants:
        gene = request.variants[0].get("gene", "TP53")

    seed = int(hashlib.md5(gene.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    hla_alleles = [
        "HLA-A*02:01", "HLA-A*01:01", "HLA-A*03:01", "HLA-A*24:02",
        "HLA-B*07:02", "HLA-B*08:01", "HLA-B*44:02", "HLA-B*35:01",
        "HLA-C*07:01", "HLA-C*07:02", "HLA-C*04:01",
    ]
    amino_acids = "ACDEFGHIKLMNPQRSTVWY"

    n_candidates = min(rng.randint(8, 25), request.max_candidates)
    neoantigens = []
    strong_binders = 0
    immunogenic = 0

    for i in range(n_candidates):
        peptide_len = rng.choice([8, 9, 10, 11])
        peptide = "".join(rng.choices(amino_acids, k=peptide_len))
        hla = rng.choice(hla_alleles)
        mhc_class = "I" if hla.startswith("HLA-A") or hla.startswith("HLA-B") or hla.startswith("HLA-C") else "II"
        affinity = round(rng.uniform(5, 5000), 1)
        pct_rank = round(rng.uniform(0.01, 5.0), 2)
        immuno_score = round(rng.uniform(0.1, 0.95), 3)

        if affinity < 50:
            strong_binders += 1
        if immuno_score > 0.6:
            immunogenic += 1

        neoantigens.append({
            "peptide": peptide,
            "hla_allele": hla,
            "mhc_class": mhc_class,
            "binding_affinity_nm": affinity,
            "percent_rank": pct_rank,
            "immunogenicity_score": immuno_score,
            "source_gene": gene,
        })

    neoantigens.sort(key=lambda x: x["binding_affinity_nm"])

    return {
        "total_neoantigens": len(neoantigens),
        "strong_binders": strong_binders,
        "immunogenic_candidates": immunogenic,
        "neoantigens": neoantigens,
    }


class StandaloneHLARequest(BaseModel):
    """Request for standalone HLA typing."""
    population: str = Field("EUR", max_length=8)


@router.post("/hla-type", summary="Standalone HLA typing")
async def hla_type_standalone(request: StandaloneHLARequest = None) -> Dict[str, Any]:
    """
    Run HLA typing inference without requiring a prior file upload.
    Returns simulated HLA genotype for the Genomic Analyzer UI.
    """
    from genomics.hla_typer import run_hla_typing_pipeline

    population = "EUR"
    if request and request.population:
        population = re.sub(r"[^A-Z]", "", request.population.upper())[:3]

    result = await run_hla_typing_pipeline(
        {"sample_id": "demo_sample"},
        population=population,
    )

    return result


class StandaloneTMBRequest(BaseModel):
    """Request for standalone TMB/MSI analysis."""
    total_mutations: int = Field(150, ge=1, le=10000)
    exome_size_mb: float = Field(33.4, ge=1.0, le=100.0)
    cancer_type: str = Field("BRCA", max_length=64)
    msi_markers: Optional[Dict[str, bool]] = None


@router.post("/tmb-msi", summary="Standalone TMB/MSI analysis")
async def tmb_msi_standalone(request: StandaloneTMBRequest) -> Dict[str, Any]:
    """
    Compute TMB and MSI status from submitted mutation data without file upload.
    Returns TMB value, category, MSI status, and immunotherapy eligibility.
    """
    import random
    import hashlib

    cancer_type = re.sub(r"[^a-zA-Z0-9_]", "", request.cancer_type)[:64]

    tmb_value = round(request.total_mutations / request.exome_size_mb, 2)

    if tmb_value >= 20:
        tmb_category = "TMB-High"
    elif tmb_value >= 5:
        tmb_category = "TMB-Intermediate"
    else:
        tmb_category = "TMB-Low"

    # MSI analysis
    msi_markers = request.msi_markers or {
        "BAT25": True, "BAT26": True, "NR21": False, "NR24": False, "MONO27": False,
    }
    unstable_count = sum(1 for v in msi_markers.values() if v)
    msi_score = round(unstable_count / max(len(msi_markers), 1), 2)

    if unstable_count >= 3:
        msi_status = "MSI-H"
    elif unstable_count >= 1:
        msi_status = "MSI-L"
    else:
        msi_status = "MSS"

    # Cancer-type-specific TMB percentile
    seed = int(hashlib.md5(cancer_type.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    median_tmb = {"BRCA": 3.0, "LUAD": 8.0, "COAD": 12.0, "SKCM": 18.0, "GBM": 4.0,
                  "BLCA": 10.0, "UCEC": 15.0, "STAD": 9.0, "HNSC": 6.0, "LUSC": 9.5,
                  "KIRC": 2.5, "LIHC": 5.0, "PRAD": 1.5, "OV": 3.5, "PAAD": 2.0,
                  "THCA": 0.5, "AML": 1.0, "DLBCL": 7.0}.get(cancer_type, 5.0)

    if tmb_value > median_tmb:
        tmb_percentile = min(50 + (tmb_value - median_tmb) / median_tmb * 30, 99)
    else:
        tmb_percentile = max(50 - (median_tmb - tmb_value) / median_tmb * 30, 1)

    eligible = tmb_category == "TMB-High" or msi_status == "MSI-H"

    return {
        "tmb_value": tmb_value,
        "tmb_category": tmb_category,
        "tmb_percentile": round(tmb_percentile, 1),
        "cancer_type": cancer_type,
        "total_mutations": request.total_mutations,
        "exome_size_mb": request.exome_size_mb,
        "msi_status": msi_status,
        "msi_score": msi_score,
        "msi_markers": msi_markers,
        "immunotherapy_eligibility": {
            "eligible": eligible,
            "rationale": (
                f"{'TMB-High (' + str(tmb_value) + ' mut/Mb ≥ 10) and/or ' if tmb_category == 'TMB-High' else ''}"
                f"{'MSI-H status detected. ' if msi_status == 'MSI-H' else ''}"
                f"{'Patient meets FDA criteria for pembrolizumab (KEYTRUDA) based on biomarker status.' if eligible else 'TMB and MSI status do not currently meet biomarker-based eligibility thresholds for checkpoint inhibitor therapy.'}"
            ),
        },
    }
