import logging
from typing import Any, Optional

from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError

from app.core.config import settings

logger = logging.getLogger(__name__)


class Neo4jClient:
    def __init__(self) -> None:
        self.enabled = settings.NEO4J_GRAPH_ENABLED
        self.database = settings.NEO4J_DATABASE
        self._driver = None

        if not self.enabled:
            logger.info("Neo4j graph is disabled by feature flag")
            return

        if not settings.NEO4J_PASSWORD:
            logger.warning("Neo4j feature enabled but NEO4J_PASSWORD is not set; graph layer will stay unavailable")
            return

        try:
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
        except Exception as exc:
            logger.exception("Failed to initialize Neo4j driver: %s", exc)
            self._driver = None

    @property
    def available(self) -> bool:
        return self.enabled and self._driver is not None

    def verify_connection(self) -> dict[str, Any]:
        if not self.enabled:
            return {"enabled": False, "available": False, "reason": "feature_flag_disabled"}

        if self._driver is None:
            return {"enabled": True, "available": False, "reason": "driver_not_initialized"}

        try:
            with self._driver.session(database=self.database) as session:
                result = session.run("MATCH (n) RETURN n LIMIT 1")
                record = result.single()
            return {
                "enabled": True,
                "available": True,
                "reason": "ok",
                "has_any_node": record is not None,
            }
        except Exception as exc:
            logger.exception("Neo4j connectivity check failed: %s", exc)
            return {"enabled": True, "available": False, "reason": str(exc)}

    def run_read_query(self, query: str, params: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
        if not self.available:
            return []

        query_params = params or {}

        try:
            with self._driver.session(database=self.database) as session:
                result = session.run(query, query_params)
                return [record.data() for record in result]
        except Neo4jError as exc:
            logger.exception("Neo4j read query failed: %s", exc)
            return []
        except Exception as exc:
            logger.exception("Unexpected Neo4j error: %s", exc)
            return []

    def run_write_query(self, query: str, params: Optional[dict[str, Any]] = None) -> None:
        if not self.available:
            return

        query_params = params or {}

        try:
            with self._driver.session(database=self.database) as session:
                session.run(query, query_params)
        except Neo4jError as exc:
            logger.exception("Neo4j write query failed: %s", exc)
        except Exception as exc:
            logger.exception("Unexpected Neo4j error: %s", exc)

    def close(self) -> None:
        if self._driver is not None:
            self._driver.close()


neo4j_client = Neo4jClient()
