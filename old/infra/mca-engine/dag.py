"""Resolve ordem de execução dos micro-agentes MCA (topological sort)."""

from __future__ import annotations

from collections import defaultdict, deque


def resolve_agent_order(
    agents: dict[str, dict],
    requested_ids: list[str] | None = None,
) -> list[str]:
    """
    agents: map agent_id -> { depends_on: [...] }
    requested_ids: subset; if None, all keys in agents.
    """
    if requested_ids is None:
        requested_ids = list(agents.keys())
    requested = set(requested_ids)
    for aid in list(requested):
        for dep in agents.get(aid, {}).get("depends_on") or []:
            if dep in agents:
                requested.add(dep)

    in_degree: dict[str, int] = {a: 0 for a in requested}
    graph: dict[str, list[str]] = defaultdict(list)

    for aid in requested:
        for dep in agents.get(aid, {}).get("depends_on") or []:
            if dep not in requested:
                continue
            graph[dep].append(aid)
            in_degree[aid] += 1

    queue = deque([a for a in requested if in_degree[a] == 0])
    order: list[str] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(requested):
        missing = requested - set(order)
        raise ValueError(f"DAG cycle or missing deps: {missing}")
    return order
