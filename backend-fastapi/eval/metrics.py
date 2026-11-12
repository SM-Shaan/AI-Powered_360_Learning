"""
Retrieval and answer metrics.

Pure functions over ranked ID lists - no I/O, no service dependencies, so they
are cheap to unit test and reusable across retrieval configurations.

Conventions used throughout:
  retrieved: ranked list of IDs, best first
  relevant:  set of IDs that *should* be retrieved (ground truth)
"""

from typing import Dict, Iterable, List, Sequence, Set


def precision_at_k(retrieved: Sequence[str], relevant: Set[str], k: int) -> float:
    """
    Fraction of the top-k results that are relevant.

    Answers "when the system shows k results, how much is signal?"
    Divided by k rather than by len(top_k) so a system that returns fewer
    than k results is penalised - returning 1 correct result out of a
    requested 5 is not precision 1.0.
    """
    if k <= 0:
        return 0.0
    top_k = list(retrieved)[:k]
    hits = sum(1 for doc_id in top_k if doc_id in relevant)
    return hits / k


def recall_at_k(retrieved: Sequence[str], relevant: Set[str], k: int) -> float:
    """
    Fraction of all relevant documents that appear in the top k.

    Answers "of everything the system should have found, how much did it?"
    """
    if not relevant:
        return 0.0
    top_k = set(list(retrieved)[:k])
    return len(top_k & relevant) / len(relevant)


def reciprocal_rank(retrieved: Sequence[str], relevant: Set[str]) -> float:
    """
    1 / rank of the first relevant result, or 0 if none is found.

    Sensitive to *where* the first good answer lands, which matters for RAG:
    a correct chunk at rank 1 vs rank 8 produces very different answers once
    the context window is truncated.
    """
    for index, doc_id in enumerate(retrieved, start=1):
        if doc_id in relevant:
            return 1.0 / index
    return 0.0


def average_precision(retrieved: Sequence[str], relevant: Set[str]) -> float:
    """
    Mean of the precision values taken at each relevant hit.

    Unlike precision@k this rewards ranking *all* relevant items highly, not
    just the first one, so it separates two systems that share a top hit but
    differ further down.
    """
    if not relevant:
        return 0.0

    hits = 0
    precision_sum = 0.0
    for index, doc_id in enumerate(retrieved, start=1):
        if doc_id in relevant:
            hits += 1
            precision_sum += hits / index

    return precision_sum / len(relevant)


def dcg_at_k(retrieved: Sequence[str], relevant: Set[str], k: int) -> float:
    """Discounted cumulative gain with binary relevance."""
    from math import log2

    gain = 0.0
    for index, doc_id in enumerate(list(retrieved)[:k], start=1):
        if doc_id in relevant:
            gain += 1.0 / log2(index + 1)
    return gain


def ndcg_at_k(retrieved: Sequence[str], relevant: Set[str], k: int) -> float:
    """
    DCG normalised by the best achievable DCG for this query.

    Bounded 0-1 so it is comparable across queries with different numbers of
    relevant documents (raw DCG is not).
    """
    if not relevant:
        return 0.0

    ideal_order = list(relevant)[:k]
    ideal = dcg_at_k(ideal_order, relevant, k)
    if ideal == 0:
        return 0.0

    return dcg_at_k(retrieved, relevant, k) / ideal


def evaluate_query(
    retrieved: Sequence[str],
    relevant: Set[str],
    k_values: Iterable[int] = (1, 3, 5),
) -> Dict[str, float]:
    """Compute the full metric set for a single query."""
    scores: Dict[str, float] = {}

    for k in k_values:
        scores[f"precision@{k}"] = precision_at_k(retrieved, relevant, k)
        scores[f"recall@{k}"] = recall_at_k(retrieved, relevant, k)
        scores[f"ndcg@{k}"] = ndcg_at_k(retrieved, relevant, k)

    scores["mrr"] = reciprocal_rank(retrieved, relevant)
    scores["ap"] = average_precision(retrieved, relevant)
    return scores


def aggregate(per_query: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Mean of each metric across queries.

    Mean-of-per-query (macro) rather than pooling all results, so every query
    carries equal weight regardless of how many relevant chunks it has.
    """
    if not per_query:
        return {}

    keys = per_query[0].keys()
    return {
        key: sum(scores.get(key, 0.0) for scores in per_query) / len(per_query)
        for key in keys
    }
