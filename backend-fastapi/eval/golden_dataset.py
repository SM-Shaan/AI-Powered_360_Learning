"""
Golden dataset for RAG evaluation.

A small, self-contained CS course corpus plus queries whose correct chunks are
known. Self-contained on purpose: the eval must produce comparable numbers on
any machine, so it seeds its own content rather than depending on whatever
happens to be uploaded to the database.

Design notes for the queries:
  - Paraphrase rather than quote. A query that reuses the chunk's own wording
    is solved by keyword matching alone and tells you nothing about semantic
    retrieval.
  - Include near-miss distractor documents (e.g. linear vs binary search) so
    precision has something to actually discriminate.
  - `relevant_chunks` is the ground truth: chunk keys that genuinely answer
    the query.
"""

from typing import Dict, List, TypedDict


class Document(TypedDict):
    key: str
    title: str
    category: str
    content_type: str
    topic: str
    text: str


class Query(TypedDict):
    id: str
    question: str
    relevant_chunks: List[str]
    category: str
    difficulty: str


# --- Corpus ------------------------------------------------------------------

DOCUMENTS: List[Document] = [
    {
        "key": "binary_search",
        "title": "Binary Search",
        "category": "theory",
        "content_type": "notes",
        "topic": "Searching Algorithms",
        "text": (
            "Binary search locates a target value within a sorted array by "
            "repeatedly dividing the search interval in half. It compares the "
            "target against the middle element; if they are unequal, the half "
            "in which the target cannot lie is eliminated and the search "
            "continues on the remaining half. This halving gives a worst-case "
            "time complexity of O(log n). The array must be sorted beforehand, "
            "which is the main precondition for correctness."
        ),
    },
    {
        "key": "linear_search",
        "title": "Linear Search",
        "category": "theory",
        "content_type": "notes",
        "topic": "Searching Algorithms",
        "text": (
            "Linear search examines each element of a collection in sequence "
            "until the target is found or the collection is exhausted. It "
            "requires no ordering of the input, which makes it applicable to "
            "unsorted data, but its worst-case running time is O(n). For small "
            "collections the simplicity often outweighs the asymptotic cost."
        ),
    },
    {
        "key": "quicksort",
        "title": "Quicksort",
        "category": "theory",
        "content_type": "notes",
        "topic": "Sorting Algorithms",
        "text": (
            "Quicksort is a divide-and-conquer sorting algorithm. It selects a "
            "pivot element and partitions the array so that smaller elements "
            "precede the pivot and larger elements follow it, then recursively "
            "sorts the partitions. Average-case complexity is O(n log n), but a "
            "poorly chosen pivot degrades it to O(n squared). It sorts in place "
            "and is not stable."
        ),
    },
    {
        "key": "mergesort",
        "title": "Merge Sort",
        "category": "theory",
        "content_type": "notes",
        "topic": "Sorting Algorithms",
        "text": (
            "Merge sort divides the array into halves, sorts each half "
            "recursively, and merges the sorted halves. It guarantees O(n log n) "
            "in all cases including the worst case, and it is stable, preserving "
            "the relative order of equal elements. The cost is O(n) auxiliary "
            "space for the merge step, unlike in-place sorts."
        ),
    },
    {
        "key": "hash_table",
        "title": "Hash Tables",
        "category": "theory",
        "content_type": "notes",
        "topic": "Data Structures",
        "text": (
            "A hash table maps keys to values using a hash function that "
            "computes an index into an array of buckets. Average-case lookup, "
            "insertion, and deletion are O(1). Collisions, where two keys hash "
            "to the same bucket, are handled by separate chaining or open "
            "addressing. A poor hash function or high load factor degrades "
            "performance toward O(n)."
        ),
    },
    {
        "key": "linked_list",
        "title": "Linked Lists",
        "category": "theory",
        "content_type": "notes",
        "topic": "Data Structures",
        "text": (
            "A linked list stores elements in nodes, each holding a value and a "
            "reference to the next node. Insertion and deletion at a known "
            "position are O(1) because only pointers change, but access by "
            "index requires walking the list, giving O(n) lookup. Unlike arrays, "
            "linked lists do not require contiguous memory."
        ),
    },
    {
        "key": "bfs",
        "title": "Breadth-First Search",
        "category": "theory",
        "content_type": "notes",
        "topic": "Graph Algorithms",
        "text": (
            "Breadth-first search explores a graph level by level, visiting all "
            "neighbours of a node before moving deeper. It uses a queue to track "
            "the frontier. On an unweighted graph BFS finds the shortest path in "
            "terms of edge count. Time complexity is O(V + E) for V vertices and "
            "E edges."
        ),
    },
    {
        "key": "dfs",
        "title": "Depth-First Search",
        "category": "theory",
        "content_type": "notes",
        "topic": "Graph Algorithms",
        "text": (
            "Depth-first search follows a path as far as possible before "
            "backtracking. It is naturally expressed with recursion or an "
            "explicit stack. DFS is used for cycle detection, topological "
            "sorting, and finding connected components. Time complexity is "
            "O(V + E), but it does not guarantee shortest paths."
        ),
    },
    {
        "key": "recursion",
        "title": "Recursion and Base Cases",
        "category": "theory",
        "content_type": "notes",
        "topic": "Programming Fundamentals",
        "text": (
            "A recursive function calls itself on a smaller instance of the same "
            "problem. Every recursion needs a base case that terminates without "
            "recursing, otherwise it recurses until the call stack overflows. "
            "Each pending call consumes stack space, so deep recursion can "
            "exhaust memory where an iterative version would not."
        ),
    },
    {
        "key": "big_o",
        "title": "Big-O Notation",
        "category": "theory",
        "content_type": "notes",
        "topic": "Complexity Analysis",
        "text": (
            "Big-O notation describes an upper bound on how an algorithm's "
            "running time or space grows as input size increases. It discards "
            "constant factors and lower-order terms to characterise scaling "
            "behaviour. O(1) is constant, O(log n) logarithmic, O(n) linear, and "
            "O(n squared) quadratic. It describes growth, not absolute speed on "
            "any particular input."
        ),
    },
    {
        "key": "stack_queue",
        "title": "Stacks and Queues",
        "category": "theory",
        "content_type": "notes",
        "topic": "Data Structures",
        "text": (
            "A stack is a last-in-first-out structure supporting push and pop at "
            "one end. A queue is first-in-first-out, with enqueue at the back and "
            "dequeue at the front. Stacks back function-call management and "
            "expression evaluation; queues back scheduling and breadth-first "
            "traversal. Both offer O(1) insertion and removal."
        ),
    },
    {
        "key": "binary_tree",
        "title": "Binary Search Trees",
        "category": "theory",
        "content_type": "notes",
        "topic": "Data Structures",
        "text": (
            "A binary search tree keeps every node's left subtree smaller than "
            "the node and its right subtree larger. This ordering allows lookup, "
            "insertion, and deletion in O(log n) time when the tree is balanced. "
            "Inserting sorted data without rebalancing degenerates the tree into "
            "a linked list with O(n) operations, which is what self-balancing "
            "variants such as AVL and red-black trees prevent."
        ),
    },
]


