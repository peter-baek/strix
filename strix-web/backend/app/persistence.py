"""
Persistence Service - Manages scan ID to run_name mappings
Stores mappings in .strix_api_data/scan_mapping.json
"""
import json
import os
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime


class ScanPersistence:
    """Service for persisting scan ID to run_name mappings"""

    def __init__(self, data_dir: str = None):
        if data_dir is None:
            # Default to .strix_api_data in the parent directory
            current_dir = Path(__file__).parent
            data_dir = current_dir.parent.parent.parent / ".strix_api_data"

        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.mapping_file = self.data_dir / "scan_mapping.json"
        self.mappings: Dict[str, dict] = {}
        self._load_mappings()

    def _load_mappings(self):
        """Load mappings from disk"""
        if self.mapping_file.exists():
            try:
                with open(self.mapping_file, 'r', encoding='utf-8') as f:
                    self.mappings = json.load(f)
                print(f"Loaded {len(self.mappings)} scan mappings from {self.mapping_file}")
            except Exception as e:
                print(f"Error loading mappings: {e}")
                self.mappings = {}
        else:
            print(f"No existing mappings file found at {self.mapping_file}")
            self.mappings = {}

    def _save_mappings(self):
        """Save mappings to disk"""
        try:
            with open(self.mapping_file, 'w', encoding='utf-8') as f:
                json.dump(self.mappings, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(self.mappings)} scan mappings to {self.mapping_file}")
        except Exception as e:
            print(f"Error saving mappings: {e}")

    def add_mapping(self, scan_id: str, run_name: str, metadata: dict = None):
        """
        Add or update a scan ID to run_name mapping

        Args:
            scan_id: The API scan ID
            run_name: The strix_runs directory name
            metadata: Optional additional metadata
        """
        mapping = {
            'run_name': run_name,
            'created_at': datetime.now().isoformat(),
            **(metadata or {})
        }

        self.mappings[scan_id] = mapping
        self._save_mappings()

    def get_run_name(self, scan_id: str) -> Optional[str]:
        """
        Get the run_name for a scan ID

        Args:
            scan_id: The API scan ID

        Returns:
            run_name if found, None otherwise
        """
        mapping = self.mappings.get(scan_id)
        if mapping:
            return mapping.get('run_name')
        return None

    def get_scan_id(self, run_name: str) -> Optional[str]:
        """
        Get the scan ID for a run_name (reverse lookup)

        Args:
            run_name: The strix_runs directory name

        Returns:
            scan_id if found, None otherwise
        """
        for scan_id, mapping in self.mappings.items():
            if mapping.get('run_name') == run_name:
                return scan_id
        return None

    def get_mapping(self, scan_id: str) -> Optional[dict]:
        """
        Get the full mapping data for a scan ID

        Args:
            scan_id: The API scan ID

        Returns:
            Mapping dict if found, None otherwise
        """
        return self.mappings.get(scan_id)

    def get_all_mappings(self) -> Dict[str, dict]:
        """Get all scan mappings"""
        return self.mappings.copy()

    def remove_mapping(self, scan_id: str) -> bool:
        """
        Remove a scan mapping

        Args:
            scan_id: The API scan ID

        Returns:
            True if removed, False if not found
        """
        if scan_id in self.mappings:
            del self.mappings[scan_id]
            self._save_mappings()
            return True
        return False

    def clear_mappings(self):
        """Clear all mappings"""
        self.mappings = {}
        self._save_mappings()
