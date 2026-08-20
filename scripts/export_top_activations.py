#!/usr/bin/env python3
"""Export compact top-activation excerpts for feature nodes in probe-graphs.json.

Run this beside the universal ``scan_all_features.py`` cache and its Arrow
dataset. The output is intentionally small enough to merge into the browser
artifact; it never copies the 445 MB cache into the site.
"""

from __future__ import annotations

import argparse
import glob
import json
import math
from pathlib import Path
from typing import Any

import torch
from datasets import Dataset, concatenate_datasets
from transformers import AutoTokenizer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument("--graphs", type=Path)
    inputs.add_argument("--features", type=Path)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--data-dir", type=Path)
    parser.add_argument("--tokenizer", required=True)
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--excerpt-chars", type=int, default=320)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def load_arrow_dataset(data_dir: Path) -> Any:
    files = sorted(glob.glob(str(data_dir / "data-*.arrow")))
    if not files:
        raise FileNotFoundError(f"No data-*.arrow files under {data_dir}")
    return concatenate_datasets([Dataset.from_file(path) for path in files])


def compact_text(value: Any, limit: int) -> str:
    text = " ".join(str(value).split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def rounded(value: float) -> float:
    return round(value, 4) if math.isfinite(value) else 0.0


def graph_feature_coordinates(graph_payload: dict[str, Any]) -> list[tuple[int, int]]:
    coordinates = {
        (int(node["layer"]), int(node["feature"]))
        for graph in graph_payload["graphs"]
        for node in graph["nodes"]
        if node.get("kind") == "feature"
    }
    return sorted(coordinates)


def load_feature_coordinates(args: argparse.Namespace) -> list[tuple[int, int]]:
    if args.graphs is not None:
        graph_payload = json.loads(args.graphs.read_text(encoding="utf-8"))
        return graph_feature_coordinates(graph_payload)
    manifest = json.loads(args.features.read_text(encoding="utf-8"))
    return sorted(
        tuple(int(value) for value in coordinate.split(":"))
        for coordinate in manifest["features"]
    )


def activation_excerpt(
    tokenizer: Any,
    text: str,
    position: int,
    limit: int,
) -> dict[str, Any]:
    if position < 0:
        return {"peakToken": "", "text": compact_text(text, limit)}
    try:
        encoded = tokenizer(
            text,
            add_special_tokens=True,
            return_offsets_mapping=True,
        )
        token_ids = encoded["input_ids"]
        if position >= len(token_ids):
            return {"peakToken": "", "text": compact_text(text, limit)}
        token = tokenizer.convert_ids_to_tokens(int(token_ids[position]))
        peak_token = str(token).replace("▁", " ")
        peak_start, peak_end = (int(value) for value in encoded["offset_mapping"][position])
        if peak_end <= peak_start:
            return {"peakToken": peak_token, "text": compact_text(text, limit)}

        excerpt_start = max(0, peak_start - limit // 2)
        excerpt_end = min(len(text), excerpt_start + limit)
        excerpt_start = max(0, excerpt_end - limit)
        excerpt = "".join(
            " " if character in "\r\n\t" else character
            for character in text[excerpt_start:excerpt_end]
        )
        return {
            "peakToken": peak_token,
            "text": excerpt,
            "peakStart": peak_start - excerpt_start,
            "peakEnd": peak_end - excerpt_start,
            "prefixOmitted": excerpt_start > 0,
            "suffixOmitted": excerpt_end < len(text),
        }
    except Exception:
        return {"peakToken": "", "text": compact_text(text, limit)}


def main() -> None:
    args = parse_args()
    if args.top_k <= 0 or args.excerpt_chars <= 0:
        raise ValueError("--top-k and --excerpt-chars must be positive")

    coordinates = load_feature_coordinates(args)
    cache = torch.load(
        args.cache,
        map_location="cpu",
        weights_only=False,
        mmap=True,
    )
    data_dir = args.data_dir or Path(str(cache["data_dir"]))
    dataset = load_arrow_dataset(data_dir)
    tokenizer = AutoTokenizer.from_pretrained(args.tokenizer, local_files_only=True)

    n_layers = int(cache["n_layers"])
    n_features = int(cache["n_features"])
    max_chars = int(cache.get("max_chars", 500))
    text_column = str(cache.get("text_column", "answer"))
    exported: dict[str, list[dict[str, Any]]] = {}

    for layer, feature in coordinates:
        key = f"{layer}:{feature}"
        if not 0 <= layer < n_layers or not 0 <= feature < n_features:
            exported[key] = []
            continue
        flat = layer * n_features + feature
        acts = cache["top_act"][flat]
        indices = cache["top_idx"][flat]
        positions = cache["top_pos"][flat]
        examples: list[dict[str, Any]] = []
        for cache_slot in torch.argsort(acts, descending=True)[: args.top_k]:
            slot = int(cache_slot)
            dataset_index = int(indices[slot])
            activation = float(acts[slot])
            if activation <= 0 or not 0 <= dataset_index < len(dataset):
                continue
            raw_text = str(dataset[dataset_index][text_column])
            model_text = raw_text[:max_chars]
            peak_position = int(positions[slot])
            excerpt = activation_excerpt(
                tokenizer,
                model_text,
                peak_position,
                args.excerpt_chars,
            )
            examples.append(
                {
                    "activation": rounded(activation),
                    "datasetIndex": dataset_index,
                    "peakPosition": peak_position,
                    **excerpt,
                }
            )
        exported[key] = examples

    result = {
        "source": str(args.cache),
        "corpus": str(data_dir),
        "nSentences": int(cache["n_sentences"]),
        "topK": args.top_k,
        "features": exported,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    covered = sum(bool(examples) for examples in exported.values())
    print(f"exported {covered}/{len(exported)} feature coordinates")


if __name__ == "__main__":
    main()