# --- Queries -----------------------------------------------------------------

QUERIES: List[Query] = [
    # Direct factual lookup
    {
        "id": "q01",
        "question": "How do I find an item in a sorted list quickly?",
        "relevant_chunks": ["binary_search"],
        "category": "theory",
        "difficulty": "easy",
    },
    {
        "id": "q02",
        "question": "What does O(log n) mean for algorithm performance?",
        "relevant_chunks": ["big_o", "binary_search"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q03",
        "question": "Which sorting algorithm gives predictable performance in every case?",
        "relevant_chunks": ["mergesort"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q04",
        "question": "Why might a sort be fast on average but slow occasionally?",
        "relevant_chunks": ["quicksort"],
        "category": "theory",
        "difficulty": "hard",
    },
    {
        "id": "q05",
        "question": "How are key-value pairs stored for constant time lookup?",
        "relevant_chunks": ["hash_table"],
        "category": "theory",
        "difficulty": "easy",
    },
    {
        "id": "q06",
        "question": "What happens when two keys map to the same slot?",
        "relevant_chunks": ["hash_table"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q07",
        "question": "Which data structure lets me insert without shifting elements?",
        "relevant_chunks": ["linked_list"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q08",
        "question": "How do I find the shortest route between two points in a network?",
        "relevant_chunks": ["bfs"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q09",
        "question": "Which graph traversal uses a stack and can detect cycles?",
        "relevant_chunks": ["dfs"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q10",
        "question": "Why does my recursive function crash with a stack overflow?",
        "relevant_chunks": ["recursion"],
        "category": "theory",
        "difficulty": "easy",
    },
    {
        "id": "q11",
        "question": "What is the difference between LIFO and FIFO ordering?",
        "relevant_chunks": ["stack_queue"],
        "category": "theory",
        "difficulty": "easy",
    },
    {
        "id": "q12",
        "question": "Why does my tree become slow after inserting ordered data?",
        "relevant_chunks": ["binary_tree"],
        "category": "theory",
        "difficulty": "hard",
    },
    # Multi-document: correct answers span more than one chunk
    {
        "id": "q13",
        "question": "Compare the two ways of traversing a graph.",
        "relevant_chunks": ["bfs", "dfs"],
        "category": "theory",
        "difficulty": "medium",
    },
    {
        "id": "q14",
        "question": "What are the tradeoffs between different sorting approaches?",
        "relevant_chunks": ["quicksort", "mergesort"],
        "category": "theory",
        "difficulty": "hard",
    },
    {
        "id": "q15",
        "question": "When should I search sequentially instead of by halving?",
        "relevant_chunks": ["linear_search", "binary_search"],
        "category": "theory",
        "difficulty": "hard",
    },
    # Conceptual, no shared vocabulary with the source text
    {
        "id": "q16",
        "question": "How does memory layout differ between arrays and node-based structures?",
        "relevant_chunks": ["linked_list"],
        "category": "theory",
        "difficulty": "hard",
    },
    {
        "id": "q17",
        "question": "What guarantees element order is preserved when values tie?",
        "relevant_chunks": ["mergesort"],
        "category": "theory",
        "difficulty": "hard",
    },
    {
        "id": "q18",
        "question": "How do I describe how an algorithm scales with input size?",
        "relevant_chunks": ["big_o"],
        "category": "theory",
        "difficulty": "easy",
    },
    {
        "id": "q19",
        "question": "Which structure supports the call stack of a running program?",
        "relevant_chunks": ["stack_queue", "recursion"],
        "category": "theory",
        "difficulty": "hard",
    },
    {
        "id": "q20",
        "question": "What precondition must hold before halving the search space?",
        "relevant_chunks": ["binary_search"],
        "category": "theory",
        "difficulty": "medium",
    },
]


def documents_by_key() -> Dict[str, Document]:
    return {doc["key"]: doc for doc in DOCUMENTS}


def summary() -> Dict[str, int]:
    multi = sum(1 for q in QUERIES if len(q["relevant_chunks"]) > 1)
    return {
        "documents": len(DOCUMENTS),
        "queries": len(QUERIES),
        "multi_document_queries": multi,
        "easy": sum(1 for q in QUERIES if q["difficulty"] == "easy"),
        "medium": sum(1 for q in QUERIES if q["difficulty"] == "medium"),
        "hard": sum(1 for q in QUERIES if q["difficulty"] == "hard"),
    }
