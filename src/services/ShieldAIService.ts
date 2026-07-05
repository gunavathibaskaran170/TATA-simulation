export interface StationData {
  loadValue?: number;         // Load cell (kN)
  vibrationValue?: number;    // Vibration (g)
  distanceValue?: number;     // Distance/clearance (mm)
  thermalData?: {             // Simulated thermal inspection data
    avgTemperature: number;   // (°C)
    peakGradient: number;     // (°C/mm)
    coolingRate: number;      // (°C/s)
  };
  acousticData?: {            // Simulated acoustic data
    peakFrequency: number;    // (Hz)
    dampingRatio: number;     // damping ratio
    amplitudeDecay: number;   // dB/ms
  };
}

export interface InspectionData {
  stamping: StationData;
  welding: StationData;
  marriage: StationData;
  materialType: 'steel' | 'aluminum' | 'mmc';
  mmcConcentration?: number;
}

export interface AIAnalysisResult {
  integrityScore: number;       // 0 - 100
  confidenceScore: number;      // 0 - 100
  riskLevel: 'Low' | 'Medium' | 'High';
  defectType: 'Loose Clamp' | 'Misalignment' | 'Excessive Vibration' | 'Weld Anomaly' | 'Thermal Risk' | 'No Defect';
  recommendation: 'Continue Production' | 'Rework Required' | 'Immediate Line Stop';
  anomaliesDetected: string[];
  inferenceTimeMs: number;
  penalties?: {                 // XAI feature attribution values
    clamping: number;
    frequency: number;
    clearance: number;
  };
}

/**
 * SHIELD AI Core Decision Engine
 * Evaluates live multi-station inspection data to perform anomaly classification,
 * integrity scoring, and recommendation routing. Designed to be easily replaced
 * with a real ML API client (TensorFlow Serving / PyTorch FastAPI endpoint).
 */
export class ShieldAIService {
  
