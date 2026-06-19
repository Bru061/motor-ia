import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.gemini_service import (
    GeminiServiceError,
    generar_ruta_con_gemini,
)


def _respuesta_valida() -> dict:
    return {
        "titulo": "Ruta Backend",
        "modulos": [
            {
                "clave": f"modulo_{orden}",
                "titulo": f"Modulo {orden}",
                "nivel": "junior",
                "orden": orden,
                "tiempo_estimado_hrs": 4,
                "recursos": [
                    {
                        "titulo": f"Recurso {orden}",
                        "tipo": "documentacion",
                        "url": f"https://example.com/{orden}",
                    }
                ],
                "dependencias": [] if orden == 1 else [f"modulo_{orden - 1}"],
            }
            for orden in range(1, 4)
        ],
    }


class _ModelosGeminiFalsos:
    def __init__(self, textos: list[str]):
        self._textos = iter(textos)
        self.llamadas = 0

    def generate_content(self, **_kwargs):
        self.llamadas += 1
        return SimpleNamespace(text=next(self._textos))


class GeminiServiceTests(unittest.TestCase):
    def setUp(self):
        self.perfil = SimpleNamespace(
            meta_profesional="Backend Developer",
            nivel_actual="junior",
            tecnologias=[],
        )

    def test_reintenta_si_el_primer_json_es_invalido(self):
        respuesta_valida = json.dumps(_respuesta_valida())
        modelos = _ModelosGeminiFalsos(["JSON invalido", respuesta_valida])
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            resultado = generar_ruta_con_gemini(self.perfil)

        self.assertEqual(resultado.titulo, "Ruta Backend")
        self.assertEqual(modelos.llamadas, 2)

    def test_rechaza_markdown_y_reintenta(self):
        respuesta_valida = json.dumps(_respuesta_valida())
        modelos = _ModelosGeminiFalsos(
            [f"```json\n{respuesta_valida}\n```", respuesta_valida]
        )
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            resultado = generar_ruta_con_gemini(self.perfil)

        self.assertEqual(resultado.titulo, "Ruta Backend")
        self.assertEqual(modelos.llamadas, 2)

    def test_falla_despues_de_dos_respuestas_invalidas(self):
        modelos = _ModelosGeminiFalsos(["{}", "{}"])
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            with self.assertRaises(GeminiServiceError):
                generar_ruta_con_gemini(self.perfil)

        self.assertEqual(modelos.llamadas, 2)


if __name__ == "__main__":
    unittest.main()
