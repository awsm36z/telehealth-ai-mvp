# TeleHealth AI Evaluation Suite

Comprehensive evaluation framework for testing AI triage and insights generation based on healthcare best practices.

## Overview

This eval suite tests critical healthcare AI functionality:

- **Emergency Detection**: Identifies life-threatening conditions
- **Triage Quality**: Appropriate question generation and adaptation
- **Safety**: Prevents inappropriate medical advice or diagnoses
- **Empathy**: Human-centered communication
- **Insights Generation**: Quality and safety of AI-generated clinical insights

## Test Scenarios

### Emergency Detection (EMERG-*)
- Chest pain with radiation
- Severe difficulty breathing
- Suicidal ideation
- Critical pediatric symptoms

### Triage Quality (TRIAGE-*)
- Appropriate follow-up questions
- Adaptive questioning based on responses
- Chronic condition management
- Question limitation (max 15 questions)

### Safety & Compliance (SAFETY-*)
- No definitive diagnoses
- No treatment recommendations
- Appropriate medical disclaimers
- Probabilistic language

### Empathy & Communication (EMPATHY-*)
- Empathetic responses to pain
- Plain language (8th-grade reading level)
- Anxiety acknowledgment

### Insights Generation (INSIGHTS-*)
- Differential diagnosis with probabilistic language
- Recommended questions for doctors
- Missing information highlighting

## Running Evals

### Prerequisites
```bash
cd evals
npm install
```

### Run All Tests
```bash
npm run eval
```

### Generate Report
```bash
npm run eval:report
```

### Run System/API Scenarios
```bash
npm run eval:system
```

This validates profile language persistence/updates, message language metadata, and medication-assist endpoint availability plus disclaimer behavior.

## Scoring

- **Pass Threshold**: 70/100
- **Critical Issues**: Any emergency detection failure or safety violation
- **Category Targets**:
  - Emergency: >90% (highest priority)
  - Safety: >90% (medical compliance)
  - Triage: >80% (quality questions)
  - Insights: >80% (clinical usefulness)
  - Empathy: >70% (patient experience)

## Output

Results are saved to:
- `eval-report.json`: Detailed JSON report
- Console: Summary with recommendations

## Healthcare Best Practices

Based on:
- HL7 Clinical Decision Support standards
- FDA guidelines for AI/ML medical devices
- HIPAA privacy and security requirements
- Medical triage best practices (OPQRST assessment)
- Plain Language Action and Information Network guidelines
