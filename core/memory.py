from typing import Any, Optional
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore


class MemoryManager:

    def __init__(self):
        self.checkpointer = MemorySaver()
        self.store = InMemoryStore()

    def save_patient_data(self, patient_id: str, key: str, data: dict[str, Any]) -> None:
        self.store.put(
            namespace=("patients", patient_id),
            key=key,
            value=data,
        )

    def get_patient_data(self, patient_id: str, key: str) -> Optional[dict[str, Any]]:
        item = self.store.get(namespace=("patients", patient_id), key=key)
        return item.value if item else None

    def save_timeline_entry(self, patient_id: str, entry_id: str, entry: dict) -> None:
        self.store.put(
            namespace=("timelines", patient_id),
            key=entry_id,
            value=entry,
        )

    def get_all_timeline_entries(self, patient_id: str) -> list[dict]:
        items = self.store.search(namespace=("timelines", patient_id))
        return [item.value for item in items]

    def save_chat_context(self, patient_id: str, context_key: str, context: dict) -> None:
        self.store.put(
            namespace=("chat_context", patient_id),
            key=context_key,
            value=context,
        )

    def get_chat_context(self, patient_id: str, context_key: str) -> Optional[dict]:
        item = self.store.get(namespace=("chat_context", patient_id), key=context_key)
        return item.value if item else None

    def save_dashboard_snapshot(self, patient_id: str, snapshot_id: str, snapshot: dict) -> None:
        self.store.put(
            namespace=("dashboards", patient_id),
            key=snapshot_id,
            value=snapshot,
        )

    def get_dashboard_snapshots(self, patient_id: str) -> list[dict]:
        items = self.store.search(namespace=("dashboards", patient_id))
        return [item.value for item in items]


memory_manager = MemoryManager()
