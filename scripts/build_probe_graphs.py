#!/usr/bin/env python3
"""Build browser-sized probe graphs from sparse remote PyTorch archives.

The raw Hugging Face files store a dense feature-to-feature matrix and are
several gigabytes each. This script expects sparse archive shells containing
the small metadata tensors plus separately downloaded rows from storage 6.
It never materializes the dense matrix.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import zipfile
from pathlib import Path

import torch


REPO = "https://huggingface.co/datasets/Shiqi-Liu/circuit-tracer-graphs"
RAW_ROOT = f"{REPO}/resolve/main/graphs/probe"

GRAPH_SPECS = [
    {
        "id": "france-capital",
        "filename": "france_capital_however_full_graph.pt",
        "label": "France capital",
        "group": "Factual recall",
        "summary": "A one-hop factual completion: France → Paris.",
    },
    {
        "id": "planet-implicit",
        "filename": "planet4_color_however_full_graph.pt",
        "label": "Planet · implicit",
        "group": "Two-hop recall",
        "summary": "The model must infer planet four and then its colour; it predicts Mars instead.",
    },
    {
        "id": "planet-explicit",
        "filename": "planet4_twohop_however_full_graph.pt",
        "label": "Planet · explicit",
        "group": "Two-hop recall",
        "summary": "Naming Mars in the prompt makes the second hop to red much easier.",
    },
    {
        "id": "calc-first-digit",
        "filename": "calc_arith_space_full_graph.pt",
        "label": "Calculator · first digit",
        "group": "Iterative arithmetic",
        "summary": "The first generated digit is 2, beginning the intermediate result 21.",
    },
    {
        "id": "calc-second-digit",
        "filename": "calc_arith_space2_full_graph.pt",
        "label": "Calculator · second digit",
        "group": "Iterative arithmetic",
        "summary": "After 2 is present, the model completes the intermediate result with 1.",
    },
]

TOP_POSITIVE = 10
TOP_NEGATIVE = 3
FEATURES_PER_GRAPH = 100
TOKEN_EDGES_PER_FEATURE = 2
OTHER_LOGIT_EDGES = 4


def archive_path(source_dir: Path, filename: str) -> Path:
    return source_dir / f"{filename}.sparse"


def storage_payload_offset(path: Path, storage_name: str = "data/6") -> int:
    with zipfile.ZipFile(path) as archive:
        entry = next(item for item in archive.infolist() if item.filename.endswith(storage_name))
    with path.open("rb") as handle:
        handle.seek(entry.header_offset)
        header = handle.read(30)
    signature, _, _, _, _, _, _, _, _, name_len, extra_len = struct.unpack(
        "<IHHHHHIIIHH", header
    )
    if signature != 0x04034B50:
        raise ValueError(f"Missing local ZIP header for {path.name}:{storage_name}")
    return entry.header_offset + 30 + name_len + extra_len


def load_graph(path: Path) -> dict:
    return torch.load(path, weights_only=False, map_location="cpu", mmap=True)


def direct_feature_indices(graph: dict) -> list[int]:
    features = graph["nodes"]["features"]
    values = graph["edges"]["logit_to_feature"][0].float()
    n_tokens = int(graph["metadata"]["n_tokens"])
    valid = (features[:, 1] >= 1) & (features[:, 1] <= n_tokens)

    positive = torch.where(valid & (values > 0))[0]
    negative = torch.where(valid & (values < 0))[0]
    positive = positive[
        torch.topk(values[positive], min(TOP_POSITIVE, positive.numel())).indices
    ]
    negative = negative[
        torch.topk(values[negative].abs(), min(TOP_NEGATIVE, negative.numel())).indices
    ]
    return [int(index) for index in torch.cat([positive, negative])]


def plan(source_dir: Path) -> dict:
    rows = []
    graphs = []
    for spec in GRAPH_SPECS:
        path = archive_path(source_dir, spec["filename"])
        graph = load_graph(path)
        n_features = int(graph["metadata"]["n_features"])
        payload = storage_payload_offset(path)
        indices = direct_feature_indices(graph)
        stem = spec["filename"].removesuffix(".pt")
        graphs.append({"id": spec["id"], "filename": spec["filename"], "rows": indices})
        for index in indices:
            start = payload + index * n_features * 4
            rows.append(
                {
                    "graphId": spec["id"],
                    "filename": spec["filename"],
                    "featureIndex": index,
                    "start": start,
                    "end": start + n_features * 4 - 1,
                    "url": f"{RAW_ROOT}/{spec['filename']}",
                    "output": f"{stem}.row-{index}.bin",
                }
            )
    return {"graphs": graphs, "rows": rows}


def clean_token(token: str) -> str:
    if token == "▁":
        return "space"
    return token.replace("▁", " ")


def activation_examples(top_activations: dict[str, list[dict]], layer: int, feature: int) -> list[dict]:
    return top_activations.get(f"{layer}:{feature}", [])


def build_aime(path: Path, top_activations: dict[str, list[dict]]) -> dict:
    exported = json.loads(path.read_text(encoding="utf-8"))
    raw_nodes = exported["nodes"]
    raw_edges = exported["links"]
    prompt_tokens = exported["metadata"]["prompt_tokens"]
    target_raw = next(
        (node for node in raw_nodes if node.get("feature_type") == "logit" and node.get("target_logit")),
        next(node for node in raw_nodes if node.get("feature_type") == "logit"),
    )
    target_id = target_raw["node_id"]
    direct_to_target = {
        edge["source"]: float(edge["weight"])
        for edge in raw_edges
        if edge["target"] == target_id
    }

    nodes = []
    for raw in raw_nodes:
        feature_type = raw.get("feature_type")
        if feature_type == "embedding":
            nodes.append(
                {
                    "id": raw["node_id"],
                    "kind": "token",
                    "label": clean_token(raw.get("token", "")),
                    "position": int(raw["pos"]),
                }
            )
        elif feature_type == "feature":
            layer = int(raw["layer"])
            coordinate = int(raw.get("feature_idx", raw.get("feature", -1)))
            node_id = raw["node_id"]
            nodes.append(
                {
                    "id": node_id,
                    "kind": "feature",
                    "label": f"L{layer}/F{coordinate}",
                    "layer": layer,
                    "position": int(raw["pos"]),
                    "feature": coordinate,
                    "activation": rounded(float(raw.get("activation", 0))),
                    "directEffect": rounded(direct_to_target.get(node_id, 0.0)),
                    "role": "direct" if node_id in direct_to_target else "upstream",
                    "topActivations": activation_examples(top_activations, layer, coordinate),
                }
            )
        elif feature_type == "logit":
            nodes.append(
                {
                    "id": raw["node_id"],
                    "kind": "logit",
                    "label": clean_token(raw.get("token", "")),
                    "position": int(raw["pos"]),
                    "probability": rounded(float(raw.get("token_prob", 0))),
                    "rank": len([node for node in nodes if node["kind"] == "logit"]) + 1,
                }
            )

    node_kind = {node["id"]: node["kind"] for node in nodes}
    edges = []
    for index, raw in enumerate(raw_edges):
        source_kind = node_kind.get(raw["source"])
        target_kind = node_kind.get(raw["target"])
        if source_kind == "token" and target_kind == "logit":
            kind = "token-logit"
        elif source_kind == "token":
            kind = "token"
        elif target_kind == "logit":
            kind = "logit"
        else:
            kind = "feature"
        edges.append(
            {
                "id": f"aime-e{index}",
                "source": raw["source"],
                "target": raw["target"],
                "weight": rounded(float(raw["weight"])),
                "kind": kind,
            }
        )

    context = "".join(clean_token(token) for token in prompt_tokens[-20:]).strip()
    return {
        "id": "aime-24-12",
        "label": "AIME 2024 · Problem 12",
        "group": "Article discovery graph",
        "summary": "The article's original discovery graph, with L22/F31850 selected at the final period.",
        "prompt": f"…{context}",
        "source": f"{REPO}/blob/main/graphs/24_12_however_full_graph.pt",
        "filename": "24_12_however_full_graph.pt",
        "target": {
            "token": clean_token(target_raw.get("token", "")),
            "vocabId": int(target_raw.get("vocab_idx", -1)),
            "probability": rounded(float(target_raw.get("token_prob", 0))),
        },
        "nTokens": len(prompt_tokens),
        "nLayers": 34,
        "fullFeatureCount": 225549,
        "featureBudget": len(
            [node for node in nodes if node["kind"] == "feature"]
        ),
        "fullMatrixEntries": 225549 * 225549,
        "defaultNodeId": "f22.271.31850",
        "nodes": nodes,
        "edges": edges,
    }


def rounded(value: float) -> float:
    if not math.isfinite(value):
        return 0.0
    return round(value, 6)


def feature_id(features: torch.Tensor, index: int) -> str:
    layer, position, coordinate = (int(value) for value in features[index])
    return f"f{layer}.{position - 1}.{coordinate}"


def build_one(
    spec: dict,
    source_dir: Path,
    row_dir: Path,
    tokenizer,
    top_activations: dict[str, list[dict]],
) -> dict:
    path = archive_path(source_dir, spec["filename"])
    graph = load_graph(path)
    metadata = graph["metadata"]
    features = graph["nodes"]["features"]
    activations = graph["nodes"]["activations"].float()
    n_features = int(metadata["n_features"])
    n_tokens = int(metadata["n_tokens"])
    valid = (features[:, 1] >= 1) & (features[:, 1] <= n_tokens)
    direct_indices = direct_feature_indices(graph)
    direct_set = set(direct_indices)
    rows_by_target: dict[int, torch.Tensor] = {}
    source_scores = torch.zeros(n_features, dtype=torch.float32)

    stem = spec["filename"].removesuffix(".pt")
    for target in direct_indices:
        row_path = row_dir / f"{stem}.row-{target}.bin"
        values = torch.frombuffer(bytearray(row_path.read_bytes()), dtype=torch.float32)
        if values.numel() != n_features:
            raise ValueError(f"Unexpected row length in {row_path}")
        rows_by_target[target] = values
        source_scores = torch.maximum(source_scores, values.abs())

    eligible = valid & (source_scores > 0)
    for index in direct_indices:
        eligible[index] = False
    candidates = torch.where(eligible)[0]
    upstream_budget = FEATURES_PER_GRAPH - len(direct_indices)
    if candidates.numel() < upstream_budget:
        raise ValueError(
            f"{spec['id']} has only {candidates.numel()} upstream candidates; "
            f"need {upstream_budget} for a {FEATURES_PER_GRAPH}-feature view"
        )
    upstream = candidates[
        torch.topk(source_scores[candidates], upstream_budget).indices
    ].tolist()
    selected = set(direct_indices) | {int(index) for index in upstream}
    selected_indices = sorted(selected)
    selected_tensor = torch.tensor(selected_indices, dtype=torch.long)
    f2f_edges: list[tuple[int, int, float]] = []
    for target, values in rows_by_target.items():
        retained = selected_tensor[values[selected_tensor] != 0]
        for source in retained.tolist():
            if source != target:
                f2f_edges.append((int(source), target, float(values[source])))

    if len(selected_indices) != FEATURES_PER_GRAPH:
        raise AssertionError(
            f"{spec['id']} exported {len(selected_indices)} features, expected {FEATURES_PER_GRAPH}"
        )
    nodes = []
    token_ids = graph["nodes"]["tokens"].tolist()
    token_labels = [clean_token(token) for token in metadata["input_tokens"][1 : n_tokens + 1]]
    for position, (token_id, label) in enumerate(zip(token_ids, token_labels)):
        nodes.append(
            {
                "id": f"t{position}",
                "kind": "token",
                "label": label,
                "position": position,
                "tokenId": int(token_id),
            }
        )

    target_effects = graph["edges"]["logit_to_feature"][0].float()
    for index in selected_indices:
        layer, raw_position, coordinate = (int(value) for value in features[index])
        nodes.append(
            {
                "id": feature_id(features, index),
                "kind": "feature",
                "label": f"L{layer}/F{coordinate}",
                "layer": layer,
                "position": raw_position - 1,
                "feature": coordinate,
                "activation": rounded(float(activations[index])),
                "directEffect": rounded(float(target_effects[index])),
                "role": "direct" if index in direct_set else "upstream",
                "sourceIndex": index,
                "topActivations": activation_examples(top_activations, layer, coordinate),
            }
        )

    logit_ids = graph["nodes"]["logits"].tolist()
    logit_probs = graph["nodes"]["logit_probs"].float().tolist()
    max_logits = min(5, len(logit_ids))
    for row, (vocab_id, probability) in enumerate(zip(logit_ids[:max_logits], logit_probs[:max_logits])):
        decoded = tokenizer.decode([int(vocab_id)])
        nodes.append(
            {
                "id": f"l{row}.{int(vocab_id)}",
                "kind": "logit",
                "label": decoded if decoded.strip() else repr(decoded),
                "position": n_tokens - 1,
                "vocabId": int(vocab_id),
                "probability": rounded(float(probability)),
                "rank": row + 1,
            }
        )

    edges = []
    edge_keys: set[tuple[str, str]] = set()

    def add_edge(source: str, target: str, weight: float, kind: str) -> None:
        key = (source, target)
        if key in edge_keys:
            return
        edge_keys.add(key)
        edges.append(
            {
                "id": f"e{len(edges)}",
                "source": source,
                "target": target,
                "weight": rounded(weight),
                "kind": kind,
            }
        )

    for source, target, weight in f2f_edges:
        add_edge(feature_id(features, source), feature_id(features, target), weight, "feature")

    feature_to_token = graph["edges"]["feature_to_token"].float()
    for target in selected_indices:
        row = feature_to_token[target]
        nonzero = torch.where(row != 0)[0]
        if nonzero.numel() == 0:
            continue
        count = min(TOKEN_EDGES_PER_FEATURE, nonzero.numel())
        positions = nonzero[torch.topk(row[nonzero].abs(), count).indices]
        for position in positions.tolist():
            add_edge(f"t{position}", feature_id(features, target), float(row[position]), "token")

    logit_to_feature = graph["edges"]["logit_to_feature"].float()
    selected_tensor = torch.tensor(selected_indices, dtype=torch.long)
    for row in range(max_logits):
        values = logit_to_feature[row, selected_tensor]
        if row == 0:
            indices_for_logit = direct_indices
        else:
            count = min(OTHER_LOGIT_EDGES, values.numel())
            local = torch.topk(values.abs(), count).indices.tolist()
            indices_for_logit = [selected_indices[position] for position in local]
        for source in indices_for_logit:
            weight = float(logit_to_feature[row, source])
            if weight != 0:
                add_edge(feature_id(features, source), f"l{row}.{int(logit_ids[row])}", weight, "logit")

    logit_to_token = graph["edges"]["logit_to_token"].float()
    for row in range(max_logits):
        values = logit_to_token[row]
        count = min(2, values.numel())
        for position in torch.topk(values.abs(), count).indices.tolist():
            weight = float(values[position])
            if weight != 0:
                add_edge(f"t{position}", f"l{row}.{int(logit_ids[row])}", weight, "token-logit")

    default_index = direct_indices[0]
    return {
        "id": spec["id"],
        "label": spec["label"],
        "group": spec["group"],
        "summary": spec["summary"],
        "prompt": metadata["input_string"],
        "source": f"{REPO}/blob/main/graphs/probe/{spec['filename']}",
        "filename": spec["filename"],
        "target": {
            "token": tokenizer.decode([int(logit_ids[0])]),
            "vocabId": int(logit_ids[0]),
            "probability": rounded(float(logit_probs[0])),
        },
        "nTokens": n_tokens,
        "nLayers": int(metadata["n_layers"]),
        "fullFeatureCount": n_features,
        "featureBudget": FEATURES_PER_GRAPH,
        "fullMatrixEntries": n_features * n_features,
        "defaultNodeId": feature_id(features, default_index),
        "nodes": nodes,
        "edges": edges,
    }


def build(
    source_dir: Path,
    row_dir: Path,
    tokenizer_path: str,
    aime_json: Path,
    top_activations_path: Path | None,
    output: Path,
) -> None:
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path, local_files_only=True)
    top_activations: dict[str, list[dict]] = {}
    if top_activations_path is not None:
        activation_payload = json.loads(top_activations_path.read_text(encoding="utf-8"))
        top_activations = activation_payload.get("features", activation_payload)
    result = {
        "source": f"{REPO}/tree/main/graphs/probe",
        "method": (
            "One-hop signed direct-effect projections with exactly 100 feature neurons "
            "per graph, extracted from the original dense .pt files."
        ),
        "graphs": [build_aime(aime_json, top_activations)]
        + [
            build_one(spec, source_dir, row_dir, tokenizer, top_activations)
            for spec in GRAPH_SPECS
        ],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def write_feature_manifest(graphs_path: Path, output: Path) -> None:
    payload = json.loads(graphs_path.read_text(encoding="utf-8"))
    coordinates = sorted(
        {
            (int(node["layer"]), int(node["feature"]))
            for graph in payload["graphs"]
            for node in graph["nodes"]
            if node.get("kind") == "feature"
        }
    )
    result = {
        "count": len(coordinates),
        "features": [f"{layer}:{feature}" for layer, feature in coordinates],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(result, separators=(",", ":")),
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    plan_parser = subparsers.add_parser("plan")
    plan_parser.add_argument("--source-dir", type=Path, required=True)
    manifest_parser = subparsers.add_parser("manifest")
    manifest_parser.add_argument("--graphs", type=Path, required=True)
    manifest_parser.add_argument("--output", type=Path, required=True)
    build_parser = subparsers.add_parser("build")
    build_parser.add_argument("--source-dir", type=Path, required=True)
    build_parser.add_argument("--row-dir", type=Path, required=True)
    build_parser.add_argument("--tokenizer", required=True)
    build_parser.add_argument("--aime-json", type=Path, required=True)
    build_parser.add_argument("--top-activations", type=Path)
    build_parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.command == "plan":
        print(json.dumps(plan(args.source_dir), separators=(",", ":")))
    elif args.command == "manifest":
        write_feature_manifest(args.graphs, args.output)
    else:
        build(
            args.source_dir,
            args.row_dir,
            args.tokenizer,
            args.aime_json,
            args.top_activations,
            args.output,
        )


if __name__ == "__main__":
    main()
