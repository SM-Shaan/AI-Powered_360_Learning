"""
Wikipedia Service - External Context Provider for Part 3
Fetches relevant content from Wikipedia to ground AI-generated materials
"""

import httpx
from typing import Optional, List, Dict
import re


class WikipediaService:
    """Service for fetching external context from Wikipedia"""

    BASE_URL = "https://en.wikipedia.org/api/rest_v1"
    SEARCH_URL = "https://en.wikipedia.org/w/api.php"

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "AILearningPlatform/1.0 (Educational Project; contact@example.com)"
            }
        )

    async def search(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search Wikipedia for relevant articles

        Args:
            query: Search query string
            limit: Maximum number of results

        Returns:
            List of search results with title, snippet, and page_id
        """
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": limit,
            "format": "json",
            "utf8": 1
        }

        try:
            response = await self.client.get(self.SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("query", {}).get("search", []):
                # Clean HTML from snippet
                snippet = re.sub(r'<[^>]+>', '', item.get("snippet", ""))
                results.append({
                    "title": item.get("title"),
                    "snippet": snippet,
                    "page_id": item.get("pageid"),
                    "word_count": item.get("wordcount", 0)
                })

            return results
        except Exception as e:
            print(f"Wikipedia search error: {e}")
            return []

    async def get_article_summary(self, title: str) -> Optional[Dict]:
        """
        Get article summary from Wikipedia

        Args:
            title: Wikipedia article title

        Returns:
            Article summary with extract, description, and URL
        """
        # URL encode the title
        encoded_title = title.replace(" ", "_")
        url = f"{self.BASE_URL}/page/summary/{encoded_title}"

        try:
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()

            return {
                "title": data.get("title"),
                "extract": data.get("extract", ""),
                "description": data.get("description", ""),
                "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "thumbnail": data.get("thumbnail", {}).get("source") if data.get("thumbnail") else None
            }
        except Exception as e:
            print(f"Wikipedia article fetch error: {e}")
            return None

    async def get_article_content(self, title: str, max_chars: int = 8000) -> Optional[Dict]:
        """
        Get full article content from Wikipedia (plain text)

        Args:
            title: Wikipedia article title
            max_chars: Maximum characters to return

        Returns:
            Article content with sections
        """
        params = {
            "action": "query",
            "titles": title,
            "prop": "extracts",
            "explaintext": True,
            "exlimit": 1,
            "format": "json"
        }

        try:
            response = await self.client.get(self.SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id != "-1":
                    content = page_data.get("extract", "")
                    # Truncate if too long
                    if len(content) > max_chars:
                        content = content[:max_chars] + "..."

                    return {
                        "title": page_data.get("title"),
                        "content": content,
                        "page_id": page_id
                    }

            return None
        except Exception as e:
            print(f"Wikipedia content fetch error: {e}")
            return None

    async def get_context_for_topic(self, topic: str, max_articles: int = 3) -> Dict:
        """
        Get comprehensive context for a topic from Wikipedia

        Args:
            topic: Topic to search for
            max_articles: Maximum number of articles to fetch

        Returns:
            Combined context from multiple Wikipedia articles
        """
        # Search for relevant articles
        search_results = await self.search(topic, limit=max_articles + 2)

        if not search_results:
            return {
                "topic": topic,
                "found": False,
                "articles": [],
                "combined_context": ""
            }

        # Fetch summaries for top results
        articles = []
        combined_context = []

        for result in search_results[:max_articles]:
            summary = await self.get_article_summary(result["title"])
            if summary:
                articles.append(summary)
                combined_context.append(f"## {summary['title']}\n{summary['extract']}")

        return {
            "topic": topic,
            "found": len(articles) > 0,
            "articles": articles,
            "combined_context": "\n\n".join(combined_context)
        }

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
_wikipedia_service: Optional[WikipediaService] = None


def get_wikipedia_service() -> WikipediaService:
    """Get or create Wikipedia service instance"""
    global _wikipedia_service
    if _wikipedia_service is None:
        _wikipedia_service = WikipediaService()
    return _wikipedia_service
