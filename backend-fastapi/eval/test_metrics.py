"""
Unit tests for retrieval metrics.

Every expected value here is hand-computable, so a failure points at the
metric implementation rather than at a fixture.

Run:  pytest eval/test_metrics.py -q
"""

from eval.metrics import (
    aggregate,
    average_precision,
    evaluate_query,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)


class TestPrecisionAtK:
    def test_all_relevant(self):
        assert precision_at_k(["a", "b", "c"], {"a", "b", "c"}, 3) == 1.0

    def test_none_relevant(self):
        assert precision_at_k(["x", "y", "z"], {"a"}, 3) == 0.0

    def test_partial(self):
        # 2 of the top 3 are relevant
        assert precision_at_k(["a", "x", "b"], {"a", "b"}, 3) == 2 / 3

    def test_fewer_results_than_k_is_penalised(self):
        # 1 hit but k=5 was requested -> 1/5, not 1/1. A system that under-
        # returns should not score as though it returned a full page.
        assert precision_at_k(["a"], {"a"}, 5) == 0.2

    def test_k_zero(self):
        assert precision_at_k(["a"], {"a"}, 0) == 0.0


class TestRecallAtK:
    def test_finds_all(self):
        assert recall_at_k(["a", "b"], {"a", "b"}, 2) == 1.0

    def test_finds_half(self):
        assert recall_at_k(["a", "x"], {"a", "b"}, 2) == 0.5

    def test_cutoff_excludes_later_hit(self):
        # "b" sits at rank 3, outside k=2
        assert recall_at_k(["a", "x", "b"], {"a", "b"}, 2) == 0.5

    def test_no_relevant_docs(self):
        assert recall_at_k(["a"], set(), 5) == 0.0


class TestReciprocalRank:
    def test_first_position(self):
        assert reciprocal_rank(["a", "x"], {"a"}) == 1.0

    def test_third_position(self):
        assert reciprocal_rank(["x", "y", "a"], {"a"}) == 1 / 3

    def test_no_hit(self):
        assert reciprocal_rank(["x", "y"], {"a"}) == 0.0


class TestAveragePrecision:
    def test_perfect_ranking(self):
        assert average_precision(["a", "b"], {"a", "b"}) == 1.0

    def test_interleaved(self):
        # hits at ranks 1 and 3 -> (1/1 + 2/3) / 2
        expected = (1.0 + 2 / 3) / 2
        assert abs(average_precision(["a", "x", "b"], {"a", "b"}) - expected) < 1e-9

    def test_rewards_ranking_all_relevant_high(self):
        # Same top hit, different tail ordering -> AP separates them where
        # precision@1 would not.
        better = average_precision(["a", "b", "x"], {"a", "b"})
        worse = average_precision(["a", "x", "b"], {"a", "b"})
        assert better > worse


class TestNDCG:
    def test_perfect_is_one(self):
        assert ndcg_at_k(["a", "b"], {"a", "b"}, 2) == 1.0

    def test_bounded(self):
        score = ndcg_at_k(["x", "a"], {"a", "b"}, 2)
        assert 0.0 <= score <= 1.0

    def test_higher_rank_scores_better(self):
        high = ndcg_at_k(["a", "x", "y"], {"a"}, 3)
        low = ndcg_at_k(["x", "y", "a"], {"a"}, 3)
        assert high > low

    def test_no_relevant_docs(self):
        assert ndcg_at_k(["a"], set(), 3) == 0.0


class TestEvaluateQuery:
    def test_returns_all_metrics(self):
        scores = evaluate_query(["a", "b", "c"], {"a"}, k_values=(1, 3))
        assert set(scores) == {
            "precision@1", "recall@1", "ndcg@1",
            "precision@3", "recall@3", "ndcg@3",
            "mrr", "ap",
        }

    def test_perfect_single_hit(self):
        scores = evaluate_query(["a"], {"a"}, k_values=(1,))
        assert scores["precision@1"] == 1.0
        assert scores["recall@1"] == 1.0
        assert scores["mrr"] == 1.0


class TestAggregate:
    def test_means_across_queries(self):
        result = aggregate([{"precision@1": 1.0}, {"precision@1": 0.0}])
        assert result["precision@1"] == 0.5

    def test_empty_input(self):
        assert aggregate([]) == {}

    def test_missing_key_treated_as_zero(self):
        result = aggregate([{"mrr": 1.0}, {}])
        assert result["mrr"] == 0.5
