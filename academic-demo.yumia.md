document "Quantum Neural Architecture & Distributed Systems"
theme "academic"
author "Biagio Scaglia"
aspectRatio "16:9"
transition "fade"

component ResearchPill title, description, metricVal, status
card title="{{title}}" variant="{{status}}"
metric "{{metricVal}}" label="Measured Benchmark" variant="{{status}}"
text "{{description}}"

slide "Research Overview"
hero "Quantum Neural Architecture" subtitle="Formal Specification of Hybrid Classical-Quantum Distributed Ingestion Pipelines" tagline="Computer Science & Systems Lab"
badge "v2.0 Architecture" variant="primary"

slide "System Topology & Architecture"
heading "Vector-Compiled Neural Processing Pipeline"

diagram type="flow" direction="LR" title="Distributed Ingestion, Inference & Vector Storage"
[Edge Sensors] -> [Ingestion Broker] -[TLS 1.3]-> [Neural Dispatcher]
[Neural Dispatcher] -[gRPC Streaming]-> [Quantum Tensor Cores] -> [(Vector Knowledge Base)]
[Quantum Tensor Cores] -[Hot Cache]-> [(Redis Semantic Cache)]
node qtc label="Quantum Tensor Cores" variant="accent"
node vkb label="Vector Knowledge Base" shape="database" variant="primary"
node cache label="Redis Semantic Cache" shape="database" variant="success"

slide "Experimental Results"
heading "Empirical Evaluation Across Compute Clusters"

grid columns=2 gap=20
ResearchPill "Inference Latency", "End-to-end latency reduction under heavy concurrent load.", "1.42ms", "success"
ResearchPill "Throughput Capacity", "Peak distributed operations sustained without buffer degradation.", "450k op/s", "accent"

slide "Comparative Analysis & Mathematical Model"
heading "Formal Energy Convergence Formulation"

compare left="Classical CPU / GPU Pipeline" right="Yumia Neural Tensor Pipeline"
left
badge "Legacy Infrastructure" variant="warning"
text "Linear memory scaling with quadratic communication overhead during multi-node synchronization."
metric "68ms" label="Avg Convergence Time" variant="warning"
right
badge "Distributed Tensor Core" variant="success"
text "Logarithmic latency scaling leveraging quantum sparse tensor compression."
metric "4.1ms" label="Avg Convergence Time" variant="success"

math "\mathcal{L}(\theta) = \mathbb{E}_{x \sim \mathcal{D}} \left[ \| f_\theta(x) - y \|_2^2 \right] + \lambda \sum_{i=1}^N \Omega(W_i)"

slide "Empirical Benchmarking"
heading "Accuracy & Resource Allocation"

grid columns=2 gap=24
chart type="bar" title="Inference Speedup Factor (x Baseline)" labels="ResNet-50, BERT-Large, LLaMA-7B, QuantumNet" data="3.2, 5.8, 8.4, 14.1"

    chart type="doughnut" title="Cluster Resource Utilization" labels="Tensor Cores, Ingestion Mesh, Vector DB, Reserve" data="50, 25, 15, 10"