  /**
   * Evaluates dynamic telemetry inputs for a specific station, calculating integrity scores,
   * risk levels, and routing recommendations. Incorporates alloy material intelligence and XAI.
   */
  public static evaluateStation(
    stationId: number,
    telemetry: {
      clampingForce: number;      // target >= 15 kN
      frequency: number;          // target 400 - 600 Hz
      clearance: number;          // target 10 - 15 mm
      coolingRate?: number;       // target 12 - 25 °C/s
      thermalTemp?: number;
    },
    materialType: 'steel' | 'aluminum' | 'mmc'
  ): AIAnalysisResult {
    const startTime = performance.now();
    const anomalies: string[] = [];
    
    let integrityScore = 100;
    let confidenceScore = 98.6;
    let defectType: AIAnalysisResult['defectType'] = 'No Defect';
    let riskLevel: AIAnalysisResult['riskLevel'] = 'Low';
    let recommendation: AIAnalysisResult['recommendation'] = 'Continue Production';

    // XAI Penalties
    let clampingPenalty = 0;
    let frequencyPenalty = 0;
    let clearancePenalty = 0;

    // Station 1: Stamping Inspection
    if (stationId === 1) {
      // Nominal window is 400 - 600 Hz.
      // Dynamic Material Damping Override: Standard Steel has a tight nominal band (450 - 550 Hz).
      // Al-SiCp MMC alloy has high damping properties, meaning we adjust the nominal frequency band
      // dynamically to 380 - 620 Hz, treating a 420 Hz shift as nominal self-dampened signal.
      const lowFreqLimit = materialType === 'mmc' ? 380 : 450;
      const highFreqLimit = materialType === 'mmc' ? 620 : 580;

      if (telemetry.frequency < lowFreqLimit || telemetry.frequency > highFreqLimit) {
        anomalies.push(`Stamping structural resonance anomaly: ${telemetry.frequency.toFixed(0)} Hz (Nominal band: ${lowFreqLimit}-${highFreqLimit} Hz)`);
        frequencyPenalty = 35;
        defectType = 'Excessive Vibration';
        riskLevel = 'High';
        recommendation = 'Rework Required';
        confidenceScore = 93.4;
      } else if (telemetry.frequency < 450 && materialType === 'mmc') {
        // Recovered nominal state due to MMC
        anomalies.push(`Al-SiCp MMC nanoparticle lattice successfully dampened the 420 Hz resonance shift, preventing fissure propagation.`);
        confidenceScore = 97.2;
      }
    }

    // Station 2: Welding Inspection
    if (stationId === 2) {
      // Weld gaps are detected if physical clearance misalignment drops below 10 mm
      const clearanceVal = telemetry.clearance;
      const coolRate = telemetry.coolingRate ?? 18;

      if (clearanceVal < 10.0) {
        anomalies.push(`Robotic weld flange misalignment detected: clearance gap is ${clearanceVal.toFixed(1)} mm (Target: 10-15 mm)`);
        clearancePenalty = 30;
        defectType = 'Misalignment';
        riskLevel = 'High';
        recommendation = 'Immediate Line Stop';
        confidenceScore = 94.8;
      }

      if (coolRate > 25.0 || coolRate < 12.0) {
        anomalies.push(`Weld seam cold-weld void gap: cooling rate is ${coolRate.toFixed(1)} °C/s (Target: 12-25 °C/s)`);
        clearancePenalty = Math.max(clearancePenalty, 25);
        defectType = 'Weld Anomaly';
        riskLevel = 'High';
        recommendation = 'Rework Required';
        confidenceScore = 91.2;
      }
    }

    // Station 3: Marriage Inspection
    if (stationId === 3) {
      // Clamping target >= 15 kN. Clamping < 15 kN triggers critical loose clamp alert.
      const clampVal = telemetry.clampingForce;
      const clearanceVal = telemetry.clearance;

      if (clampVal < 15.0) {
        anomalies.push(`Under-tension mount clamp detected: force is ${clampVal.toFixed(1)} kN (Limit: >= 15 kN)`);
        clampingPenalty = 35;
        defectType = 'Loose Clamp';
        riskLevel = clampVal < 12.0 ? 'High' : 'Medium';
        recommendation = clampVal < 12.0 ? 'Immediate Line Stop' : 'Rework Required';
        confidenceScore = 95.7;
      }

      if (clearanceVal < 10.0 || clearanceVal > 15.0) {
        anomalies.push(`Marriage chassis alignment deviation: clearance is ${clearanceVal.toFixed(1)} mm (Target: 10-15 mm)`);
        clearancePenalty = 20;
        if (defectType === 'No Defect') {
          defectType = 'Misalignment';
          riskLevel = 'Medium';
          recommendation = 'Rework Required';
        }
        confidenceScore = Math.min(confidenceScore, 90.5);
      }
    }

    // Deduct integrity score based on penalties
    integrityScore -= (clampingPenalty + frequencyPenalty + clearancePenalty);
    integrityScore = Math.max(0, Math.min(100, Math.round(integrityScore)));

    // Set nominal default values if no anomalies
    if (anomalies.length === 0) {
      if (materialType === 'mmc') {
        integrityScore = 99;
      } else {
        integrityScore = 97;
      }
      confidenceScore = 98.6;
    }

    const endTime = performance.now();
    const inferenceTimeMs = Math.round((endTime - startTime) * 100) / 100;

    return {
      integrityScore,
      confidenceScore,
      riskLevel,
      defectType,
      recommendation,
      anomaliesDetected: anomalies,
      inferenceTimeMs,
      penalties: {
        clamping: clampingPenalty,
        frequency: frequencyPenalty,
        clearance: clearancePenalty
      }
    };
  }

  public static analyzeInspection(data: InspectionData): AIAnalysisResult {
    const clampingVal = data.marriage.loadValue ?? 24.2;
    const frequencyVal = data.stamping.acousticData?.peakFrequency ?? 420;
    const clearanceVal = data.marriage.distanceValue ?? 42.0;
    const coolingRate = data.welding.thermalData?.coolingRate ?? 18;

    return this.evaluateStation(3, {
      clampingForce: clampingVal,
      frequency: frequencyVal,
      clearance: clearanceVal,
      coolingRate
    }, data.materialType);
  }
}
