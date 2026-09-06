document "Quantum Neural Processing & Distributed Visual Intelligence"
  theme "academic"
  author "Biagio Scaglia"
  aspectRatio "16:9"
  transition "fade"
  watermark "Yumia v0.1.26 • Confidential"

// Reusable KPI Macro Component
component BenchmarkCard title, description, metricVal, status
  card title="{{title}}" variant="{{status}}"
    metric "{{metricVal}}" label="Benchmarked Speedup" variant="{{status}}"
    text "{{description}}"

slide "Research Overview"
  hero "Quantum Neural Architecture" subtitle="Formal Specification of Hybrid Classical-Quantum Distributed Ingestion & Vector Processing Pipelines" tagline="Computer Science & Systems Lab" align="center" emphasis="primary"
  badge "v2.4 Production Specification" variant="primary"

slide "Agenda & Table of Contents"
  toc "Presentation Outline"

slide "System Topology & Neural Dispatch"
  heading "Vector-Compiled Distributed Ingestion Mesh"
  
  diagram type="flow" direction="LR" title="Multi-Tier Distributed Neural Processing Pipeline"
    [Edge Sensors] -> [Ingestion Broker] -[TLS 1.3]-> [Neural Dispatcher]
    [Neural Dispatcher] -[gRPC Streaming]-> [Quantum Tensor Cores] -> [(Vector Knowledge Base)]
    [Quantum Tensor Cores] -[Hot Cache]-> [(Redis Semantic Cache)]
    node qtc label="Quantum Tensor Cores" variant="accent"
    node vkb label="Vector Knowledge Base" shape="database" variant="primary"
    node cache label="Redis Semantic Cache" shape="database" variant="success"

slide "Empirical Performance Evaluation"
  heading "Measured Benchmarks Across Compute Clusters"
  
  grid columns=2 gap=20
    BenchmarkCard "Inference Latency", "End-to-end latency reduction under heavy concurrent load.", "1.42ms", "success"
    BenchmarkCard "Throughput Capacity", "Peak distributed operations sustained without buffer degradation.", "450k op/s", "accent"

slide "Comparative Analysis & Mathematical Model"
  heading "Formal Energy Convergence Formulation"
  
  compare left="Legacy Classical CPU / GPU Pipeline" right="Yumia Neural Tensor Pipeline"
    left
      badge "Legacy Infrastructure" variant="warning"
      text "Linear memory scaling with quadratic communication overhead during multi-node synchronization."
      metric "68ms" label="Avg Convergence Time" variant="warning"
    right
      badge "Distributed Tensor Core" variant="success"
      text "Logarithmic latency scaling leveraging quantum sparse tensor compression."
      metric "4.1ms" label="Avg Convergence Time" variant="success"

  math "\mathcal{L}(\theta) = \mathbb{E}_{x \sim \mathcal{D}} \left[ \| f_\theta(x) - y \|_2^2 \right] + \lambda \sum_{i=1}^N \Omega(W_i)"

slide "Cluster Analytics & Telemetry"
  heading "Resource Allocation & Workload Distribution"
  
  grid columns=2 gap=24
    chart type="bar" title="Inference Acceleration (x Baseline)" labels="ResNet-50, BERT-Large, LLaMA-7B, QuantumNet" data="3.2, 5.8, 8.4, 14.1"
    chart type="doughnut" title="Cluster Resource Utilization" labels="Tensor Cores, Ingestion Mesh, Vector DB, Reserve" data="50, 25, 15, 10"

slide "Implementation & Runtime Kernel"
  heading "Zero-Trust Mesh & Compiler Directives"

  columns 60:40
    column
      code lang="typescript" highlight="3-5"
        import { YumiaCompiler, createEngine } from '@yumiamd/core';

        // Initialize Native Design Compiler Engine
        const engine = createEngine({ target: 'multi-target' });
        const result = await engine.compile('presentation.yumia');
    column
      callout severity="success" title="Production Verified" icon="lucide:shield-check"
        All cluster nodes reporting optimal throughput with zero memory leaks.
      badge "Zero-Trust mTLS" variant="success"
      badge "WCAG AAA Verified" variant="primary"
