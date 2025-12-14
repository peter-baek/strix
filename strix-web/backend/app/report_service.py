"""
Report Service - File system integration for scan reports
Connects the API to the Strix scan results in strix_runs directory
"""
import os
import csv
import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import markdown


class ReportService:
    """Service for accessing and converting scan reports from the file system"""

    def __init__(self, strix_runs_dir: str = None):
        if strix_runs_dir is None:
            # Default to strix_runs in the parent directory
            current_dir = Path(__file__).parent
            strix_runs_dir = current_dir.parent.parent.parent / "strix_runs"

        self.strix_runs_dir = Path(strix_runs_dir)
        if not self.strix_runs_dir.exists():
            print(f"Warning: strix_runs directory not found at {self.strix_runs_dir}")

    def scan_filesystem(self) -> Dict[str, dict]:
        """
        Scan the strix_runs directory and return metadata for all scans

        Returns:
            Dict mapping run_name to scan metadata
        """
        scans = {}

        if not self.strix_runs_dir.exists():
            return scans

        for run_dir in self.strix_runs_dir.iterdir():
            if not run_dir.is_dir() or run_dir.name.startswith('.'):
                continue

            report_file = run_dir / "penetration_test_report.md"
            if not report_file.exists():
                continue

            # Extract scan metadata
            metadata = self._extract_metadata(run_dir)
            if metadata:
                scans[run_dir.name] = metadata

        return scans

    def _extract_metadata(self, run_dir: Path) -> Optional[dict]:
        """Extract metadata from a scan directory"""
        try:
            report_file = run_dir / "penetration_test_report.md"
            csv_file = run_dir / "vulnerabilities.csv"

            # Read report to extract generation time
            with open(report_file, 'r', encoding='utf-8') as f:
                content = f.read()
                generated_at = self._extract_generation_time(content)

            # Count vulnerabilities
            vuln_count = 0
            vulnerabilities = []
            if csv_file.exists():
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    vulnerabilities = list(reader)
                    vuln_count = len(vulnerabilities)

            return {
                'run_name': run_dir.name,
                'generated_at': generated_at,
                'vulnerabilities_count': vuln_count,
                'has_report': report_file.exists(),
                'has_csv': csv_file.exists(),
                'path': str(run_dir)
            }
        except Exception as e:
            print(f"Error extracting metadata from {run_dir}: {e}")
            return None

    def _extract_generation_time(self, content: str) -> str:
        """Extract generation time from report markdown"""
        try:
            # Look for "**Generated:** YYYY-MM-DD HH:MM:SS UTC"
            lines = content.split('\n')
            for line in lines:
                if '**Generated:**' in line:
                    time_str = line.split('**Generated:**')[1].strip()
                    return time_str
        except Exception:
            pass
        return datetime.now().isoformat()

    def get_report_content(self, run_name: str) -> Optional[str]:
        """
        Get the full markdown report content for a scan

        Args:
            run_name: The scan run directory name

        Returns:
            Markdown content as string, or None if not found
        """
        run_dir = self.strix_runs_dir / run_name
        report_file = run_dir / "penetration_test_report.md"

        if not report_file.exists():
            return None

        try:
            with open(report_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading report {report_file}: {e}")
            return None

    def get_vulnerability_report(self, run_name: str, vuln_id: str) -> Optional[dict]:
        """
        Get a specific vulnerability report

        Args:
            run_name: The scan run directory name
            vuln_id: Vulnerability ID (e.g., "vuln-0001")

        Returns:
            Dict with vulnerability details including markdown content
        """
        run_dir = self.strix_runs_dir / run_name
        vuln_dir = run_dir / "vulnerabilities"
        vuln_file = vuln_dir / f"{vuln_id}.md"

        if not vuln_file.exists():
            return None

        try:
            with open(vuln_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse vulnerability details from markdown
            details = self._parse_vulnerability_markdown(content)
            details['markdown'] = content
            details['id'] = vuln_id
            details['filePath'] = str(vuln_file)

            return details
        except Exception as e:
            print(f"Error reading vulnerability {vuln_file}: {e}")
            return None

    def _parse_vulnerability_markdown(self, content: str) -> dict:
        """Parse vulnerability details from markdown content"""
        details = {
            'title': '',
            'severity': 'info',
            'timestamp': '',
            'content': content
        }

        lines = content.split('\n')

        # Extract title (first heading)
        for line in lines:
            if line.startswith('# '):
                details['title'] = line[2:].strip()
                break

        # Extract metadata
        for line in lines:
            if '**Severity:**' in line:
                severity = line.split('**Severity:**')[1].strip().lower()
                details['severity'] = severity
            elif '**Found:**' in line:
                timestamp = line.split('**Found:**')[1].strip()
                details['timestamp'] = timestamp

        return details

    def list_vulnerabilities(self, run_name: str) -> List[dict]:
        """
        List all vulnerabilities for a scan

        Args:
            run_name: The scan run directory name

        Returns:
            List of vulnerability dictionaries
        """
        run_dir = self.strix_runs_dir / run_name
        csv_file = run_dir / "vulnerabilities.csv"

        if not csv_file.exists():
            return []

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)
        except Exception as e:
            print(f"Error reading vulnerabilities CSV {csv_file}: {e}")
            return []

    def export_to_json(self, run_name: str) -> Optional[bytes]:
        """Export scan report and vulnerabilities to JSON"""
        report_md = self.get_report_content(run_name)
        vulnerabilities = self.list_vulnerabilities(run_name)

        if report_md is None:
            return None

        data = {
            'run_name': run_name,
            'report': report_md,
            'vulnerabilities': vulnerabilities,
            'exported_at': datetime.now().isoformat()
        }

        return json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8')

    def export_to_csv(self, run_name: str) -> Optional[bytes]:
        """Export vulnerabilities to CSV"""
        run_dir = self.strix_runs_dir / run_name
        csv_file = run_dir / "vulnerabilities.csv"

        if not csv_file.exists():
            return None

        try:
            with open(csv_file, 'rb') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading CSV {csv_file}: {e}")
            return None

    def export_to_markdown(self, run_name: str) -> Optional[bytes]:
        """Export full markdown report"""
        content = self.get_report_content(run_name)
        if content:
            return content.encode('utf-8')
        return None

    def export_to_pdf(self, run_name: str) -> Optional[bytes]:
        """Export report to PDF using weasyprint"""
        try:
            from weasyprint import HTML

            md_content = self.get_report_content(run_name)
            if not md_content:
                return None

            # Convert markdown to HTML
            html_content = markdown.markdown(
                md_content,
                extensions=['extra', 'codehilite', 'tables']
            )

            # Add basic styling
            styled_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    h1 {{ color: #dc2626; }}
                    h2 {{ color: #ea580c; }}
                    h3 {{ color: #f59e0b; }}
                    code {{
                        background: #f3f4f6;
                        padding: 2px 4px;
                        border-radius: 3px;
                    }}
                    pre {{
                        background: #f3f4f6;
                        padding: 10px;
                        border-radius: 5px;
                        overflow-x: auto;
                    }}
                    table {{
                        border-collapse: collapse;
                        width: 100%;
                        margin: 10px 0;
                    }}
                    th, td {{
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }}
                    th {{
                        background-color: #f3f4f6;
                    }}
                </style>
            </head>
            <body>
                {html_content}
            </body>
            </html>
            """

            # Generate PDF
            pdf_bytes = HTML(string=styled_html).write_pdf()
            return pdf_bytes

        except Exception as e:
            print(f"Error generating PDF: {e}")
            return None

    def export_to_format(self, run_name: str, format: str) -> Optional[bytes]:
        """
        Export report in the specified format

        Args:
            run_name: The scan run directory name
            format: One of 'md', 'json', 'csv', 'pdf'

        Returns:
            Bytes of the exported file, or None if failed
        """
        format = format.lower()

        if format == 'md' or format == 'markdown':
            return self.export_to_markdown(run_name)
        elif format == 'json':
            return self.export_to_json(run_name)
        elif format == 'csv':
            return self.export_to_csv(run_name)
        elif format == 'pdf':
            return self.export_to_pdf(run_name)
        else:
            return None
