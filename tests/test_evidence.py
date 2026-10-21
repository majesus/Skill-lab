"""Regression tests with synthetic data; Python 3.9+, standard library only."""
import csv
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

BASE = Path(__file__).resolve().parents[1]
SKILLS = BASE / 'skills' if (BASE / 'skills').is_dir() else BASE.parents[2] / 'inst/skills'
VERIFY = SKILLS / 'bibliometria-paper/scripts/verificar_afirmaciones.py'
INVENTORY = SKILLS / 'bibliometria-paper/scripts/inventario_entrega.py'


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.corpus = self.root / 'corpus'
        self.corpus.mkdir()
        self.registry = self.root / 'afirmaciones.csv'

    def write(self, target, header, rows):
        with target.open('w', encoding='utf-8', newline='') as f:
            w = csv.writer(f, delimiter=';')
            w.writerow(header)
            w.writerows(rows)

    def run_claim(self, rule, declared, column='', filename='datos.csv', filter_column='', filter_value=''):
        self.write(self.registry, ['id', 'archivo', 'columna', 'regla', 'valor_declarado', 'filtro_columna', 'filtro_valor'],
                   [['A1', filename, column, rule, declared, filter_column, filter_value]])
        result = subprocess.run([sys.executable, '-B', str(VERIFY), str(self.corpus), str(self.registry)], capture_output=True, text=True, encoding='utf-8')
        rows = list(csv.DictReader(result.stdout.splitlines(), delimiter=';'))
        return result, rows

    def test_large_counts_do_not_pass_with_relative_tolerance(self):
        self.write(self.corpus / 'datos.csv', ['id'], [[i] for i in range(1000)])
        result, rows = self.run_claim('n_filas', '1001')
        self.assertEqual(result.returncode, 1)
        self.assertEqual(rows[0]['estado'], 'DISCREPANCIA')

    def test_zero_rows_are_a_verifiable_zero_count(self):
        self.write(self.corpus / 'datos.csv', ['id'], [])
        result, rows = self.run_claim('n_filas', '0')
        self.assertEqual(result.returncode, 0)
        self.assertEqual(rows[0]['recalculado'], '0')
        result, _ = self.run_claim('media', '0', 'id')
        self.assertEqual(result.returncode, 1)

    def test_percentages_and_missing_values(self):
        self.write(self.corpus / 'datos.csv', ['tipo', 'citas'], [['A', '10'], ['B', 'NA'], ['B', '0'], ['B', '10']])
        result, rows = self.run_claim('proporcion', '25%', filter_column='tipo', filter_value='A')
        self.assertEqual(result.returncode, 0)
        self.assertEqual(rows[0]['recalculado'], '0.25')
        result, rows = self.run_claim('media', '6,66666667', 'citas')
        self.assertEqual(result.returncode, 0)

    def test_paths_cannot_read_outside_the_delivery(self):
        self.write(self.root / 'secreto.csv', ['valor'], [['12']])
        result, rows = self.run_claim('suma', '12', 'valor', '../secreto.csv')
        self.assertEqual(result.returncode, 1)
        self.assertIn('fuera', rows[0]['detalle'])

    def test_nonfinite_numeric_cells_are_not_laundered_as_text(self):
        for value in ['inf', '1e309', '1,000.50']:
            self.write(self.corpus / 'datos.csv', ['valor'], [[value]])
            result, rows = self.run_claim('celda', value, 'valor')
            self.assertEqual(result.returncode, 1)

    def test_manual_inspection_does_not_claim_verification(self):
        result, rows = self.run_claim('inspeccion', 'hipotesis')
        self.assertEqual(rows[0]['estado'], 'REVISION MANUAL')
        self.assertIn('0/1 recalculadas', result.stderr)

    def test_csv_output_quotes_semicolons(self):
        self.write(self.corpus / 'datos.csv', ['texto'], [['a;b']])
        result, rows = self.run_claim('celda', 'a;b', 'texto')
        self.assertEqual(result.returncode, 0)
        self.assertEqual(rows[0]['declarado'], 'a;b')

    def test_inventory_detects_nested_skills_in_folder_and_zip(self):
        skill = self.corpus / 'skills/prueba/SKILL.md'
        skill.parent.mkdir(parents=True)
        skill.write_text('Prueba', encoding='utf-8')
        (self.corpus / 'parametros.json').write_text('{}', encoding='utf-8')
        archive = self.root / 'entrega.zip'
        with zipfile.ZipFile(archive, 'w') as z:
            for f in self.corpus.rglob('*'):
                if f.is_file():
                    z.write(f, 'entrega/' + f.relative_to(self.corpus).as_posix())
        for source in [self.corpus, archive]:
            result = subprocess.run([sys.executable, '-B', str(INVENTORY), str(source), '--json'], capture_output=True, text=True, encoding='utf-8')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(json.loads(result.stdout)['carpeta_skills_incluida'])


if __name__ == '__main__':
    unittest.main()
